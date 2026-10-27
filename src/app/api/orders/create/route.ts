import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/rateLimit';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { calculateCodAdvance } from '@/lib/shipping/codAdvance';
import { sendOrderToDelhiveryPending } from '@/lib/shipping/delhiveryPending';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: max 10 checkout attempts per min per IP
    const rateLimitError = enforceRateLimit(req, 'checkout_create', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    // 2. Authentication Check: Guest checkouts permitted without sign-in
    const session = await getServerSession();


    // 2. Strict Zod Schema Validation
    const body = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid delivery or checkout information' },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      paymentMethod,
      items,
      couponCode,
    } = parsed.data;

    // 3. Authoritative Product Verification & Stock Check from Database
    const productIds = items.map((it) => it.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const verifiedOrderItems: Array<{
      productId: string;
      productName: string;
      productImage?: string | null;
      price: number;
      quantity: number;
      total: number;
    }> = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product '${item.id}' is no longer available in store catalog.` },
          { status: 400 }
        );
      }

      // Check Inventory Stock
      if (dbProduct.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for '${dbProduct.name}'. Available: ${dbProduct.stockQuantity}, requested: ${item.quantity}.`,
          },
          { status: 400 }
        );
      }

      // Authoritative Price from DB (never trust client)
      const authoritativeUnitPrice =
        dbProduct.salePrice !== null && dbProduct.salePrice > 0
          ? dbProduct.salePrice
          : dbProduct.regularPrice;

      const itemTotal = authoritativeUnitPrice * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedOrderItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        productImage: item.image || null,
        price: authoritativeUnitPrice,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // 4. Authoritative Server-Side Coupon Verification
    let calculatedDiscount = 0;
    let validatedCouponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.active) {
        const now = new Date();
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= now;
        const meetsMinAmount = calculatedSubtotal >= (coupon.minOrderValue || 0);
        const withinUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;

        if (notExpired && meetsMinAmount && withinUsageLimit) {
          validatedCouponId = coupon.id;
          if (coupon.discountType === 'PERCENTAGE') {
            calculatedDiscount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
              calculatedDiscount = coupon.maxDiscount;
            }
          } else {
            calculatedDiscount = Math.min(coupon.discountValue, calculatedSubtotal);
          }
        }
      }
    }

    // 5. Authoritative Shipping Fee:
    // For prepaid orders (RAZORPAY, ONLINE, UPI, CARD): FREE Delivery (₹0 delivery fee)
    // For COD: Free if >= freeShippingThreshold, else standardShippingFee
    const isPrepaidOrder = paymentMethod !== 'COD';

    const [
      feeSetting,
      thresholdSetting,
      codAvailableSetting,
      codAdvanceEnabledSetting,
      codAdvanceTypeSetting,
      codAdvanceValueSetting,
      codAdvanceMaxCapSetting,
    ] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: 'standard_shipping_fee' } }),
      prisma.siteSetting.findUnique({ where: { key: 'free_shipping_threshold' } }),
      prisma.siteSetting.findUnique({ where: { key: 'cod_available' } }),
      prisma.siteSetting.findUnique({ where: { key: 'cod_advance_enabled' } }),
      prisma.siteSetting.findUnique({ where: { key: 'cod_advance_type' } }),
      prisma.siteSetting.findUnique({ where: { key: 'cod_advance_value' } }),
      prisma.siteSetting.findUnique({ where: { key: 'cod_advance_max_cap' } }),
    ]);

    if (paymentMethod === 'COD' && codAvailableSetting?.value === 'false') {
      return NextResponse.json(
        { error: 'Cash on Delivery is currently disabled for this store.' },
        { status: 400 }
      );
    }

    const authoritativeStandardFee = feeSetting?.value ? Number(feeSetting.value) : 89;
    const authoritativeThreshold = thresholdSetting?.value ? Number(thresholdSetting.value) : 499;

    const calculatedShippingFee = isPrepaidOrder
      ? 0
      : (calculatedSubtotal >= authoritativeThreshold ? 0 : authoritativeStandardFee);

    // 6. Final Authoritative Payable Total
    const calculatedFinalTotal = Math.max(
      0,
      calculatedSubtotal - calculatedDiscount + calculatedShippingFee
    );

    // 6.1 Server-authoritative COD Advance calculation
    const codAdvanceCalc = calculateCodAdvance(
      calculatedFinalTotal,
      {
        enabled: codAvailableSetting?.value !== 'false' && codAdvanceEnabledSetting?.value === 'true',
        type: (codAdvanceTypeSetting?.value as 'FIXED' | 'PERCENTAGE') || 'FIXED',
        value: codAdvanceValueSetting?.value ? Number(codAdvanceValueSetting.value) : 0,
        maxCap: codAdvanceMaxCapSetting?.value ? Number(codAdvanceMaxCapSetting.value) : null,
      },
      paymentMethod
    );

    const isCodWithAdvance = codAdvanceCalc.isApplicable;
    const advanceAmount = codAdvanceCalc.advanceAmount;
    const codBalanceAmount = codAdvanceCalc.balanceAmount;
    const advanceSettingsSnapshot = codAdvanceCalc.snapshot
      ? JSON.stringify(codAdvanceCalc.snapshot)
      : null;

    const fullShippingAddress = JSON.stringify({
      name,
      phone,
      address,
      city,
      state,
      pincode,
    });

    const matchedUserId = session?.user?.id || null;
    const userEmail = (session?.user?.email || email || '').trim().toLowerCase();
    const authoritativeEmail = userEmail || `guest_${phone}@herbiccure.com`;
    let matchedCustomerId: string | null = null;

    if (userEmail) {
      const existingCustomerRecord = await prisma.customer.findUnique({
        where: { email: userEmail },
      });
      if (existingCustomerRecord) {
        matchedCustomerId = existingCustomerRecord.id;
      } else {
        try {
          const newCustomer = await prisma.customer.create({
            data: {
              name,
              email: userEmail,
              phone,
            },
          });
          matchedCustomerId = newCustomer.id;
        } catch {
          // Fallback: customer record creation non-fatal
        }
      }
    }

    const orderNumber = `HC-${Date.now().toString().slice(-6)}`;
    const isOnlinePayment = paymentMethod !== 'COD' || isCodWithAdvance;
    const payableOnlineAmount = isCodWithAdvance ? advanceAmount : calculatedFinalTotal;
    const requiresGatewaySession = isOnlinePayment && payableOnlineAmount > 0;

    // 6.2 If Online or COD with Advance, create Razorpay gateway order FIRST
    // If Razorpay gateway credentials fail or are invalid, fail fast before writing to DB
    let razorpaySession: {
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    } | null = null;

    if (requiresGatewaySession) {
      try {
        const rzOrder = await createRazorpayOrder({
          orderNumber,
          amount: payableOnlineAmount,
          customerName: name,
          customerEmail: authoritativeEmail,
          customerPhone: phone,
          notes: {
            orderNumber,
            isCodAdvance: isCodWithAdvance ? 'true' : 'false',
          },
        });

        if (!rzOrder?.razorpayOrderId) {
          throw new Error('Razorpay did not return a valid order ID');
        }

        razorpaySession = {
          razorpayOrderId: rzOrder.razorpayOrderId,
          amount: rzOrder.amount,
          currency: rzOrder.currency,
          keyId: rzOrder.keyId,
        };
      } catch (rzErr: any) {
        logger.warn('payment.razorpay.create_order_failed', { error: rzErr?.message });
        const isAuthError =
          rzErr?.statusCode === 401 ||
          String(rzErr?.message || '').includes('401') ||
          String(rzErr?.error?.description || '').toLowerCase().includes('auth') ||
          String(rzErr?.message || '').toLowerCase().includes('auth');

        const userMessage = isAuthError
          ? 'Razorpay Authentication Failed: RAZORPAY_KEY_SECRET in .env is invalid. Please copy your Secret Key from your Razorpay Dashboard (Settings > API Keys).'
          : (rzErr?.message || 'Failed to initialize online payment session with Razorpay');

        return NextResponse.json(
          { error: userMessage },
          { status: 400 }
        );
      }
    }

    // 6.1 Order starts in 'Pending AWB' status (unmanifested).
    // To protect against fake orders and prevent premature Delhivery wallet deductions,
    // shipments are NOT auto-manifested on checkout. The store admin verifies and accepts
    // the order in the Admin Dashboard, which then manifests with Delhivery and generates the AWB.
    const delhiveryAwb: string | null = null;
    const delhiveryTrackingUrl: string | null = null;

    // 7. Atomic Database Transaction: Order Creation + Stock Decrement + Coupon Usage
    // Standard COD orders without advance start as CONFIRMED.
    // Prepaid orders and COD orders with advance start as PENDING and only become CONFIRMED when Razorpay payment is verified!
    const initialOrderStatus = requiresGatewaySession ? 'PENDING' : 'CONFIRMED';

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Create the verified order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: matchedUserId,
          customerId: matchedCustomerId,
          customerName: name,
          customerEmail: authoritativeEmail,
          customerPhone: phone,
          shippingAddress: fullShippingAddress,
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          shippingFee: calculatedShippingFee,
          total: calculatedFinalTotal,
          advanceAmount,
          codBalanceAmount,
          advanceSettingsSnapshot,
          couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
          paymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: initialOrderStatus,
          carrier: 'Delhivery',
          trackingNumber: delhiveryAwb || null,
          trackingUrl: delhiveryTrackingUrl || null,
          items: {
            create: verifiedOrderItems,
          },
        } as any,
      });

      // Atomically decrement inventory stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // If valid coupon was used, increment usage count atomically
      if (validatedCouponId) {
        await tx.coupon.update({
          where: { id: validatedCouponId },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Upsert or update customer record for repeat tracking
      if (userEmail) {
        try {
          const existingCustomer = await tx.customer.findUnique({
            where: { email: userEmail },
          });

          if (existingCustomer) {
            await tx.customer.update({
              where: { id: existingCustomer.id },
              data: {
                totalOrders: { increment: 1 },
                totalSpend: { increment: calculatedFinalTotal },
                phone: existingCustomer.phone || phone,
                name: existingCustomer.name || name,
              },
            });
          } else {
            await tx.customer.create({
              data: {
                email: userEmail,
                name,
                phone,
                totalOrders: 1,
                totalSpend: calculatedFinalTotal,
              },
            });
          }
        } catch {
          // Customer upsert non-critical for order completion
        }
      }

      return order;
    });

    // 8. Logistics Staging:
    // If standard COD (confirmed order), stage into Delhivery One Pending queue (or manifest if auto_manifest enabled)
    if (createdOrder.orderStatus === 'CONFIRMED' && !requiresGatewaySession) {
      sendOrderToDelhiveryPending(createdOrder.id).catch((err: any) => {
        logger.warn('shipping.delhivery_pending.create_dispatch_failed', {
          orderId: createdOrder.id,
          error: err?.message,
        });
      });
    }

    logger.info('order.created', {
      orderNumber: createdOrder.orderNumber,
      total: createdOrder.total,
      paymentMethod: createdOrder.paymentMethod,
      advanceAmount,
      codBalanceAmount,
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrder.orderNumber,
      id: createdOrder.id,
      total: createdOrder.total,
      advanceAmount,
      codBalanceAmount,
      paymentMethod: createdOrder.paymentMethod,
      carrier: createdOrder.carrier,
      trackingNumber: createdOrder.trackingNumber,
      trackingUrl: createdOrder.trackingUrl,
      razorpayOrderId: razorpaySession?.razorpayOrderId || null,
      razorpayAmount: razorpaySession?.amount || null,
      razorpayCurrency: razorpaySession?.currency || null,
      razorpayKeyId: razorpaySession?.keyId || null,
    });
  } catch (error: any) {
    logger.error('order.create.failed', { error: error?.message || 'Failed to process order' });
    return NextResponse.json(
      { error: error.message || 'Failed to securely process order' },
      { status: 500 }
    );
  }
}

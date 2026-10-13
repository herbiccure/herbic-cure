import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: max 10 checkout attempts per min per IP
    const rateLimitError = enforceRateLimit(req, 'checkout_create', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

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

    // 5. Authoritative Shipping Fee Calculation (Free shipping above ₹499)
    const calculatedShippingFee = calculatedSubtotal >= 499 ? 0 : 49;

    // 6. Final Authoritative Payable Total
    const calculatedFinalTotal = Math.max(
      0,
      calculatedSubtotal - calculatedDiscount + calculatedShippingFee
    );

    const fullShippingAddress = JSON.stringify({
      name,
      phone,
      address,
      city,
      state,
      pincode,
    });

        // Authoritative User Account & Customer Linking
    let matchedUserId: string | null = null;
    let matchedCustomerId: string | null = null;

    try {
      const session = await getServerSession();
      if (session?.user?.id) {
        matchedUserId = session.user.id;
      }
    } catch {
      // Fallback
    }

    if (!matchedUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingUser) {
        matchedUserId = existingUser.id;
      }
    }

    const existingCustomerRecord = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingCustomerRecord) {
      matchedCustomerId = existingCustomerRecord.id;
    }

    const orderNumber = `HC-${Date.now().toString().slice(-6)}`;

    // 7. Atomic Database Transaction: Order Creation + Stock Decrement + Coupon Usage
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Create the verified order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: matchedUserId,
          customerId: matchedCustomerId,
          customerName: name,
          customerEmail: email.toLowerCase(),
          customerPhone: phone,
          shippingAddress: fullShippingAddress,
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          shippingFee: calculatedShippingFee,
          total: calculatedFinalTotal,
          couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
          paymentMethod,
          paymentStatus: 'PENDING', // Verified: Never auto-mark as PAID without gateway verification
          orderStatus: 'CONFIRMED',
          carrier: 'Shiprocket',
          trackingNumber: `SR${Math.floor(100000000 + Math.random() * 900000000)}IN`,
          trackingUrl: 'https://shiprocket.co/tracking',
          items: {
            create: verifiedOrderItems,
          },
        },
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
      try {
        const existingCustomer = await tx.customer.findUnique({
          where: { email: email.toLowerCase() },
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
              email: email.toLowerCase(),
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

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrder.orderNumber,
      id: createdOrder.id,
      total: createdOrder.total,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to securely process order' },
      { status: 500 }
    );
  }
}

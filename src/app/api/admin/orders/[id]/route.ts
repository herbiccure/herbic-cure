import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { cancelDelhiveryShipment } from '@/lib/shipping/delhivery';
import { orderUpdateSchema } from '@/lib/schemas/order';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    logger.error('admin.order.fetch_failed', { error: error?.message || 'Failed to fetch order' });
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const rawBody = await request.json().catch(() => ({}));

    // 1. Validate payload with Zod schema
    const parsed = orderUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid order parameters' },
        { status: 400 }
      );
    }

    const {
      action,
      rejectionReason,
      orderStatus,
      trackingNumber,
      carrier,
      eventDescription,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      address,
      city,
      state,
      pincode,
      notes,
      shippingFee,
      codBalanceAmount,
      paymentStatus,
    } = parsed.data;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Handle Order Rejection or Cancellation
    if (action === 'reject' || (orderStatus === 'CANCELLED' && existingOrder.orderStatus !== 'CANCELLED')) {
      const cancelResult = await cancelOrderWithLogistics({
        orderId: id,
        reason: rejectionReason || eventDescription || 'Order rejected by store administrator',
        cancelledBy: 'ADMIN',
      });

      const finalOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          events: { orderBy: { timestamp: 'desc' } },
        },
      });

      return NextResponse.json({
        success: true,
        order: finalOrder,
        delhivery: cancelResult.delhivery,
        message: cancelResult.message || `Order #${existingOrder.orderNumber} rejected and cancelled.`,
      });
    }

    // 3. Handle Order Acceptance (Move to Ready to Ship)
    const isAccepting = action === 'accept' || orderStatus === 'READY_TO_SHIP';

    // 4. Handle Customer & Shipping Address updates
    let currentAddrObj: any = {};
    try {
      const trimmed = (existingOrder.shippingAddress || '').trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        currentAddrObj = JSON.parse(trimmed);
      } else {
        currentAddrObj = { address: existingOrder.shippingAddress };
      }
    } catch {
      currentAddrObj = { address: existingOrder.shippingAddress };
    }

    const newName = customerName !== undefined ? customerName.trim() : existingOrder.customerName;
    const newPhone = customerPhone !== undefined ? customerPhone.trim() : existingOrder.customerPhone;
    const newEmail = customerEmail !== undefined ? customerEmail.trim().toLowerCase() : existingOrder.customerEmail;

    let finalShippingAddress = existingOrder.shippingAddress;
    const hasAddressField =
      address !== undefined ||
      city !== undefined ||
      state !== undefined ||
      pincode !== undefined ||
      shippingAddress !== undefined;

    if (hasAddressField) {
      if (shippingAddress && !address && !city && !state && !pincode) {
        finalShippingAddress = shippingAddress;
      } else {
        const mergedAddr = {
          name: newName,
          phone: newPhone,
          address: address !== undefined ? address.trim() : (currentAddrObj.address || currentAddrObj.addressLine1 || ''),
          city: city !== undefined ? city.trim() : (currentAddrObj.city || ''),
          state: state !== undefined ? state.trim() : (currentAddrObj.state || ''),
          pincode: pincode !== undefined ? pincode.trim() : (currentAddrObj.pincode || currentAddrObj.pinCode || ''),
        };
        finalShippingAddress = JSON.stringify(mergedAddr);
      }
    }

    // 5. Construct database update payload
    const updateData: any = {
      customerName: newName,
      customerPhone: newPhone,
      customerEmail: newEmail,
      shippingAddress: finalShippingAddress,
    };

    if (isAccepting) {
      updateData.orderStatus = 'READY_TO_SHIP';
      updateData.delhiveryStatus = 'READY_TO_SHIP';
      updateData.delhiverySyncStatus = 'SYNCED';
      updateData.lastDelhiverySyncAt = new Date();
    } else if (orderStatus !== undefined) {
      updateData.orderStatus = orderStatus;
    }

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (carrier !== undefined) updateData.carrier = carrier;
    if (notes !== undefined) updateData.notes = notes;
    if (shippingFee !== undefined && shippingFee !== null) {
      updateData.shippingFee = shippingFee;
      const effectiveSubtotal = Number(existingOrder.subtotal || 0);
      const effectiveDiscount = Number(existingOrder.discount || 0);
      const newTotal = Math.max(0, (effectiveSubtotal - effectiveDiscount) + shippingFee);
      updateData.total = newTotal;
      if (codBalanceAmount === undefined && existingOrder.paymentMethod === 'COD') {
        const adv = Number((existingOrder as any).advanceAmount || 0);
        updateData.codBalanceAmount = Math.max(0, newTotal - adv);
      }
    }
    if (codBalanceAmount !== undefined) {
      updateData.codBalanceAmount = existingOrder.paymentMethod === 'COD' ? codBalanceAmount : 0;
    }
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    // 6. Log shipment audit events
    if (isAccepting) {
      await prisma.shipmentEvent.create({
        data: {
          orderId: id,
          status: 'READY_TO_SHIP',
          description: eventDescription || 'Order accepted by store administrator and marked Ready to Ship',
          location: carrier || existingOrder.carrier || 'Fulfillment Facility',
        },
      });
    } else if (hasAddressField || customerName || customerPhone) {
      await prisma.shipmentEvent.create({
        data: {
          orderId: id,
          status: updatedOrder.orderStatus,
          description: eventDescription || 'Customer address and details updated by administrator',
          location: carrier || existingOrder.carrier || 'Order Management',
        },
      });
    } else if (eventDescription || (orderStatus && orderStatus !== existingOrder.orderStatus)) {
      await prisma.shipmentEvent.create({
        data: {
          orderId: id,
          status: updatedOrder.orderStatus,
          description: eventDescription || `Order status updated to ${updatedOrder.orderStatus}`,
          location: carrier || existingOrder.carrier || 'Fulfillment Center',
        },
      });
    }

    // Re-fetch with events
    const finalOrderWithEvents = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    const successMsg = isAccepting
      ? `Order #${existingOrder.orderNumber} accepted! Moved to Ready to Ship.`
      : hasAddressField
      ? `Shipping address & details updated for Order #${existingOrder.orderNumber}.`
      : `Order #${existingOrder.orderNumber} updated successfully.`;

    return NextResponse.json({
      success: true,
      message: successMsg,
      order: finalOrderWithEvents,
    });
  } catch (error: any) {
    logger.error('admin.order.update_failed', { error: error?.message || 'Failed to update order' });
    return NextResponse.json({ error: error?.message || 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const existing = await prisma.order.findUnique({ where: { id } });

    if (existing?.trackingNumber && existing.orderStatus !== 'CANCELLED') {
      try {
        await cancelDelhiveryShipment(existing.trackingNumber, 'Order deleted by admin');
      } catch (delhErr: any) {
        logger.warn('shipping.delhivery.delete_cancel_warning', { error: delhErr?.message });
      }
    }

    await prisma.order.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Order deleted and Delhivery shipment cancelled' });
  } catch (error: any) {
    logger.error('admin.order.delete_failed', { error: error?.message || 'Failed to delete order' });
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

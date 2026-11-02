import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as acceptHandler } from '@/app/api/admin/orders/[id]/accept/route';
import { POST as rejectHandler } from '@/app/api/admin/orders/[id]/reject/route';
import { PUT as updateHandler } from '@/app/api/admin/orders/[id]/route';
import { getOrderStatusInfo } from '@/app/(admin)/admin/orders/page';
import { prisma } from '@/lib/prisma';
import * as adminAuth from '@/lib/auth/adminAuth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    shipmentEvent: {
      create: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/adminAuth', () => ({
  requireAdminAuth: vi.fn(),
  getAdminSession: vi.fn(),
}));

vi.mock('@/lib/shipping/orderCancellation', () => ({
  cancelOrderWithLogistics: vi.fn().mockResolvedValue({
    success: true,
    message: 'Shipment cancelled and inventory restored',
  }),
}));

describe('Admin Orders Acceptance, Rejection & Address Workflow API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminAuth.requireAdminAuth).mockResolvedValue(null as any);
  });

  const baseOrder = {
    id: 'ord_test_123',
    orderNumber: 'HC-10099',
    customerName: 'Pooja Verma',
    customerEmail: 'pooja@example.com',
    customerPhone: '9876543210',
    shippingAddress: JSON.stringify({
      name: 'Pooja Verma',
      phone: '9876543210',
      address: '123 MG Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    }),
    total: 999,
    subtotal: 949,
    discount: 0,
    shippingFee: 50,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'CONFIRMED',
    delhiveryStatus: 'PENDING',
    delhiverySyncStatus: 'SYNCED',
    items: [
      {
        id: 'item_1',
        productName: 'Herbic Cure - 21 Herbs Fusion Hair Oil',
        quantity: 1,
        price: 999,
        total: 999,
      },
    ],
    events: [],
  };

  it('1. POST /api/admin/orders/[id]/accept: Successfully accepts order and transitions to READY_TO_SHIP', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(baseOrder as any);
    const readyOrder = {
      ...baseOrder,
      orderStatus: 'READY_TO_SHIP',
      delhiveryStatus: 'READY_TO_SHIP',
      delhiverySyncStatus: 'SYNCED',
    };
    vi.mocked(prisma.order.update).mockResolvedValue(readyOrder as any);
    vi.mocked(prisma.shipmentEvent.create).mockResolvedValue({ id: 'evt_1' } as any);

    const req = new NextRequest('http://localhost:3000/api/admin/orders/ord_test_123/accept', {
      method: 'POST',
      body: JSON.stringify({ note: 'Order accepted by store admin and marked Ready to Ship' }),
    });

    const res = await acceptHandler(req, { params: Promise.resolve({ id: 'ord_test_123' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('accepted');
    expect(data.order.orderStatus).toBe('READY_TO_SHIP');
    expect(data.order.delhiveryStatus).toBe('READY_TO_SHIP');

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord_test_123' },
        data: expect.objectContaining({
          orderStatus: 'READY_TO_SHIP',
          delhiveryStatus: 'READY_TO_SHIP',
          delhiverySyncStatus: 'SYNCED',
        }),
      })
    );
  });

  it('2. POST /api/admin/orders/[id]/reject: Rejects and cancels order via cancelOrderWithLogistics', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(baseOrder as any);
    const cancelledOrder = {
      ...baseOrder,
      orderStatus: 'CANCELLED',
    };
    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce(baseOrder as any)
      .mockResolvedValueOnce(cancelledOrder as any);

    const req = new NextRequest('http://localhost:3000/api/admin/orders/ord_test_123/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Customer requested cancellation before dispatch' }),
    });

    const res = await rejectHandler(req, { params: Promise.resolve({ id: 'ord_test_123' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.orderStatus).toBe('CANCELLED');
  });

  it('3. PUT /api/admin/orders/[id]: Correctly updates complete customer address, city, state, pin, and notes', async () => {
    const updatedOrder = {
      ...baseOrder,
      customerName: 'Pooja V. Sharma',
      customerPhone: '9876543211',
      customerEmail: 'pooja.sharma@example.com',
      shippingAddress: JSON.stringify({
        name: 'Pooja V. Sharma',
        phone: '9876543211',
        address: 'Flat 402, Lotus Residency, Baner Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
      }),
    };
    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce(baseOrder as any)
      .mockResolvedValueOnce(updatedOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

    const req = new NextRequest('http://localhost:3000/api/admin/orders/ord_test_123', {
      method: 'PUT',
      body: JSON.stringify({
        customerName: 'Pooja V. Sharma',
        customerPhone: '9876543211',
        customerEmail: 'pooja.sharma@example.com',
        address: 'Flat 402, Lotus Residency, Baner Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        notes: 'Call before delivery',
      }),
    });

    const res = await updateHandler(req, { params: Promise.resolve({ id: 'ord_test_123' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.customerName).toBe('Pooja V. Sharma');
    const parsedAddr = JSON.parse(data.order.shippingAddress);
    expect(parsedAddr.address).toBe('Flat 402, Lotus Residency, Baner Road');
    expect(parsedAddr.pincode).toBe('411045');
  });

  it('4. getOrderStatusInfo: Displays "Ready to Ship" badge in emerald when orderStatus is READY_TO_SHIP', () => {
    const readyItem = {
      ...baseOrder,
      orderStatus: 'READY_TO_SHIP',
      delhiveryStatus: 'READY_TO_SHIP',
      createdAt: new Date().toISOString(),
      items: [],
      events: [],
    };

    const info = getOrderStatusInfo(readyItem as any);
    expect(info.label).toBe('Ready to Ship');
    expect(info.colorClass).toContain('emerald');
  });

  it('5. PUT /api/admin/orders/[id]: Allows editing delivery charges (shippingFee) and recalculates order total dynamically', async () => {
    // Original: subtotal 949, shippingFee 50, total 999
    // Admin edits delivery charges to 120 (or 0 for free)
    const updatedOrder = {
      ...baseOrder,
      shippingFee: 120,
      total: 1069, // 949 + 120
      codBalanceAmount: 1069,
    };
    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce(baseOrder as any)
      .mockResolvedValueOnce(updatedOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

    const req = new NextRequest('http://localhost:3000/api/admin/orders/ord_test_123', {
      method: 'PUT',
      body: JSON.stringify({
        shippingFee: 120,
      }),
    });

    const res = await updateHandler(req, { params: Promise.resolve({ id: 'ord_test_123' }) });
    expect(res.status).toBe(200);

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord_test_123' },
        data: expect.objectContaining({
          shippingFee: 120,
          total: 1069,
        }),
      })
    );

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.shippingFee).toBe(120);
    expect(data.order.total).toBe(1069);
  });

  it('6. Prepaid Orders: can be fully edited (name, phone, address, notes) with codBalance strictly remaining 0 and accepted into READY_TO_SHIP', async () => {
    const prepaidOrder = {
      ...baseOrder,
      id: 'ord_prepaid_456',
      orderNumber: 'HC-PREPAID-01',
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PAID',
      shippingFee: 0,
      codBalanceAmount: 0,
      total: 649,
      subtotal: 649,
    };

    const updatedPrepaidOrder = {
      ...prepaidOrder,
      customerName: 'Ananya Deshmukh',
      customerPhone: '9876543299',
      shippingAddress: JSON.stringify({
        name: 'Ananya Deshmukh',
        phone: '9876543299',
        address: 'B-702, Cyber Heights, Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
      }),
      notes: 'Prepaid order: verify address before dispatch',
    };

    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce(prepaidOrder as any)
      .mockResolvedValueOnce(updatedPrepaidOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedPrepaidOrder as any);

    // 1. Edit customer & shipping address
    const editReq = new NextRequest('http://localhost:3000/api/admin/orders/ord_prepaid_456', {
      method: 'PUT',
      body: JSON.stringify({
        customerName: 'Ananya Deshmukh',
        customerPhone: '9876543299',
        address: 'B-702, Cyber Heights, Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
        notes: 'Prepaid order: verify address before dispatch',
      }),
    });

    const editRes = await updateHandler(editReq, { params: Promise.resolve({ id: 'ord_prepaid_456' }) });
    expect(editRes.status).toBe(200);

    const editData = await editRes.json();
    expect(editData.success).toBe(true);
    expect(editData.order.customerName).toBe('Ananya Deshmukh');
    expect(editData.order.paymentMethod).toBe('RAZORPAY');
    expect(editData.order.paymentStatus).toBe('PAID');
    // COD balance on prepaid order is strictly 0
    expect(editData.order.codBalanceAmount).toBe(0);

    // 2. Accept prepaid order -> moves to READY_TO_SHIP
    const readyPrepaidOrder = {
      ...updatedPrepaidOrder,
      orderStatus: 'READY_TO_SHIP',
      delhiveryStatus: 'READY_TO_SHIP',
      delhiverySyncStatus: 'SYNCED',
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(updatedPrepaidOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValueOnce(readyPrepaidOrder as any);

    const acceptReq = new NextRequest('http://localhost:3000/api/admin/orders/ord_prepaid_456/accept', {
      method: 'POST',
      body: JSON.stringify({ note: 'Prepaid order accepted and moved to Ready to Ship' }),
    });

    const acceptRes = await acceptHandler(acceptReq, { params: Promise.resolve({ id: 'ord_prepaid_456' }) });
    expect(acceptRes.status).toBe(200);

    const acceptData = await acceptRes.json();
    expect(acceptData.success).toBe(true);
    expect(acceptData.order.orderStatus).toBe('READY_TO_SHIP');
    expect(acceptData.order.paymentMethod).toBe('RAZORPAY');
    expect(acceptData.order.paymentStatus).toBe('PAID');
  });
});

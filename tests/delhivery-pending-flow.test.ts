import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDelhiveryPendingOrder,
  pollDelhiveryOrderByRefIds,
  mapDelhiveryStatusToOrderStatus,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';
import { getEffectiveShippingMode } from '@/lib/shipping/delhiveryPending';
import { settingsSchema } from '@/lib/schemas/settings';
import { prisma } from '@/lib/prisma';

describe('Delhivery One Pending Order Fulfillment Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleOrder: DelhiveryShipmentOrder = {
    orderNumber: 'HC-100249',
    customerName: 'Karthik Rao',
    customerPhone: '9876543210',
    customerEmail: 'karthik@example.com',
    shippingAddress: {
      address: 'Plot 45, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
    },
    paymentMethod: 'COD',
    total: 899,
    codBalanceAmount: 800,
    items: [
      { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 2)', quantity: 1, price: 599 },
      { name: 'Neem Wood Wide-Tooth Comb', quantity: 2, price: 150 },
    ],
  };

  it('1. createDelhiveryPendingOrder: Staged order has PENDING status without generating an immediate AWB', async () => {
    const res = await createDelhiveryPendingOrder(sampleOrder);
    expect(res.success).toBe(true);
    expect(res.status).toBe('PENDING');
    // In pending mode, waybill is empty so Delhivery wallet balance is not deducted
    expect(res.waybill || '').toBe('');
  });

  it('2. createDelhiveryPendingOrder: Validates customer address, pin, phone and physical quantity', async () => {
    const invalidPhoneOrder: DelhiveryShipmentOrder = {
      ...sampleOrder,
      customerPhone: '123', // invalid
    };
    const resPhone = await createDelhiveryPendingOrder(invalidPhoneOrder);
    expect(resPhone.success).toBe(false);
    expect(resPhone.message).toContain('phone');

    const invalidPinOrder: DelhiveryShipmentOrder = {
      ...sampleOrder,
      customerPhone: '9876543210',
      shippingAddress: {
        address: 'Test Addr',
        city: 'City',
        state: 'State',
        pincode: '12', // invalid pin
      },
    };
    const resPin = await createDelhiveryPendingOrder(invalidPinOrder);
    expect(resPin.success).toBe(false);
    expect(resPin.message).toContain('PIN');

    const zeroQuantityOrder: DelhiveryShipmentOrder = {
      ...sampleOrder,
      items: [],
    };
    const resQty = await createDelhiveryPendingOrder(zeroQuantityOrder);
    expect(resQty.success).toBe(false);
    expect(resQty.message).toContain('quantity');
  });

  it('3. mapDelhiveryStatusToOrderStatus: Correctly identifies Pending and Manifested states', () => {
    // Pending Queue / Draft state
    const pendingState = mapDelhiveryStatusToOrderStatus('Pending AWB');
    expect(pendingState.orderStatus).toBe('CONFIRMED');
    expect(pendingState.delhiveryStatus).toBe('PENDING');
    expect(pendingState.isManifested).toBe(false);

    // Manifested / Ready to Ship state
    const manifestedState = mapDelhiveryStatusToOrderStatus('Manifested');
    expect(manifestedState.orderStatus).toBe('CONFIRMED');
    expect(manifestedState.delhiveryStatus).toBe('MANIFESTED');
    expect(manifestedState.isManifested).toBe(true);

    const softDataState = mapDelhiveryStatusToOrderStatus('Soft Data Received');
    expect(softDataState.orderStatus).toBe('CONFIRMED');
    expect(softDataState.delhiveryStatus).toBe('MANIFESTED');
    expect(softDataState.isManifested).toBe(true);

    // In Transit state
    const inTransitState = mapDelhiveryStatusToOrderStatus('In Transit');
    expect(inTransitState.orderStatus).toBe('SHIPPED');
    expect(inTransitState.delhiveryStatus).toBe('IN_TRANSIT');
    expect(inTransitState.isManifested).toBe(true);

    // Delivered state
    const deliveredState = mapDelhiveryStatusToOrderStatus('Delivered');
    expect(deliveredState.orderStatus).toBe('DELIVERED');
    expect(deliveredState.delhiveryStatus).toBe('DELIVERED');
    expect(deliveredState.isDelivered).toBe(true);

    // Cancelled state
    const cancelledState = mapDelhiveryStatusToOrderStatus('RTO / Cancelled');
    expect(cancelledState.orderStatus).toBe('CANCELLED');
    expect(cancelledState.delhiveryStatus).toBe('CANCELLED');
    expect(cancelledState.isCancelled).toBe(true);
  });

  it('4. pollDelhiveryOrderByRefIds: Gracefully handles empty or simulated reference IDs', async () => {
    const emptyRes = await pollDelhiveryOrderByRefIds([]);
    expect(emptyRes.success).toBe(false);
    expect(emptyRes.packages).toHaveLength(0);

    const simRes = await pollDelhiveryOrderByRefIds(['HC-100249']);
    expect(simRes.success).toBe(true);
    expect(Array.isArray(simRes.packages)).toBe(true);
  });

  it('5. Settings Schema: Validates shipping_mode enum and prevents invalid values', () => {
    const validPending = settingsSchema.safeParse({
      shipping_mode: 'delhivery_pending',
    });
    expect(validPending.success).toBe(true);

    const validAuto = settingsSchema.safeParse({
      shipping_mode: 'auto_manifest',
    });
    expect(validAuto.success).toBe(true);

    const invalidMode = settingsSchema.safeParse({
      shipping_mode: 'immediate_dispatch',
    });
    expect(invalidMode.success).toBe(false);
  });

  it('6. getEffectiveShippingMode: Defaults to auto_manifest so live store behavior is unchanged', async () => {
    vi.spyOn(prisma.siteSetting, 'findUnique').mockResolvedValue(null as any);
    const modeDefault = await getEffectiveShippingMode();
    expect(modeDefault).toBe('auto_manifest');

    vi.spyOn(prisma.siteSetting, 'findUnique').mockResolvedValue({
      id: 's1',
      key: 'shipping_mode',
      value: 'delhivery_pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const modePending = await getEffectiveShippingMode();
    expect(modePending).toBe('delhivery_pending');
  });

  it('7. createDelhiveryPendingOrder: Correctly handles prepaid vs COD balance amount', async () => {
    const prepaidOrder: DelhiveryShipmentOrder = {
      ...sampleOrder,
      paymentMethod: 'Prepaid',
      total: 799,
      codBalanceAmount: 0,
    };
    const resPrepaid = await createDelhiveryPendingOrder(prepaidOrder);
    expect(resPrepaid.success).toBe(true);
    expect(resPrepaid.status).toBe('PENDING');
    const payload = resPrepaid.rawResponse?.payload?.shipments?.[0];
    if (payload) {
      expect(payload.payment_mode).toBe('Prepaid');
      expect(payload.cod_amount).toBe('0');
      expect(payload.quantity).toBe('3'); // 1 hair oil + 2 combs = 3 physical items
      expect(payload.waybill).toBe('');
    }
  });

  it('8. createDelhiveryPendingOrder: Mocked API handles unmanifested pending response vs direct manifestation', async () => {
    const origEnv = process.env.DELHIVERY_PUSH_PENDING_TO_API;
    const origKey = process.env.DELHIVERY_API_KEY;
    try {
      process.env.DELHIVERY_PUSH_PENDING_TO_API = 'true';
      process.env.DELHIVERY_API_KEY = 'mock_api_token_12345';

      // Case A: Delhivery staging accepts into Pending queue without AWB
      const mockFetchPending = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          packages: [{ remarks: 'Order ingested in pending queue' }],
        })),
      });
      global.fetch = mockFetchPending as any;

      const pendingRes = await createDelhiveryPendingOrder(sampleOrder);
      expect(pendingRes.success).toBe(true);
      expect(pendingRes.status).toBe('PENDING');
      expect(pendingRes.waybill).toBe('');

      // Case B: Delhivery unexpectedly returns an AWB (account in Direct Manifestation mode)
      const mockFetchManifested = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          packages: [{ waybill: '320098765432', status: 'Success' }],
        })),
      });
      global.fetch = mockFetchManifested as any;

      const directRes = await createDelhiveryPendingOrder(sampleOrder);
      expect(directRes.success).toBe(true);
      expect(directRes.status).toBe('MANIFESTED');
      expect(directRes.waybill).toBe('320098765432');

      // Case C: Delhivery returns HTTP 400 error / rejection
      const mockFetchError = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({
          rmk: 'Invalid warehouse pickup location',
        })),
      });
      global.fetch = mockFetchError as any;

      const failRes = await createDelhiveryPendingOrder(sampleOrder);
      expect(failRes.success).toBe(false);
      expect(failRes.status).toBe('FAILED');
      expect(failRes.message).toContain('Invalid warehouse pickup location');
    } finally {
      process.env.DELHIVERY_PUSH_PENDING_TO_API = origEnv;
      process.env.DELHIVERY_API_KEY = origKey;
    }
  });
});

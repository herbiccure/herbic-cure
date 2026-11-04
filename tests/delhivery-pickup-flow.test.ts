import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDelhiveryShipment,
  requestDelhiveryPickup,
  scheduleDailyDelhiveryPickup,
  getPickupLocation,
} from '@/lib/shipping/delhivery';

// In-memory simulated database for orders
let simulatedOrders: any[] = [];

const mockOrderUpdate = vi.fn().mockImplementation((args: any) => {
  const ord = simulatedOrders.find((o) => o.id === args.where.id);
  if (ord) {
    Object.assign(ord, args.data);
    if (args.data?.pickupAttempts?.increment) {
      ord.pickupAttempts = (ord.pickupAttempts || 0) + 1;
    }
  }
  return Promise.resolve(ord || {});
});

const mockOrderUpdateMany = vi.fn().mockImplementation((args: any) => {
  const ids = args.where.id.in || [];
  let count = 0;
  for (const ord of simulatedOrders) {
    if (ids.includes(ord.id)) {
      Object.assign(ord, args.data);
      count++;
    }
  }
  return Promise.resolve({ count });
});

const mockOrderFindUnique = vi.fn().mockImplementation((args: any) => {
  const ord = simulatedOrders.find((o) => o.id === args.where.id);
  return Promise.resolve(ord || null);
});

const mockOrderFindMany = vi.fn().mockImplementation((args: any) => {
  let list = [...simulatedOrders];
  if (args?.where?.id?.in) {
    list = list.filter((o) => args.where.id.in.includes(o.id));
  }
  if (args?.where?.orderStatus?.in) {
    list = list.filter((o) => args.where.orderStatus.in.includes(o.orderStatus));
  }
  if (args?.where?.pickupStatus?.in) {
    list = list.filter((o) => args.where.pickupStatus.in.includes(o.pickupStatus));
  }
  if (args?.where?.pickupStatus && typeof args.where.pickupStatus === 'object' && args.where.pickupStatus.not) {
    list = list.filter((o) => o.pickupStatus !== args.where.pickupStatus.not);
  }
  return Promise.resolve(list);
});

const mockOrderCount = vi.fn().mockImplementation((args: any) => {
  let list = [...simulatedOrders];
  if (args?.where?.id?.in) {
    list = list.filter((o) => args.where.id.in.includes(o.id));
  }
  if (args?.where?.orderStatus === 'CANCELLED') {
    list = list.filter((o) => o.orderStatus === 'CANCELLED');
  }
  if (args?.where?.pickupStatus === 'NONE') {
    list = list.filter((o) => o.pickupStatus === 'NONE');
  }
  return Promise.resolve(list.length);
});

const mockShipmentEventCreate = vi.fn().mockResolvedValue({});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      update: (...args: any[]) => mockOrderUpdate(...args),
      updateMany: (...args: any[]) => mockOrderUpdateMany(...args),
      findUnique: (...args: any[]) => mockOrderFindUnique(...args),
      findMany: (...args: any[]) => mockOrderFindMany(...args),
      count: (...args: any[]) => mockOrderCount(...args),
    },
    shipmentEvent: {
      create: (...args: any[]) => mockShipmentEventCreate(...args),
    },
    siteSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe('Delhivery End-to-End Pickup Lifecycle (Scenarios A through G)', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.DELHIVERY_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    simulatedOrders = [];
    process.env.DELHIVERY_API_KEY = 'mock_delhivery_api_token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.DELHIVERY_API_KEY = originalKey;
  });

  // --------------------------------------------------------------------------
  // Scenario A: Normal Shipment
  // --------------------------------------------------------------------------
  it('Scenario A: Normal shipment (Create -> Manifest -> Pack -> Pickup Request -> Verified Status)', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            packages: [{ waybill: '65844110000101', remarks: ['Manifest uploaded'] }],
            success: true,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            pr_id: 'PUR-990011',
            status: 'Success',
            message: 'Pickup scheduled successfully for HERBIC CURE B2C',
          }),
      });

    // Step 1: Manifest order
    const manifestRes = await createDelhiveryShipment({
      orderNumber: 'HC-TEST-A1',
      customerName: 'Priya Sharma',
      customerPhone: '9876543210',
      customerEmail: 'priya@example.com',
      shippingAddress: {
        address: '101 Rose Villa, MG Road',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
      paymentMethod: 'Prepaid',
      items: [{ name: '21 Herbs Hair Oil', quantity: 1, price: 349, sku: 'HC-HO-01' }],
      total: 349,
    });

    expect(manifestRes.success).toBe(true);
    expect(manifestRes.waybill).toBe('65844110000101');

    // Step 2: Store in DB as packed order awaiting courier
    simulatedOrders.push({
      id: 'order-a1',
      orderNumber: 'HC-TEST-A1',
      trackingNumber: '65844110000101',
      orderStatus: 'READY_TO_SHIP',
      pickupStatus: 'PACKED',
      packedAt: new Date(),
      packedBy: 'staff@herbiccure.com',
      pickupAttempts: 0,
    });

    // Step 3: Request Pickup
    const pickupRes = await scheduleDailyDelhiveryPickup({
      orderIds: ['order-a1'],
      pickupDate: '2026-11-05',
      pickupTime: '14:00:00',
    });

    expect(pickupRes.success).toBe(true);
    expect(pickupRes.status).toBe('SCHEDULED');
    expect(pickupRes.pickupId).toBe('PUR-990011');
    expect(pickupRes.count).toBe(1);

    // Verify DB update
    expect(mockOrderUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['order-a1'] } },
      data: expect.objectContaining({
        pickupStatus: 'SCHEDULED',
        pickupRequestId: 'PUR-990011',
      }),
    });
  });

  // --------------------------------------------------------------------------
  // Scenario B: Multiple Products in One Order
  // --------------------------------------------------------------------------
  it('Scenario B: Multiple products in single order (Preserves distinct products under 1 AWB)', async () => {
    let capturedBody = '';
    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      capturedBody = opts?.body || '';
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            packages: [{ waybill: '65844110000102', remarks: ['Manifest uploaded'] }],
            success: true,
          }),
      };
    });

    const manifestRes = await createDelhiveryShipment({
      orderNumber: 'HC-TEST-B1',
      customerName: 'Rahul Verma',
      customerPhone: '9876543211',
      customerEmail: 'rahul@example.com',
      shippingAddress: {
        address: '502 Green Acres, Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      paymentMethod: 'Prepaid',
      items: [
        { name: '21 Herbs Fusion Hair Oil', sku: 'HAIR001', quantity: 2, price: 438 },
        { name: 'Herbal Shampoo', sku: 'SHAMP001', quantity: 3, price: 250 },
        { name: 'Hair Conditioner', sku: 'COND001', quantity: 1, price: 300 },
      ],
      shippingFee: 89,
      total: 1965,
    });

    expect(manifestRes.success).toBe(true);
    expect(manifestRes.waybill).toBe('65844110000102');

    // Decode URL-encoded body
    const decodedBody = decodeURIComponent(capturedBody.replace(/\+/g, ' '));
    // Quantity must be sum of physical items (2 + 3 + 1 = 6)
    expect(decodedBody).toContain('"quantity":"6"');
    // Delivery fee must NOT be counted as an item
    expect(decodedBody).not.toContain('Del-Charges');
    // Products description must summarize physical goods without appending Delivery fee
    expect(decodedBody).toContain('21 Herbs Fusion Hair Oil');
    expect(decodedBody).toContain('Herbal Shampoo');
    expect(decodedBody).not.toContain('Delivery Rs 89');
  });

  // --------------------------------------------------------------------------
  // Scenario C: Multiple Orders Batch Pickup
  // --------------------------------------------------------------------------
  it('Scenario C: Multiple orders batched for pickup with exact package count', async () => {
    let capturedPickupPayload: any = null;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url.includes('/fm/request/new/')) {
        capturedPickupPayload = JSON.parse(opts.body);
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              pr_id: 'PUR-BATCH-889',
              status: 'Success',
              message: 'Batch pickup request created',
            }),
        };
      }
      return { ok: true, text: async () => '{}' };
    });

    // 3 waiting packed orders in simulated DB
    simulatedOrders = [
      { id: 'ord-1', orderNumber: 'HC-101', trackingNumber: '65844110000103', orderStatus: 'READY_TO_SHIP', pickupStatus: 'PACKED', pickupAttempts: 0 },
      { id: 'ord-2', orderNumber: 'HC-102', trackingNumber: '65844110000104', orderStatus: 'READY_TO_SHIP', pickupStatus: 'PACKED', pickupAttempts: 0 },
      { id: 'ord-3', orderNumber: 'HC-103', trackingNumber: '65844110000105', orderStatus: 'READY_TO_SHIP', pickupStatus: 'PACKED', pickupAttempts: 0 },
    ];

    const res = await scheduleDailyDelhiveryPickup({
      pickupDate: '2026-11-05',
      pickupTime: '15:00:00',
      requirePacked: true,
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(3);
    expect(res.pickupId).toBe('PUR-BATCH-889');

    // Expected package count in API payload must equal 3
    expect(capturedPickupPayload.expected_package_count).toBe(3);
    expect(capturedPickupPayload.pickup_location).toBe(getPickupLocation());
    expect(capturedPickupPayload.pickup_time).toBe('15:00:00');
  });

  // --------------------------------------------------------------------------
  // Scenario D: Invalid Pickup Location
  // --------------------------------------------------------------------------
  it('Scenario D: Invalid pickup location rejected by Delhivery with error captured', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () =>
        JSON.stringify({
          error: 'Invalid Pickup Location: Warehouse "UNKNOWN_FACILITY" not registered with client account',
        }),
    });

    simulatedOrders = [
      { id: 'ord-d1', orderNumber: 'HC-D1', trackingNumber: '65844110000106', orderStatus: 'READY_TO_SHIP', pickupStatus: 'PACKED', pickupAttempts: 0 },
    ];

    const res = await scheduleDailyDelhiveryPickup({
      pickupLocation: 'UNKNOWN_FACILITY',
      pickupDate: '2026-11-05',
      pickupTime: '16:00:00',
      orderIds: ['ord-d1'],
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('UNKNOWN_FACILITY');
    expect(res.pickupId).toBeUndefined();

    // Verify order marked FAILED in DB and attempts incremented
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: 'ord-d1' },
      data: expect.objectContaining({
        pickupStatus: 'FAILED',
        pickupAttempts: { increment: 1 },
      }),
    });
  });

  // --------------------------------------------------------------------------
  // Scenario E: Duplicate Request / Error 669 Idempotency
  // --------------------------------------------------------------------------
  it('Scenario E: Handles Delhivery Error 669 and avoids duplicate requests', async () => {
    // Delhivery production error 669 response when a PUR already exists for that slot
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true, // HTTP 201 Created from Delhivery
      text: async () =>
        JSON.stringify({
          data: {
            message: 'A Pickup Request 334416490 for this Pickup Location Already Exist for 05 Nov in slot 14:00 - 18:00',
          },
          pr_exist: true,
          pickup_id: 334416490,
          error: {
            code: 669,
            message: 'A Pickup Request 334416490 for this Pickup Location Already Exist for 05 Nov in slot 14:00 - 18:00',
          },
          success: false,
          status: true,
        }),
    });

    simulatedOrders = [
      { id: 'ord-e1', orderNumber: 'HC-E1', trackingNumber: '65844110000107', orderStatus: 'READY_TO_SHIP', pickupStatus: 'PACKED', pickupAttempts: 0 },
    ];

    const res = await scheduleDailyDelhiveryPickup({
      pickupDate: '2026-11-05',
      pickupTime: '14:00:00',
      orderIds: ['ord-e1'],
    });

    // Must recognize existing slot and capture PUR ID 334416490
    expect(res.success).toBe(true);
    expect(res.status).toBe('SCHEDULED');
    expect(res.pickupId).toBe('334416490');
    expect(res.isExistingSlot).toBe(true);
    expect(res.message).toContain('334416490');

    // Order in DB now has pickupStatus = 'SCHEDULED'
    simulatedOrders[0].pickupStatus = 'SCHEDULED';
    simulatedOrders[0].pickupRequestId = '334416490';

    // Submitting a second time when order is already SCHEDULED must be SKIPPED
    const secondRes = await scheduleDailyDelhiveryPickup({
      orderIds: ['ord-e1'],
      force: false,
    });

    expect(secondRes.status).toBe('SKIPPED');
    expect(secondRes.message).toContain('already scheduled');
  });

  // --------------------------------------------------------------------------
  // Scenario F: API Timeout Resilience
  // --------------------------------------------------------------------------
  it('Scenario F: Network timeout handled safely with retry recording', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('AbortError: The operation was aborted due to timeout'));

    simulatedOrders = [
      { id: 'ord-f1', orderNumber: 'HC-F1', trackingNumber: '65844110000108', orderStatus: 'READY_TO_SHIP', pickupStatus: 'PACKED', pickupAttempts: 1 },
    ];

    const res = await scheduleDailyDelhiveryPickup({
      pickupDate: '2026-11-05',
      pickupTime: '14:00:00',
      orderIds: ['ord-f1'],
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('timeout');

    // DB records retry attempt and failure message
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: 'ord-f1' },
      data: expect.objectContaining({
        pickupStatus: 'FAILED',
        pickupAttempts: { increment: 1 },
      }),
    });
  });

  // --------------------------------------------------------------------------
  // Scenario G: Cancelled Shipment Strictly Blocked
  // --------------------------------------------------------------------------
  it('Scenario G: Pickup scheduling blocked for cancelled shipments', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    simulatedOrders = [
      { id: 'ord-g-cancelled', orderNumber: 'HC-G1', trackingNumber: '65844110000109', orderStatus: 'CANCELLED', pickupStatus: 'NONE' },
    ];

    const res = await scheduleDailyDelhiveryPickup({
      orderIds: ['ord-g-cancelled'],
      pickupDate: '2026-11-05',
      pickupTime: '14:00:00',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('SKIPPED');
    expect(res.message).toContain('Cannot schedule pickup: Order is cancelled');
    expect(res.error).toBe('Order is cancelled');

    // Ensure NO fetch call was made to Delhivery
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
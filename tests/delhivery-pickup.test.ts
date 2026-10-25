import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDelhiveryShipment,
  requestDelhiveryPickup,
  getNextAvailablePickupSlot,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';

describe('Delhivery Pickup & Robust Manifest Unit Tests', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.DELHIVERY_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.DELHIVERY_API_KEY = 'mock_delhivery_api_token_12345';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.DELHIVERY_API_KEY = originalKey;
  });

  describe('A. Shipment Pre-manifest Input Validation', () => {
    const validBaseOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-TEST-101',
      customerName: 'Pooja Sharma',
      customerPhone: '9876543210',
      customerEmail: 'pooja@example.com',
      shippingAddress: {
        address: 'Flat 402, Lotus Towers, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
      },
      paymentMethod: 'Prepaid',
      items: [
        { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)', quantity: 1, price: 349 },
      ],
      total: 349,
    };

    it('1. Blocks shipment if physical items quantity is 0 (delivery fee only)', async () => {
      const emptyOrder: DelhiveryShipmentOrder = {
        ...validBaseOrder,
        items: [],
      };
      const res = await createDelhiveryShipment(emptyOrder);
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.message).toContain('physical quantity must be at least 1');
    });

    it('2. Blocks shipment if shipping address is missing or too short', async () => {
      const invalidAddressOrder: DelhiveryShipmentOrder = {
        ...validBaseOrder,
        shippingAddress: {
          address: 'A',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
        },
      };
      const res = await createDelhiveryShipment(invalidAddressOrder);
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.message).toContain('shipping address is missing or incomplete');
    });

    it('3. Blocks shipment if PIN code is not exactly 6 digits', async () => {
      const invalidPinOrder: DelhiveryShipmentOrder = {
        ...validBaseOrder,
        shippingAddress: {
          address: 'Flat 402, Lotus Towers, Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '40005', // 5 digits
        },
      };
      const res = await createDelhiveryShipment(invalidPinOrder);
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.message).toContain('postal PIN code must be exactly 6 digits');
    });

    it('4. Blocks shipment if phone number is not a valid 10-digit number', async () => {
      const invalidPhoneOrder: DelhiveryShipmentOrder = {
        ...validBaseOrder,
        customerPhone: '12345',
      };
      const res = await createDelhiveryShipment(invalidPhoneOrder);
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.message).toContain('valid 10-digit number');
    });
  });

  describe('B. Mocked Delhivery Manifest API Responses', () => {
    const validOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-TEST-202',
      customerName: 'Ananya Roy',
      customerPhone: '9876543210',
      customerEmail: 'ananya@example.com',
      shippingAddress: {
        address: '12 Lake View Road, Salt Lake Sector 1',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700064',
      },
      paymentMethod: 'Prepaid',
      items: [
        { name: 'Herbic Cure - Shampoo with Conditioner (Pack of 1)', quantity: 2, price: 698 },
      ],
      total: 698,
    };

    it('1. Successfully parses live Delhivery manifest with AWB', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            packages: [
              {
                status: 'Success',
                waybill: '50768219999999',
                remarks: ['Package registered successfully'],
              },
            ],
            success: true,
          }),
      });

      const res = await createDelhiveryShipment(validOrder);
      expect(res.success).toBe(true);
      expect(res.status).toBe('MANIFESTED');
      expect(res.waybill).toBe('50768219999999');
      expect(res.trackingUrl).toBe('https://www.delhivery.com/track/package/50768219999999');
    });

    it('2. Strictly rejects when Delhivery returns package status Fail and surfaces remarks', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            packages: [
              {
                status: 'Fail',
                waybill: '',
                remarks: ['Pincode 700064 is non-serviceable for standard express surface'],
              },
            ],
            success: false,
          }),
      });

      const res = await createDelhiveryShipment(validOrder);
      expect(res.success).toBe(false);
      expect(res.status).toBe('REJECTED');
      expect(res.message).toContain('non-serviceable');
      // Must not generate a fake waybill when live API returns failure!
      expect(res.waybill).toBe('');
    });

    it('3. Strictly rejects when Delhivery returns HTTP 400 or HTTP 401', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () =>
          JSON.stringify({
            rmk: 'Invalid warehouse pickup location: Facility not active',
          }),
      });

      const res = await createDelhiveryShipment(validOrder);
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.message).toContain('Facility not active');
    });
  });

  describe('C. First-Mile Pickup Scheduling (/fm/request/new/)', () => {
    it('1. Slot helper returns valid IST date and slot', () => {
      const slot = getNextAvailablePickupSlot();
      expect(slot.pickupDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(slot.pickupTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('2. Rejects invalid date or time format before calling API', async () => {
      const badDate = await requestDelhiveryPickup({ pickupDate: '26-10-2026' });
      expect(badDate.success).toBe(false);
      expect(badDate.message).toContain('YYYY-MM-DD');

      const badTime = await requestDelhiveryPickup({ pickupDate: '2026-10-26', pickupTime: 'noon' });
      expect(badTime.success).toBe(false);
      expect(badTime.message).toContain('HH:mm:ss');
    });

    it('3. Successfully schedules pickup and captures pickup ID from Delhivery', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            pr_id: 'PR-98234102',
            status: 'Success',
            message: 'Pickup scheduled successfully for Herbic Cure',
          }),
      });

      const res = await requestDelhiveryPickup({
        pickupDate: '2026-10-26',
        pickupTime: '15:00:00',
        pickupLocation: 'Herbic Cure',
        expectedPackageCount: 1,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('SCHEDULED');
      expect(res.pickupId).toBe('PR-98234102');
      expect(res.message).toContain('Pickup scheduled successfully');
      expect(res.pickupDate).toBe('2026-10-26');
      expect(res.pickupTime).toBe('15:00:00');
    });

    it('4. Handles pickup rejection and surfaces reason to staff (e.g. cut-off or wallet balance)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () =>
          JSON.stringify({
            error: 'Pickup cutoff time for today has passed at hub. Please book for tomorrow.',
          }),
      });

      const res = await requestDelhiveryPickup({
        pickupDate: '2026-10-25',
        pickupTime: '14:00:00',
        pickupLocation: 'Herbic Cure',
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.message).toContain('cutoff time');
    });

    it('5. Verifies no secret tokens or credentials leak in results', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () =>
          JSON.stringify({
            detail: 'Authentication credentials were not provided or invalid.',
          }),
      });

      const res = await requestDelhiveryPickup({
        pickupDate: '2026-10-26',
        pickupTime: '11:00:00',
      });

      expect(res.message).not.toContain('Token');
      expect(res.message).not.toContain('secret');
      expect(res.message).not.toContain('api_key');
    });
  });
});

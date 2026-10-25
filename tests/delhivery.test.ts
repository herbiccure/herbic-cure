import { describe, it, expect } from 'vitest';
import {
  createDelhiveryShipment,
  isDelhiveryCancelled,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';

describe('Delhivery Express Logistics Integration Tests', () => {
  const sampleItems = [
    {
      name: '21 Herbs Ayurvedic Hair Oil (200ml)',
      sku: 'HO-200',
      quantity: 1,
      price: 499,
    },
    {
      name: 'Neem Wood Wide-Tooth Comb',
      sku: 'ACC-NWC',
      quantity: 2,
      price: 249,
    },
  ];

  it('Requirement 1: passes exact product names in Delhivery shipment registration', async () => {
    const order: DelhiveryShipmentOrder = {
      orderNumber: 'HC-100001',
      customerName: 'Priya Sharma',
      customerPhone: '9876543210',
      customerEmail: 'priya@example.com',
      shippingAddress: {
        address: 'Flat 402, Lotus Towers',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      },
      paymentMethod: 'Prepaid',
      items: sampleItems,
      total: 997,
    };

    const res = await createDelhiveryShipment(order);
    expect(res.success).toBe(true);
    expect(res.message).toContain('21 Herbs Ayurvedic Hair Oil (200ml)');
    expect(res.message).toContain('Neem Wood Wide-Tooth Comb (Qty: 2)');
  });

  it('Requirement 2: Delivery charges come separately as a product when customer selects COD', async () => {
    const codOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-100002',
      customerName: 'Rahul Verma',
      customerPhone: '9876543211',
      customerEmail: 'rahul@example.com',
      shippingAddress: {
        address: 'B-12, Sector 15',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
      },
      paymentMethod: 'COD',
      shippingFee: 89,
      items: [
        {
          name: '21 Herbs Ayurvedic Hair Oil (100ml)',
          quantity: 1,
          price: 299,
        },
      ],
      total: 388,
    };

    const res = await createDelhiveryShipment(codOrder);
    expect(res.success).toBe(true);
    expect(res.message).toContain('21 Herbs Ayurvedic Hair Oil (100ml)');
    expect(res.message).toContain('Delivery Charges (₹89)');
  });

  it('Requirement 3: In Prepaid, ONLY product names come and NO Delivery charges are listed', async () => {
    const prepaidOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-100003',
      customerName: 'Ananya Rao',
      customerPhone: '9876543212',
      customerEmail: 'ananya@example.com',
      shippingAddress: {
        address: 'Road No 10, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
      },
      paymentMethod: 'Prepaid',
      shippingFee: 0,
      items: [
        {
          name: 'Vedic Hair Cleanser & Scalp Therapy',
          quantity: 1,
          price: 399,
        },
      ],
      total: 399,
    };

    const res = await createDelhiveryShipment(prepaidOrder);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Vedic Hair Cleanser & Scalp Therapy');
    expect(res.message).not.toContain('Delivery Charges');
  });

  it('Requirement 4: Default box dimensions are 18x10x8 cm (Length x Width x Height)', async () => {
    const order: DelhiveryShipmentOrder = {
      orderNumber: 'HC-100004',
      customerName: 'Vikram Mehta',
      customerPhone: '9876543213',
      customerEmail: 'vikram@example.com',
      shippingAddress: {
        address: '15 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      paymentMethod: 'Prepaid',
      items: [
        {
          name: '21 Herbs Ayurvedic Hair Oil (200ml)',
          quantity: 1,
          price: 499,
        },
      ],
      total: 499,
    };

    const res = await createDelhiveryShipment(order);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Dimensions: 18x10x8 cm');
  });

  it('Requirement 5: isDelhiveryCancelled properly identifies Delhivery cancellation statuses and events', () => {
    expect(isDelhiveryCancelled('Cancelled')).toBe(true);
    expect(isDelhiveryCancelled('CANCELED')).toBe(true);
    expect(isDelhiveryCancelled('RTO Initiated')).toBe(true);
    expect(isDelhiveryCancelled('Returned')).toBe(true);
    expect(isDelhiveryCancelled('IN_TRANSIT')).toBe(false);
    expect(isDelhiveryCancelled('MANIFESTED')).toBe(false);
    expect(isDelhiveryCancelled('DELIVERED')).toBe(false);

    // Scan event cancellation check
    expect(
      isDelhiveryCancelled('IN_TRANSIT', [
        {
          status: 'Cancelled',
          description: 'Shipment cancelled by client via Delhivery portal',
          location: 'Delhi Hub',
          timestamp: new Date().toISOString(),
        },
      ])
    ).toBe(true);
  });
});

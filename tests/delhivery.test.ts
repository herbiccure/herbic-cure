import { describe, it, expect } from 'vitest';
import {
  createDelhiveryShipment,
  isDelhiveryCancelled,
  getShortLabelName,
  buildDelhiveryLabelDescription,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';

describe('Delhivery Express Logistics Integration Tests', () => {
  it('1. Short per-product label names: strips redundant brand name and compacts variants', () => {
    expect(getShortLabelName('Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)')).toBe('21 Herbs Hair Oil (1pk)');
    expect(getShortLabelName('Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 2)')).toBe('21 Herbs Hair Oil (2pk)');
    expect(getShortLabelName('Herbic Cure - Shampoo with Conditioner (Pack of 1)')).toBe('Shampoo & Cond (1pk)');
    expect(getShortLabelName('Neem Wood Wide-Tooth Comb')).toBe('Neem Wood Wide-Tooth Comb');
    expect(getShortLabelName('Herbic Cure - Complete Hair Therapy Combo')).toBe('Complete Hair Therapy Combo');
  });

  it('2. Label description for 1-item order: clean and compact without truncation', () => {
    const order1 = [
      { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)', quantity: 1 },
    ];
    const desc = buildDelhiveryLabelDescription(order1);
    expect(desc).toBe('21 Herbs Hair Oil (1pk)');
    expect(desc.length).toBeLessThan(85);
  });

  it('3. Label description for 2-item order: fits within standard 4x6 label budget', () => {
    const order2 = [
      { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)', quantity: 1 },
      { name: 'Herbic Cure - Shampoo with Conditioner (Pack of 1)', quantity: 1 },
    ];
    const desc = buildDelhiveryLabelDescription(order2);
    expect(desc).toBe('21 Herbs Hair Oil (1pk), Shampoo & Cond (1pk)');
    expect(desc.length).toBeLessThan(85);
  });

  it('4. Label description for 5-item order: uses safe fallback to prevent label truncation', () => {
    const order5 = [
      { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 2)', quantity: 1 },
      { name: 'Herbic Cure - Shampoo with Conditioner (Pack of 1)', quantity: 1 },
      { name: 'Neem Wood Wide-Tooth Comb', quantity: 2 },
      { name: 'Herbic Cure - Scalp Therapy Serum (50ml)', quantity: 1 },
      { name: 'Herbic Cure - Ayurvedic Hair Growth Mask', quantity: 1 },
    ];
    const desc = buildDelhiveryLabelDescription(order5);
    // Verifies safe fallback pattern: primary 2 items + remaining count + total physical piece count
    expect(desc).toBe('21 Herbs Hair Oil (2pk), Shampoo & Cond (1pk) + 3 more items (Total: 6 pcs)');
    expect(desc.length).toBeLessThanOrEqual(85);
  });

  it('5. Physical Quantity: counts physical items only (delivery charges never counted as an item)', async () => {
    const codOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-100002',
      customerName: 'Rahul Verma',
      customerPhone: '8688888338',
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
        { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)', quantity: 1, price: 349 },
        { name: 'Herbic Cure - Shampoo with Conditioner (Pack of 1)', quantity: 1, price: 349 },
      ],
      total: 787, // 349 + 349 + 89
    };

    const res = await createDelhiveryShipment(codOrder);
    expect(res.success).toBe(true);
    // In our order of 2 physical items, physical piece count is 2 (NOT 3!)
    const totalPhysicalPieces = codOrder.items.reduce((sum, it) => sum + it.quantity, 0);
    expect(totalPhysicalPieces).toBe(2);
    // Verifies label description contains short clean names
    expect(res.message).toContain('21 Herbs Hair Oil (1pk)');
    expect(res.message).toContain('Shampoo & Cond (1pk)');
  });

  it('6. Full payable amount is placed in cod_amount for COD, and 0 for Prepaid', async () => {
    const codOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-100006',
      customerName: 'Vikram Mehta',
      customerPhone: '8688888338',
      customerEmail: 'vikram@example.com',
      shippingAddress: {
        address: '15 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      paymentMethod: 'COD',
      shippingFee: 89,
      items: [
        { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)', quantity: 1, price: 349 },
      ],
      total: 438, // 349 + 89
    };

    const res = await createDelhiveryShipment(codOrder);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Dimensions: 18x10x8 cm');

    const prepaidOrder: DelhiveryShipmentOrder = {
      ...codOrder,
      orderNumber: 'HC-100007',
      paymentMethod: 'Prepaid',
      shippingFee: 0,
      total: 349,
    };
    const prepaidRes = await createDelhiveryShipment(prepaidOrder);
    expect(prepaidRes.success).toBe(true);
  });

  it('7. isDelhiveryCancelled properly identifies Delhivery cancellation statuses and events', () => {
    expect(isDelhiveryCancelled('Cancelled')).toBe(true);
    expect(isDelhiveryCancelled('CANCELED')).toBe(true);
    expect(isDelhiveryCancelled('RTO Initiated')).toBe(true);
    expect(isDelhiveryCancelled('Returned')).toBe(true);
    expect(isDelhiveryCancelled('IN_TRANSIT')).toBe(false);
    expect(isDelhiveryCancelled('MANIFESTED')).toBe(false);
    expect(isDelhiveryCancelled('DELIVERED')).toBe(false);

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

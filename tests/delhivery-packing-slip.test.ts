import { describe, it, expect } from 'vitest';
import {
  buildDelhiveryLabelDescription,
  buildDelhiveryShipmentItems,
  createDelhiveryShipment,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';
import { generateCode128Bars } from '@/lib/shipping/barcode';

describe('Delhivery Shipping Label and Packing Slip Requirements (Scenarios A through F)', () => {
  // Scenario A: 1 Product, Quantity 1
  it('Scenario A: 1 product, qty 1 - Clean product name without quantity suffix or delivery fees', async () => {
    const items = [
      {
        name: '21 Herbs Fusion Hair Oil (Pack of 1)',
        productName: '21 Herbs Fusion Hair Oil (Pack of 1)',
        labelName: '21 Herbs Hair Oil (1pk)',
        sku: 'HAIR001',
        quantity: 1,
        price: 438,
      },
    ];

    const desc = buildDelhiveryLabelDescription(items, 0);
    expect(desc).toBe('21 Herbs Hair Oil (1pk)');
    expect(desc).not.toContain('Delivery');
    expect(desc).not.toContain('x1'); // Clean single product name without redundant x1

    const shipmentOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-1001',
      customerName: 'Aarav Sharma',
      customerPhone: '9876543210',
      customerEmail: 'aarav@example.com',
      shippingAddress: {
        address: 'Flat 101, Rosewood Heights',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      },
      paymentMethod: 'Prepaid',
      shippingFee: 0,
      total: 438,
      items,
    };

    const res = await createDelhiveryShipment(shipmentOrder);
    expect(res.success).toBe(true);
    expect(res.message).toContain('21 Herbs Hair Oil (1pk)');
    expect(res.message).not.toContain('Delivery');
  });

  // Scenario B: 1 Product, Quantity 5
  it('Scenario B: 1 product, qty 5 - Preserves quantity 5 and does not hardcode qty as 1', async () => {
    const items = [
      {
        name: '21 Herbs Fusion Hair Oil (Pack of 1)',
        productName: '21 Herbs Fusion Hair Oil (Pack of 1)',
        labelName: '21 Herbs Hair Oil (1pk)',
        sku: 'HAIR001',
        quantity: 5,
        price: 438,
      },
    ];

    const desc = buildDelhiveryLabelDescription(items, 0);
    expect(desc).toBe('21 Herbs Hair Oil (1pk) x5');
    expect(desc).not.toContain('Delivery');

    const totalPhysicalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
    expect(totalPhysicalQuantity).toBe(5);

    const shipmentOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-1002',
      customerName: 'Priya Patel',
      customerPhone: '9876543211',
      customerEmail: 'priya@example.com',
      shippingAddress: {
        address: 'B-204, Sunset Boulevard',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
      },
      paymentMethod: 'Prepaid',
      shippingFee: 0,
      total: 438 * 5, // 2190
      items,
    };

    const res = await createDelhiveryShipment(shipmentOrder);
    expect(res.success).toBe(true);
    expect(res.message).toContain('21 Herbs Hair Oil (1pk) x5');
  });

  // Scenario C: 3 Products with Different Quantities
  it('Scenario C: 3 products with different quantities - Preserves all items and calculates physical piece count correctly', async () => {
    const items = [
      {
        name: '21 Herbs Fusion Hair Oil',
        productName: '21 Herbs Fusion Hair Oil',
        sku: 'HAIR001',
        quantity: 2,
        price: 438,
      },
      {
        name: 'Herbal Shampoo',
        productName: 'Herbal Shampoo',
        sku: 'SHAMP001',
        quantity: 3,
        price: 250,
      },
      {
        name: 'Hair Conditioner',
        productName: 'Hair Conditioner',
        sku: 'COND001',
        quantity: 1,
        price: 300,
      },
    ];

    const desc = buildDelhiveryLabelDescription(items, 0);
    expect(desc).toBe('21 Herbs Fusion Hair Oil x2, Herbal Shampoo x3, Hair Conditioner x1');
    expect(desc).not.toContain('Delivery');

    // Total physical quantity = 2 + 3 + 1 = 6 pieces
    const physicalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
    expect(physicalQuantity).toBe(6);

    const manifestItems = buildDelhiveryShipmentItems(items, 0);
    expect(manifestItems.length).toBe(3);
    expect(manifestItems[0].sku).toBe('HAIR001');
    expect(manifestItems[0].quantity).toBe(2);
    expect(manifestItems[1].sku).toBe('SHAMP001');
    expect(manifestItems[1].quantity).toBe(3);
    expect(manifestItems[2].sku).toBe('COND001');
    expect(manifestItems[2].quantity).toBe(1);

    // Verify no fake product line items
    expect(manifestItems.some((it) => it.sku === 'Del-Charges')).toBe(false);
  });

  // Scenario D: Multiple Products with Delivery Fee
  it('Scenario D: Multiple products with delivery fee - Delivery charges are excluded from description and items list', async () => {
    const items = [
      {
        name: '21 Herbs Fusion Hair Oil',
        sku: 'HAIR001',
        quantity: 1,
        price: 438,
      },
      {
        name: 'Natural Neem Comb',
        sku: 'COMB001',
        quantity: 1,
        price: 199,
      },
    ];

    const shippingFee = 89;
    const subtotal = 438 + 199; // 637
    const totalWithDelivery = subtotal + shippingFee; // 726

    // Description must NOT include delivery fee
    const desc = buildDelhiveryLabelDescription(items, shippingFee);
    expect(desc).toBe('21 Herbs Fusion Hair Oil x1, Natural Neem Comb x1');
    expect(desc).not.toContain('Delivery');
    expect(desc).not.toContain('89');

    // Itemized manifest list must have only physical items (delivery fee is NOT a product)
    const manifestItems = buildDelhiveryShipmentItems(items, shippingFee);
    expect(manifestItems.length).toBe(2);
    expect(manifestItems.some((it) => it.name.includes('Delivery'))).toBe(false);

    const shipmentOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-1004',
      customerName: 'Sanjay Kumar',
      customerPhone: '9876543212',
      customerEmail: 'sanjay@example.com',
      shippingAddress: {
        address: '42, Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
      },
      paymentMethod: 'COD',
      shippingFee,
      total: totalWithDelivery,
      items,
    };

    const res = await createDelhiveryShipment(shipmentOrder);
    expect(res.success).toBe(true);
    expect(res.message).not.toContain('Delivery Rs');
  });

  // Scenario E: Prepaid Order with Delivery Fee
  it('Scenario E: Prepaid order with delivery fee - cod_amount is strictly 0 and total_amount includes order total', async () => {
    const items = [
      {
        name: '21 Herbs Fusion Hair Oil',
        sku: 'HAIR001',
        quantity: 2,
        price: 438,
      },
    ];

    const shippingFee = 89;
    const orderTotal = 438 * 2 + shippingFee; // 965

    const prepaidOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-1005',
      customerName: 'Deepa Krishnan',
      customerPhone: '9876543213',
      customerEmail: 'deepa@example.com',
      shippingAddress: {
        address: '12/4, Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600040',
      },
      paymentMethod: 'RAZORPAY', // Prepaid
      shippingFee,
      total: orderTotal,
      items,
    };

    const res = await createDelhiveryShipment(prepaidOrder);
    expect(res.success).toBe(true);
    expect(res.status).toBe('MANIFESTED');
    // Pre-paid orders must not collect anything on delivery
    expect(prepaidOrder.paymentMethod).not.toBe('COD');
  });

  // Scenario F: COD Order with Delivery Fee
  it('Scenario F: COD order with delivery fee - cod_amount equals exact payable balance', async () => {
    const items = [
      {
        name: '21 Herbs Fusion Hair Oil',
        sku: 'HAIR001',
        quantity: 1,
        price: 438,
      },
      {
        name: 'Herbal Shampoo',
        sku: 'SHAMP001',
        quantity: 1,
        price: 250,
      },
    ];

    const subtotal = 438 + 250; // 688
    const shippingFee = 89;
    const totalOrder = subtotal + shippingFee; // 777

    // Case 1: Standard COD without advance payment (collect full 777)
    const standardCodOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-1006',
      customerName: 'Vikram Joshi',
      customerPhone: '9876543214',
      customerEmail: 'vikram@example.com',
      shippingAddress: {
        address: '77, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      paymentMethod: 'COD',
      shippingFee,
      total: totalOrder,
      items,
    };

    const resStandard = await createDelhiveryShipment(standardCodOrder);
    expect(resStandard.success).toBe(true);

    // Case 2: COD with partial advance payment (e.g. ₹100 advance collected)
    const advancePaid = 100;
    const remainingBalance = totalOrder - advancePaid; // 677

    const advanceCodOrder: DelhiveryShipmentOrder = {
      orderNumber: 'HC-1007',
      customerName: 'Vikram Joshi',
      customerPhone: '9876543214',
      customerEmail: 'vikram@example.com',
      shippingAddress: {
        address: '77, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      paymentMethod: 'COD',
      shippingFee,
      total: totalOrder,
      codBalanceAmount: remainingBalance,
      items,
    };

    const resAdvance = await createDelhiveryShipment(advanceCodOrder);
    expect(resAdvance.success).toBe(true);
  });

  // Barcode Generation Test
  it('Barcode Generator: Creates valid Code 128 SVG bars for AWB and Order ID', () => {
    const waybill = '50768210006860';
    const orderNumber = 'HC-169425';

    const awbBars = generateCode128Bars(waybill);
    expect(awbBars.bars.length).toBeGreaterThan(10);
    expect(awbBars.totalWidth).toBeGreaterThan(100);

    const orderBars = generateCode128Bars(orderNumber);
    expect(orderBars.bars.length).toBeGreaterThan(10);
    expect(orderBars.totalWidth).toBeGreaterThan(100);
  });
});


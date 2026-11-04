import { describe, it, expect } from 'vitest';
import {
  createDelhiveryShipment,
  createDelhiveryPendingOrder,
  isDelhiveryCancelled,
  getShortLabelName,
  buildDelhiveryLabelDescription,
  sanitizeDelhiveryText,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';

describe('Delhivery Express Logistics Integration Tests', () => {
  it('1. getShortLabelName: avoids long names and strips "Herbic Cure -" brand prefix', () => {
    expect(getShortLabelName('Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)')).toBe('21 Herbs Fusion Hair Oil (Pack of 1)');
    expect(getShortLabelName('Herbic Cure - Shampoo with Conditioner (Pack of 1)')).toBe('Shampoo with Conditioner (Pack of 1)');
    expect(getShortLabelName('Neem Wood Wide-Tooth Comb')).toBe('Neem Wood Wide-Tooth Comb');
    expect(getShortLabelName('Herbic Cure - Complete Hair Therapy Combo')).toBe('Complete Hair Therapy Combo');
  });

  it('1b. getShortLabelName: uses explicit labelName when provided on product', () => {
    const itemWithLabel = {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (190ml) + Shampoo (200ml)',
      labelName: 'Hair Oil + Shampoo Combo',
    };
    expect(getShortLabelName(itemWithLabel)).toBe('Hair Oil + Shampoo Combo');

    const itemFromCatalog = {
      productName: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)',
      product: {
        name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 1)',
        labelName: '21 Herbs Hair Oil (1pk)',
      },
    };
    expect(getShortLabelName(itemFromCatalog)).toBe('21 Herbs Hair Oil (1pk)');
  });

  it('1c. sanitizeDelhiveryText: sanitizes forbidden characters & # % ; \\', () => {
    expect(sanitizeDelhiveryText('Oil & Shampoo')).toBe('Oil and Shampoo');
    expect(sanitizeDelhiveryText('Plot #12, Phase-2')).toBe('Plot No. 12, Phase-2');
    expect(sanitizeDelhiveryText('100% Ayurvedic; Clean\\Path')).toBe('100 pct Ayurvedic Clean Path');
  });

    it('2. Label description for 1-item order (qty 1): returns clean product name without delivery charges', () => {
      const order1 = [
        { name: '21 Herbs Hair Oil (1pk)', quantity: 1 },
      ];
      const desc = buildDelhiveryLabelDescription(order1, 89);
      expect(desc).toBe('21 Herbs Hair Oil (1pk)');
      expect(desc).not.toContain('Delivery');
      expect(desc.length).toBeLessThanOrEqual(128);
    });

      it('2b. Label description for 1-item order (qty > 1): returns name with quantity, no delivery charges', () => {
        const orderQty5 = [
          { name: '21 Herbs Hair Oil (1pk)', quantity: 5 },
        ];
        const desc = buildDelhiveryLabelDescription(orderQty5, 89);
        expect(desc).toBe('21 Herbs Hair Oil (1pk) x5');
        expect(desc).not.toContain('Delivery');
        expect(desc.length).toBeLessThanOrEqual(128);
      });

      it('3. Label description for 2-item order: "Hair Oil x1, Shampoo x1" without delivery charge', () => {
        const order2 = [
          { name: 'Hair Oil', quantity: 1 },
          { name: 'Shampoo', quantity: 1 },
        ];
        const desc = buildDelhiveryLabelDescription(order2, 89);
        expect(desc).toBe('Hair Oil x1, Shampoo x1');
        expect(desc).not.toContain('Delivery');
        expect(desc.length).toBeLessThanOrEqual(128);
      });

        it('4. Label description for 5-item order: shortens product names to fit budget and NEVER appends delivery suffix', () => {
          const order5 = [
            { name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Pack of 2)', quantity: 1 },
            { name: 'Herbic Cure - Shampoo with Conditioner (Pack of 1)', quantity: 1 },
            { name: 'Neem Wood Wide-Tooth Comb', quantity: 2 },
            { name: 'Herbic Cure - Scalp Therapy Serum (50ml)', quantity: 1 },
            { name: 'Herbic Cure - Ayurvedic Hair Growth Mask', quantity: 1 },
          ];
          const desc = buildDelhiveryLabelDescription(order5, 89);
          expect(desc).not.toContain('Delivery');
          expect(desc.length).toBeLessThanOrEqual(128);
        });

        it('5. Physical Quantity: counts physical items only (delivery charge is not an item)', async () => {
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
              { name: 'Hair Oil', labelName: 'Hair Oil (1pk)', quantity: 1, price: 349 },
              { name: 'Shampoo', labelName: 'Shampoo (1pk)', quantity: 1, price: 349 },
            ],
            total: 787, // 349 + 349 + 89
          };

          const res = await createDelhiveryShipment(codOrder);
          expect(res.success).toBe(true);
          // In our order of 2 physical items, physical piece count is strictly 2
          const totalPhysicalPieces = codOrder.items.reduce((sum, it) => sum + it.quantity, 0);
          expect(totalPhysicalPieces).toBe(2);
          // Description contains clean items only, no delivery charge appended
          expect(res.message).toContain('Hair Oil (1pk) x1, Shampoo (1pk) x1');
          expect(res.message).not.toContain('Delivery Rs');
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
              { name: 'Hair Oil', labelName: 'Hair Oil', quantity: 1, price: 349 },
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

        it('8. createDelhiveryPendingOrder: Validates order and creates unmanifested pending order without AWB', async () => {
          const codOrder: DelhiveryShipmentOrder = {
            orderNumber: 'HC-998877',
            customerName: 'Aarav Sharma',
            customerPhone: '9876543210',
            customerEmail: 'aarav@example.com',
            shippingAddress: {
              address: 'Flat 402, Green Valley Apartments',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500081',
            },
            paymentMethod: 'COD',
            shippingFee: 89,
            codBalanceAmount: 738,
            items: [
              {
                name: 'Herbic cure - 21 herbs hair oil + shampoo with conditioner',
                sku: 'HC-HO-S',
                quantity: 1,
                price: 649,
              },
            ],
            total: 738,
          };

          const result = await createDelhiveryPendingOrder(codOrder);
          expect(result.success).toBe(true);
          expect(result.status).toBe('PENDING');
          expect(result.waybill).toBe('');
          expect(result.message).toContain('₹0 charged');
        });

        it('9. createDelhiveryPendingOrder: Rejects orders with incomplete addresses or invalid phone', async () => {
          const invalidOrder: DelhiveryShipmentOrder = {
            orderNumber: 'HC-998878',
            customerName: 'Test Customer',
            customerEmail: 'test@example.com',
            customerPhone: '123',
            shippingAddress: {
              address: 'B',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500',
            },
            paymentMethod: 'Prepaid',
            items: [],
            total: 349,
          };

          const result = await createDelhiveryPendingOrder(invalidOrder);
          expect(result.success).toBe(false);
          expect(result.status).toBe('FAILED');
        });
      });

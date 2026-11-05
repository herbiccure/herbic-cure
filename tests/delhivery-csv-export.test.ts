import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as exportCsvHandler } from '@/app/api/admin/orders/export-delhivery-csv/route';
import { prisma } from '@/lib/prisma';
import * as adminAuth from '@/lib/auth/adminAuth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    shipmentEvent: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('@/lib/auth/adminAuth', () => ({
  requireAdminAuth: vi.fn(),
}));

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

describe('Delhivery One Forward Orders 41-Column Bulk CSV Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DELHIVERY_PICKUP_LOCATION = 'HERBIC CURE B2C';
    vi.mocked(adminAuth.requireAdminAuth).mockResolvedValue({
      id: 'admin_1',
      email: 'admin@herbiccure.com',
      role: 'ADMIN',
    } as any);
  });

  it('exports orders in the official 41-column template with multi-SKU native rows', async () => {
    const mockOrders = [
      {
        id: 'ord-101',
        orderNumber: 'HC-ORD-101',
        customerName: 'Priya Sharma',
        customerPhone: '+91 9876543210',
        customerEmail: 'priya@example.com',
        shippingAddress: JSON.stringify({
          address: 'Flat 301 Lotus Heights',
          addressLine2: 'Kavuri Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
        }),
        paymentMethod: 'Prepaid',
        total: 798,
        createdAt: new Date('2026-11-05T10:00:00Z'),
        items: [
          {
            productId: 'prod_oil',
            productName: '21 Herbs Fusion Hair Oil (200ml)',
            quantity: 2,
            price: 349,
            product: { sku: 'HC-OIL-Q1' },
          },
        ],
      },
      {
        id: 'ord-102',
        orderNumber: 'HC-ORD-102',
        customerName: 'Vikram Patel',
        customerPhone: '9440156789',
        customerEmail: 'vikram@example.com',
        shippingAddress: JSON.stringify({
          address: 'Plot 45 Green Avenue',
          city: 'Vijayawada',
          state: 'Andhra Pradesh',
          pincode: '520001',
        }),
        paymentMethod: 'COD',
        total: 648,
        advanceAmount: 0,
        codBalanceAmount: 648,
        createdAt: new Date('2026-11-05T11:00:00Z'),
        items: [
          {
            productId: 'prod_oil',
            productName: '21 Herbs Fusion Hair Oil',
            quantity: 1,
            price: 349,
            product: { sku: 'HC-OIL-Q1' },
          },
          {
            productId: 'prod_shmp',
            productName: 'Herbal Anti-Dandruff Shampoo',
            quantity: 1,
            price: 299,
            product: { sku: 'HC-SHMP-Q1' },
          },
        ],
      },
    ];

    vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

    const req = new NextRequest('http://localhost:3000/api/admin/orders/export-delhivery-csv');
    const res = await exportCsvHandler(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');

    const csvText = await res.text();
    const lines = csvText.trim().split('\r\n');

    // Header validation (Row 1)
    const headerCols = parseCsvLine(lines[0]);
    expect(headerCols.length).toBe(41);
    expect(headerCols[0]).toBe('*Sale Order Number');
    expect(headerCols[1]).toBe('*Pickup Location Name');
    expect(headerCols[2]).toBe('*Transport Mode');
    expect(headerCols[3]).toBe('*Payment Mode');
    expect(headerCols[4]).toBe('COD Amount');
    expect(headerCols[5]).toBe('*Customer Name');
    expect(headerCols[6]).toBe('*Customer Phone');
    expect(headerCols[12]).toBe('*Item Sku Code');
    expect(headerCols[13]).toBe('*Item Sku Name');
    expect(headerCols[14]).toBe('*Quantity Ordered');
    expect(headerCols[16]).toBe('*Unit Item Price');
    expect(headerCols[33]).toBe('Seller Name');
    expect(headerCols[40]).toBe('Select NDD');

    // Total rows: 1 header + 1 row for Order 1 + 2 rows for Order 2 (multi-SKU) = 4 rows
    expect(lines.length).toBe(4);

    // Order 1 (Prepaid, single item)
    const ord1Cols = parseCsvLine(lines[1]);
    expect(ord1Cols.length).toBe(41);
    expect(ord1Cols[0]).toBe('HC-ORD-101');
    expect(ord1Cols[1]).toBe('HERBIC CURE B2C');
    expect(ord1Cols[2]).toBe('Surface');
    expect(ord1Cols[3]).toBe('Prepaid');
    expect(ord1Cols[4]).toBe('0');
    expect(ord1Cols[5]).toBe('Priya Sharma');
    expect(ord1Cols[6]).toBe('9876543210');
    expect(ord1Cols[12]).toBe('HC-OIL-Q1');
    expect(ord1Cols[14]).toBe('2'); // Quantity: 2
    expect(ord1Cols[33]).toBe(''); // Seller Name empty (inherits from *Pickup Location Name)
    expect(ord1Cols[34]).toBe(''); // Seller GST Number strictly empty to prevent 400 invalid gstin error
    expect(ord1Cols[40]).toBe('No'); // Select NDD

    // Order 2 (COD, item 1)
    const ord2Item1 = parseCsvLine(lines[2]);
    expect(ord2Item1.length).toBe(41);
    expect(ord2Item1[0]).toBe('HC-ORD-102');
    expect(ord2Item1[3]).toBe('COD');
    expect(ord2Item1[4]).toBe('648');
    expect(ord2Item1[12]).toBe('HC-OIL-Q1');
    expect(ord2Item1[14]).toBe('1');

    // Order 2 (COD, item 2 - multi-SKU native row)
    const ord2Item2 = parseCsvLine(lines[3]);
    expect(ord2Item2.length).toBe(41);
    expect(ord2Item2[0]).toBe('HC-ORD-102'); // Same Sale Order Number
    expect(ord2Item2[3]).toBe('COD');
    expect(ord2Item2[4]).toBe('648');
    expect(ord2Item2[12]).toBe('HC-SHMP-Q1'); // Separate SKU
    expect(ord2Item2[14]).toBe('1');
  });

  it('handles edge cases safely: multi-line addresses, stripped fees, and JSON phone numbers', async () => {
    const edgeCaseOrders = [
      {
        id: 'ord-edge-1',
        orderNumber: 'HC-EDGE-001',
        customerName: 'Kiran\nKumar',
        customerPhone: null,
        customerEmail: 'kiran@example.com',
        shippingAddress: JSON.stringify({
          name: 'Kiran Kumar',
          phone: '+91 8688888114',
          address: 'House 1-2-3\nFirst Floor\nNear Temple',
          addressLine2: 'Main Road\nOpp Park',
          city: 'Bapatla\n',
          state: 'Andhra Pradesh',
          pincode: '522101',
        }),
        paymentMethod: 'COD',
        total: 438,
        advanceAmount: 0,
        codBalanceAmount: 438,
        createdAt: new Date('2026-11-05T12:00:00Z'),
        items: [
          {
            productId: 'prod_oil',
            productName: '21 Herbs Hair Oil, delivery rs 89 x1',
            quantity: 1,
            price: 349,
            product: { sku: 'HC-OIL-Q1' },
          },
        ],
      },
    ];

    vi.mocked(prisma.order.findMany).mockResolvedValue(edgeCaseOrders as any);

    const req = new NextRequest('http://localhost:3000/api/admin/orders/export-delhivery-csv');
    const res = await exportCsvHandler(req);

    expect(res.status).toBe(200);
    const csvText = await res.text();
    const lines = csvText.trim().split('\r\n');

    expect(lines.length).toBe(2); // Header + 1 clean row (no line breaks in values!)

    const cols = parseCsvLine(lines[1]);
    expect(cols.length).toBe(41);
    expect(cols[0]).toBe('HC-EDGE-001');
    expect(cols[1]).toBe('HERBIC CURE B2C');
    expect(cols[5]).toBe('Kiran Kumar'); // Stripped \n
    expect(cols[6]).toBe('8688888114'); // Extracted from address JSON
    expect(cols[7]).toBe('House 1-2-3 First Floor Near Temple'); // Stripped \n
    expect(cols[8]).toBe('Main Road Opp Park'); // Stripped \n
    expect(cols[9]).toBe('Bapatla'); // Stripped \n
    expect(cols[11]).toBe('522101');
    expect(cols[13]).toBe('21 Herbs Hair Oil'); // Stripped delivery rs fee & x1
    expect(cols[33]).toBe(''); // Seller Name empty
    expect(cols[34]).toBe(''); // Seller GST Number empty
    expect(cols[40]).toBe('No'); // Select NDD
  });

  it('validates public/delhivery-test-orders-sample.csv structure has strictly 41 columns and empty GSTIN column', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'delhivery-test-orders-sample.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = content.trim().split(/\r?\n/);

    expect(rows.length).toBe(7); // 1 header + 6 order rows

    for (let i = 0; i < rows.length; i++) {
      const cols = parseCsvLine(rows[i]);
      expect(cols.length).toBe(41);
      if (i > 0) {
        // Column 35 (Index 34) is Seller GST Number -> must be strictly empty to prevent 400 invalid gstin
        expect(cols[34]).toBe('');
        // Column 41 (Index 40) is Select NDD
        expect(cols[40]).toBe('No');
        // Column 2 (Index 1) is *Pickup Location Name
        expect(cols[1]).toBe('HERBIC CURE B2C');
      }
    }
  });
});

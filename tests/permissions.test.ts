import { describe, it, expect } from 'vitest';
import { hasPermission, assertPermission, isAdminRole, ForbiddenError } from '../src/lib/permissions/guard';
import { AppResource, AppAction } from '../src/lib/permissions/types';

describe('RBAC Permission Matrix Unit Tests', () => {
  const allResources: AppResource[] = [
    'PRODUCT',
    'ORDER',
    'CUSTOMER',
    'COUPON',
    'REVIEW',
    'MEDIA',
    'BLOG',
    'STAFF',
    'REFUND',
    'AUDIT_LOG',
    'SYSTEM_SETTINGS',
  ];

  const allActions: AppAction[] = [
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'INVITE',
    'EXPORT',
  ];

  it('CUSTOMER must have ZERO admin permissions across all resources', () => {
    for (const res of allResources) {
      for (const act of allActions) {
        expect(hasPermission('CUSTOMER', res, act)).toBe(false);
      }
    }
  });

  it('CUSTOMER must throw ForbiddenError when asserting admin permission', () => {
    expect(() => assertPermission('CUSTOMER', 'ORDER', 'READ')).toThrow(ForbiddenError);
    expect(() => assertPermission('CUSTOMER', 'PRODUCT', 'CREATE')).toThrow(ForbiddenError);
  });

  it('OWNER must have comprehensive authority across all resources and actions', () => {
    for (const res of allResources) {
      for (const act of allActions) {
        expect(hasPermission('OWNER', res, act)).toBe(true);
      }
    }
  });

  it('MANAGER permissions verification', () => {
    // MANAGER can manage catalog and orders
    expect(hasPermission('MANAGER', 'PRODUCT', 'CREATE')).toBe(true);
    expect(hasPermission('MANAGER', 'PRODUCT', 'UPDATE')).toBe(true);
    expect(hasPermission('MANAGER', 'ORDER', 'READ')).toBe(true);
    expect(hasPermission('MANAGER', 'ORDER', 'UPDATE')).toBe(true);
    expect(hasPermission('MANAGER', 'COUPON', 'CREATE')).toBe(true);

    // MANAGER can request refund but CANNOT approve refund
    expect(hasPermission('MANAGER', 'REFUND', 'CREATE')).toBe(true);
    expect(hasPermission('MANAGER', 'REFUND', 'APPROVE')).toBe(false);

    // MANAGER CANNOT invite or delete staff
    expect(hasPermission('MANAGER', 'STAFF', 'INVITE')).toBe(false);
    expect(hasPermission('MANAGER', 'STAFF', 'DELETE')).toBe(false);
  });

  it('SUPPORT permissions verification', () => {
    // SUPPORT has read-only access for customer service
    expect(hasPermission('SUPPORT', 'ORDER', 'READ')).toBe(true);
    expect(hasPermission('SUPPORT', 'CUSTOMER', 'READ')).toBe(true);
    expect(hasPermission('SUPPORT', 'PRODUCT', 'READ')).toBe(true);

    // SUPPORT CANNOT edit products or coupons
    expect(hasPermission('SUPPORT', 'PRODUCT', 'CREATE')).toBe(false);
    expect(hasPermission('SUPPORT', 'PRODUCT', 'DELETE')).toBe(false);
    expect(hasPermission('SUPPORT', 'COUPON', 'CREATE')).toBe(false);
    expect(hasPermission('SUPPORT', 'REFUND', 'APPROVE')).toBe(false);
    expect(hasPermission('SUPPORT', 'STAFF', 'INVITE')).toBe(false);
  });

  it('isAdminRole correctly identifies staff vs customer', () => {
    expect(isAdminRole('OWNER')).toBe(true);
    expect(isAdminRole('MANAGER')).toBe(true);
    expect(isAdminRole('SUPPORT')).toBe(true);
    expect(isAdminRole('CUSTOMER')).toBe(false);
    expect(isAdminRole('ANONYMOUS')).toBe(false);
  });
});

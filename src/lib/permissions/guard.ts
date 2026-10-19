import { AppResource, AppAction } from './types';

export class ForbiddenError extends Error {
  constructor(message = 'Access forbidden: insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function isAdminRole(role?: string | null): boolean {
  if (!role || typeof role !== 'string') return false;
  const normalized = role.trim().toUpperCase();
  // Normal users and customers strictly forbidden from admin access
  if (normalized === 'CUSTOMER' || normalized === 'USER') {
    return false;
  }
  return [
    'OWNER',
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'STORE_MANAGER',
    'STAFF',
    'SUPPORT',
  ].includes(normalized);
}

/**
 * Strict Deny-by-Default Permission Matrix for Herbic Cure E-Commerce.
 */
export function hasPermission(role: string, resource: AppResource, action: AppAction): boolean {
  // Normal users and customers have zero admin permissions
  if (!role || !isAdminRole(role)) {
    return false;
  }

  const normalized = role.trim().toUpperCase();

  // OWNER, SUPER_ADMIN, and ADMIN have comprehensive authority
  if (['OWNER', 'SUPER_ADMIN', 'ADMIN'].includes(normalized)) {
    return true;
  }

  // MANAGER permissions
  if (role === 'MANAGER') {
    switch (resource) {
      case 'PRODUCT':
      case 'COUPON':
      case 'MEDIA':
      case 'BLOG':
        return ['CREATE', 'READ', 'UPDATE', 'DELETE'].includes(action);
      case 'ORDER':
        return ['READ', 'UPDATE'].includes(action);
      case 'REVIEW':
        return ['READ', 'UPDATE', 'APPROVE'].includes(action);
      case 'CUSTOMER':
        return action === 'READ';
      case 'REFUND':
        // MANAGER can initiate refund request and view, but CANNOT approve
        return ['CREATE', 'READ'].includes(action);
      case 'AUDIT_LOG':
        return action === 'READ';
      case 'SYSTEM_SETTINGS':
        return ['READ', 'UPDATE'].includes(action);
      case 'STAFF':
        // MANAGER cannot invite or delete staff
        return false;
      default:
        return false;
    }
  }

  // SUPPORT permissions (Read-only, customer assistance)
  if (role === 'SUPPORT') {
    switch (resource) {
      case 'ORDER':
        return ['READ', 'UPDATE'].includes(action); // Can add notes / update delivery queries
      case 'PRODUCT':
      case 'REVIEW':
      case 'CUSTOMER':
      case 'REFUND':
        return action === 'READ';
      default:
        return false;
    }
  }

  return false;
}

export function assertPermission(role: string, resource: AppResource, action: AppAction): void {
  if (!hasPermission(role, resource, action)) {
    throw new ForbiddenError(
      `Role '${role}' is not authorized to perform '${action}' on resource '${resource}'.`
    );
  }
}

export type UserRole = 'OWNER' | 'MANAGER' | 'SUPPORT' | 'CUSTOMER';

export type AppResource =
  | 'PRODUCT'
  | 'ORDER'
  | 'CUSTOMER'
  | 'COUPON'
  | 'REVIEW'
  | 'MEDIA'
  | 'BLOG'
  | 'STAFF'
  | 'REFUND'
  | 'AUDIT_LOG'
  | 'SYSTEM_SETTINGS';

export type AppAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'INVITE'
  | 'EXPORT';

export interface PermissionCheck {
  resource: AppResource;
  action: AppAction;
}

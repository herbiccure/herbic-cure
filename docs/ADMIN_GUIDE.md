# Herbic Cure Admin Console - Operator & Security Guide

## 1. Architecture & Role-Based Access Control (RBAC)
The Herbic Cure Administrative Console lives in the isolated route group `src/app/(admin)/admin` and enforces strict deny-by-default access control:

| Role | Catalog & Deals | Orders & Inventory | Refunds | Staff Management | Audit Trail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OWNER** | Full CRUD | Full Access | Full Approval | Invite & Revoke | Full View |
| **MANAGER** | Full CRUD | Read / Status Update | Request Only | Denied | Read View |
| **SUPPORT** | Read Only | Read / Update Notes | Read Only | Denied | Denied |
| **CUSTOMER**| Denied (403) | Denied (403) | Denied (403) | Denied (403) | Denied (403) |

## 2. Bootstrapping Initial OWNER
An initial OWNER account was provisioned via `scripts/seed-owner.ts`:
- **Email**: `owner@herbiccure.com`
- **Role**: `OWNER`
- **Password**: `HerbicCure@Owner#2026`
- **Hash Algorithm**: Argon2id (`m=65536, t=3, p=4`)

## 3. Last-OWNER Safety Protection
To prevent accidental administrative lockouts, `src/data/admin/staff.ts` enforces a database concurrency check before deleting or demoting any OWNER. If only 1 active OWNER exists on the platform, the operation is blocked with:
`OPERATION ABORTED: Cannot remove or demote the last remaining OWNER of the platform.`

## 4. Two-Tier Refund Authorization
1. Any staff member (`MANAGER`, `SUPPORT`, or `OWNER`) can initiate a refund request from `/admin/refunds`.
2. The request is placed in `PENDING` status.
3. Only an active `OWNER` can approve and finalize the refund payout.
4. Once approved, an atomic transaction updates the order status to `REFUNDED`, changes payment status to `REFUNDED`, and records an immutable entry in the audit trail.

## 5. Audit Logging
Every sensitive action (staff invitation, staff revocation, refund approval, login success, DPDP account anonymization) writes an immutable record to the `AuditLog` table capturing:
- Actor ID, Actor Email, and Role
- Resource & Resource ID
- Action Type
- Before/After Diff JSON
- IP Address & User Agent
- Timestamp (UTC)

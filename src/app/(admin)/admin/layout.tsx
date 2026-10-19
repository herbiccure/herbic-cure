import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/adminAuth';
import { getServerSession } from '@/lib/auth/server';
import { isAdminRole } from '@/lib/permissions/guard';
import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { verifySessionToken, CustomerSessionPayload } from '@/lib/auth/session';

export const metadata = {
  title: 'Herbic Cure Admin Console',
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Check for verified admin session (either admin_session HMAC token or admin Better-Auth session)
  const adminSession = await getAdminSession();

  // 2. Check for regular customer session
  const betterSession = await getServerSession();
  const cookieStore = await cookies();
  const customerCookie = cookieStore.get('customer_session')?.value;
  const verifiedCustomer = customerCookie ? verifySessionToken<CustomerSessionPayload>(customerCookie) : null;

  const betterRole = (betterSession?.user as { role?: string })?.role;
  const isNormalUser = 
    (betterSession?.user && !isAdminRole(betterRole)) ||
    Boolean(verifiedCustomer);

  // 3. STRICT GUARD: If visitor is signed in as a normal customer or non-admin user,
  // completely deny admin shell and render an isolated, secure 403 Forbidden screen.
  if (!adminSession && isNormalUser) {
    const userEmail = betterSession?.user?.email || verifiedCustomer?.email || 'Customer';

    return (
      <div className="min-h-screen bg-[#FCF8F9] flex flex-col items-center justify-center p-4 sm:p-6 text-[#2D1B1B]">
        <div className="w-full max-w-md bg-white border border-[#EAC9D1] rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 mb-2">
              Access Restricted
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#2D1B1B]">
              Admin Console Forbidden
            </h1>
            <p className="mt-2 text-xs text-[#7A5B64] leading-relaxed">
              Your account (<strong className="text-[#2D1B1B]">{userEmail}</strong>) is a customer account. Normal customer accounts are strictly prohibited from accessing the Herbic Cure administrative console.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800 text-left space-y-1">
            <p className="font-semibold">Looking for your orders or account?</p>
            <p className="text-amber-700">Please return to the storefront or access your customer account dashboard.</p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#8C3A4F] hover:bg-[#722E3F] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Customer Storefront</span>
            </Link>

            <Link
              href="/account"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#7A5B64] hover:text-[#2D1B1B] hover:bg-stone-50 transition-all border border-[#EAC9D1]"
            >
              View My Customer Account
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-[#A38D95] mt-6">
          Herbic Cure Security • Role-Based Access Enforcement
        </p>
      </div>
    );
  }

  // 4. Authenticated admin session or login route
  const activeRole = adminSession?.role || 'OWNER';

  return (
    <AdminThemeProvider>
      <AdminShell userRole={activeRole} isAuthenticated={Boolean(adminSession)}>
        {children}
      </AdminShell>
    </AdminThemeProvider>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, CustomerSessionPayload, AdminSessionPayload } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitError = enforceRateLimit(request, 'user_orders_lookup', 20, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    // 2. Check Authentication (Customer Session or Admin Session)
    const customerToken = request.cookies.get('customer_session')?.value;
    const adminToken = request.cookies.get('admin_session')?.value;

    const customerSession = customerToken ? verifySessionToken<CustomerSessionPayload>(customerToken) : null;
    const adminSession = adminToken ? verifySessionToken<AdminSessionPayload>(adminToken) : null;

    const { searchParams } = new URL(request.url);
    const queryEmail = searchParams.get('email')?.toLowerCase().trim();

    let targetEmail: string | null = null;

    if (adminSession) {
      // Administrators may query any customer email
      targetEmail = queryEmail || null;
    } else if (customerSession) {
      // Customers may strictly query only their own authenticated email (Anti-IDOR)
      targetEmail = customerSession.email.toLowerCase().trim();
    } else {
      // Unauthenticated access blocked
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to view order history' },
        { status: 401 }
      );
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { customerEmail: targetEmail },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch user orders' }, { status: 500 });
  }
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Package,
  MapPin,
  Shield,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

interface AddressItem {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export default function AccountPortalPage() {
  const router = useRouter();
  const { customer, logout, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile' | 'privacy'>('orders');

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Addresses State
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pinCode: '',
  });

  // Privacy / DPDP State
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!isLoading && !customer) {
      router.push('/account/login');
    }
  }, [customer, isLoading, router]);

  // Load orders
  useEffect(() => {
    if (customer && activeTab === 'orders') {
      fetch('/api/account/orders')
        .then((res) => res.json())
        .then((data) => {
          setOrders(data.orders || []);
          setLoadingOrders(false);
        })
        .catch(() => setLoadingOrders(false));
    }
  }, [customer, activeTab]);

  // Load addresses
  useEffect(() => {
    if (customer && activeTab === 'addresses') {
      let active = true;
      fetch('/api/account/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (active) {
            setAddresses(data.addresses || []);
            setLoadingAddresses(false);
          }
        })
        .catch(() => {
          if (active) setLoadingAddresses(false);
        });
      return () => { active = false; };
    }
  }, [customer, activeTab]);

  if (isLoading || !customer) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      if (res.ok) {
        toast.success('Address saved successfully');
        setShowAddAddress(false);
        setNewAddress({ name: '', phone: '', addressLine1: '', city: '', state: '', pinCode: '' });
        // Refresh
        const updated = await fetch('/api/account/addresses').then((r) => r.json());
        setAddresses(updated.addresses || []);
      }
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`/api/account/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Address removed');
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export-data');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `herbic-cure-data-${customer.id}.json`;
        a.click();
        toast.success('Your data export is ready and downloading.');
      }
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const verified = confirm(
      'DPDP ACCOUNT ERASURE: This will permanently anonymize your personal records and addresses. Orders will be anonymized for Indian tax records. Are you sure you wish to proceed?'
    );
    if (!verified) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete-account', { method: 'POST' });
      if (res.ok) {
        toast.success('Your account has been permanently anonymized.');
        await logout();
      }
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh]">

      {/* Administrator Quick Launch Banner */}
      {['ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER', 'STAFF'].includes(customer.role) && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF0F4] via-white to-[#F6DFE7] border border-[#EAC9D1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#8C3A4F] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#2D1B1B]">Administrative Access Privileges Active</p>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#8C3A4F] text-white">
                  {customer.role}
                </span>
              </div>
              <p className="text-xs text-[#7A5B64] mt-0.5">Manage store operations, orders, inventory, catalog products, and predictive intelligence.</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Open Admin Console</span>
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl shadow-emerald-950/10">
        <div>
          <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Ayurvedic Member Account</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mt-1">Namaste, {customer.name}</h1>
          <p className="text-emerald-200 text-sm mt-1">{customer.email}</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-700/50 cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-6 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'addresses'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & DPDP</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 rounded-3xl border border-stone-200/80">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-stone-800">No Orders Placed Yet</h3>
              <p className="text-stone-600 text-sm mt-1 max-w-sm mx-auto">
                Explore our classical Ayurvedic hair formulations crafted with 21 botanicals.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-emerald-800 text-white rounded-xl text-sm font-bold hover:bg-emerald-900 transition-all shadow-md shadow-emerald-900/10"
              >
                <span>Browse Products</span>
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-stone-900">{o.orderNumber}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        o.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.orderStatus === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Placed on {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {o.items?.length || 0} item(s)
                  </p>
                  <p className="text-sm font-bold text-stone-900 mt-2">
                    Total: ₹{o.total?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-stone-900">Delivery Addresses</h2>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleCreateAddress} className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
              <h3 className="font-bold text-sm text-stone-800">New Address Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Recipient Name"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="p-3 bg-white border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="10-digit Phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="p-3 bg-white border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="Street / Flat / House Address"
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  className="sm:col-span-2 p-3 bg-white border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="p-3 bg-white border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="p-3 bg-white border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="PIN Code"
                  value={newAddress.pinCode}
                  onChange={(e) => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                  className="p-3 bg-white border border-stone-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2 text-stone-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {loadingAddresses ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-stone-500 py-6">No saved addresses yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a.id} className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">{a.name}</h4>
                    <p className="text-xs text-stone-600 mt-1">{a.addressLine1}</p>
                    <p className="text-xs text-stone-600">{a.city}, {a.state} - {a.pinCode}</p>
                    <p className="text-xs text-stone-500 mt-1">Phone: {a.phone}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-stone-900">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-stone-500">Full Name</span>
              <p className="text-sm font-semibold text-stone-900 mt-0.5">{customer.name}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-stone-500">Email Address</span>
              <p className="text-sm font-semibold text-stone-900 mt-0.5">{customer.email}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-stone-500">Account Type</span>
              <p className="text-sm font-semibold text-emerald-800 mt-0.5">{customer.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY & DPDP */}
      {activeTab === 'privacy' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-700" />
              <span>Right to Data Portability (DPDP Act 2023)</span>
            </h3>
            <p className="text-sm text-stone-600 mt-2">
              Download a machine-readable JSON copy of all personal information, order history, addresses, and reviews linked to your account.
            </p>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download My Personal Data</span>
            </button>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200/80 shadow-sm">
            <h3 className="font-bold text-base text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Right to Erasure / Account Deletion</span>
            </h3>
            <p className="text-sm text-rose-800/80 mt-2">
              Permanently anonymizes your profile, removes stored addresses, and revokes all login sessions. Transaction records are retained in compliance with Indian GST & tax statutes with all personal identifiers redacted.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Permanently Anonymize My Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

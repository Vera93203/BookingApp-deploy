'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight, Calendar, CreditCard } from 'lucide-react';

export default function AdminBookingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { loadBookings(); }, [page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBookings(page, 20);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'bg-amber-100 text-amber-700';
      case 'PENDING_PAYMENT': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': case 'CANCELLED': case 'PAYMENT_FAILED': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'Awaiting Approval';
      case 'PENDING_PAYMENT': return 'Pending Payment';
      case 'PAYMENT_FAILED': return 'Payment Failed';
      default: return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };

  const paymentBadge = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'REFUNDED': return 'bg-purple-100 text-purple-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading && !data) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>;
  }

  const bookings = data?.bookings || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total bookings across the platform</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="table-header px-6 py-3">Booking ID</th>
                <th className="table-header px-6 py-3">Guest</th>
                <th className="table-header px-6 py-3">Property</th>
                <th className="table-header px-6 py-3">Dates</th>
                <th className="table-header px-6 py-3">Amount</th>
                <th className="table-header px-6 py-3">Payment</th>
                <th className="table-header px-6 py-3">Status</th>
                <th className="table-header px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">No bookings found</td>
                </tr>
              ) : bookings.map((booking: any) => (
                <tr key={booking.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {booking.id.substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{booking.guestName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      {booking.user?.phone || booking.user?.email || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{booking.property?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      <div>
                        <div>{booking.checkIn?.split('T')[0]}</div>
                        <div className="text-xs text-gray-400">→ {booking.checkOut?.split('T')[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {booking.currency || 'MMK'} {booking.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {booking.payment ? (
                      <div>
                        <span className={`badge ${paymentBadge(booking.payment.status)}`}>
                          {booking.payment.status}
                        </span>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <CreditCard size={10} /> {booking.payment.method}
                        </div>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${statusColor(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {data.page} of {data.totalPages} ({data.total} bookings)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="btn-outline py-1.5 px-3 text-sm flex items-center gap-1 disabled:opacity-40">
                <ChevronLeft size={16} /> Previous
              </button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="btn-outline py-1.5 px-3 text-sm flex items-center gap-1 disabled:opacity-40">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

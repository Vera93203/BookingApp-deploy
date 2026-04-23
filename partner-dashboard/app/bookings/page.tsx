'use client';
import { useEffect, useState } from 'react';
import { partnerApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, Eye, Filter } from 'lucide-react';
import Link from 'next/link';

type StatusFilter = 'ALL' | 'PAID_PENDING_PARTNER_APPROVAL' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      const res = await partnerApi.getBookings();
      setBookings(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredBookings = filter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const pendingCount = bookings.filter(b => b.status === 'PAID_PENDING_PARTNER_APPROVAL').length;

  const approveBooking = async (id: string) => {
    setActionLoading(id);
    try {
      await partnerApi.approveBooking(id);
      toast.success('Booking approved! Confirmation email sent.');
      loadBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setActionLoading(null); }
  };

  const rejectBooking = async () => {
    setActionLoading(rejectModal.id);
    try {
      await partnerApi.rejectBooking(rejectModal.id, rejectReason || undefined);
      toast.success('Booking rejected. Refund initiated.');
      setRejectModal({ id: '', open: false });
      setRejectReason('');
      loadBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally { setActionLoading(null); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'bg-amber-100 text-amber-700';
      case 'PENDING_PAYMENT': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': case 'CANCELLED': case 'PAYMENT_FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'Awaiting Approval';
      case 'PENDING_PAYMENT': return 'Pending Payment';
      default: return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          {pendingCount > 0 && (
            <p className="text-amber-600 text-sm mt-1">
              {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', 'PAID_PENDING_PARTNER_APPROVAL', 'CONFIRMED', 'REJECTED', 'CANCELLED'] as StatusFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f === 'ALL' ? 'All' : statusLabel(f)}
            {f === 'PAID_PENDING_PARTNER_APPROVAL' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white text-primary rounded-full px-1.5 py-0.5 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings table */}
      {filteredBookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50">
                  <th className="px-6 py-3">Guest</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Room</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm">{booking.guestName}</div>
                      <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                      {booking.guestEmail && <div className="text-xs text-gray-400">{booking.guestEmail}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">{booking.property?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.bookingItems?.map((i: any) => i.roomType?.name).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{booking.checkIn?.split('T')[0]}</div>
                      <div className="text-xs text-gray-400">→ {booking.checkOut?.split('T')[0]}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {booking.currency} {booking.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusColor(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === 'PAID_PENDING_PARTNER_APPROVAL' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveBooking(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: booking.id, open: true })}
                            disabled={actionLoading === booking.id}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <Link href={`/bookings/${booking.id}`}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 inline-flex">
                          <Eye size={16} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Reject Booking</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will reject the booking and initiate a refund to the guest.
            </p>
            <label className="label">Reason (optional)</label>
            <textarea className="input mb-4" rows={3} placeholder="e.g. Rooms not available for those dates"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal({ id: '', open: false }); setRejectReason(''); }}
                className="btn-outline flex-1">Cancel</button>
              <button onClick={rejectBooking} disabled={actionLoading !== null}
                className="btn-danger flex-1">
                {actionLoading ? 'Rejecting...' : 'Reject & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

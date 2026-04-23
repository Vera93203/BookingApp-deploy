'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { partnerApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X, User, Phone, Mail, Calendar, BedDouble, CreditCard } from 'lucide-react';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadBooking(); }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await partnerApi.getBookings();
      const found = res.data.find((b: any) => b.id === bookingId);
      setBooking(found || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approve = async () => {
    setActionLoading(true);
    try {
      await partnerApi.approveBooking(bookingId);
      toast.success('Booking approved! Confirmation email sent to guest.');
      loadBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setActionLoading(false); }
  };

  const reject = async () => {
    const reason = prompt('Reason for rejection (optional):');
    setActionLoading(true);
    try {
      await partnerApi.rejectBooking(bookingId, reason || undefined);
      toast.success('Booking rejected. Refund will be processed.');
      loadBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally { setActionLoading(false); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'Awaiting Your Approval';
      default: return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!booking) {
    return <div className="text-center py-20 text-gray-500">Booking not found</div>;
  }

  const nights = (() => {
    try {
      const ci = new Date(booking.checkIn);
      const co = new Date(booking.checkOut);
      return Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    } catch { return 0; }
  })();

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> Back to bookings
      </button>

      {/* Status banner */}
      <div className={`rounded-xl p-4 mb-6 border ${statusColor(booking.status)} flex items-center justify-between`}>
        <div>
          <span className="font-semibold text-lg">{statusLabel(booking.status)}</span>
          <p className="text-sm opacity-75 mt-0.5">Booking ID: {booking.id.substring(0, 8).toUpperCase()}</p>
        </div>
        {booking.status === 'PAID_PENDING_PARTNER_APPROVAL' && (
          <div className="flex gap-2">
            <button onClick={approve} disabled={actionLoading} className="btn-success flex items-center gap-1.5 text-sm">
              <Check size={16} /> Approve
            </button>
            <button onClick={reject} disabled={actionLoading} className="btn-danger flex items-center gap-1.5 text-sm">
              <X size={16} /> Reject
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Guest Information</h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Name" value={booking.guestName} />
            <InfoRow icon={Phone} label="Phone" value={booking.guestPhone} />
            {booking.guestEmail && <InfoRow icon={Mail} label="Email" value={booking.guestEmail} />}
            <InfoRow icon={User} label="Guests" value={`${booking.numberOfGuests} person${booking.numberOfGuests > 1 ? 's' : ''}`} />
          </div>
          {booking.specialRequests && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Special Requests:</p>
              <p className="text-sm mt-1">{booking.specialRequests}</p>
            </div>
          )}
        </div>

        {/* Stay info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Stay Details</h3>
          <div className="space-y-3">
            <InfoRow icon={Calendar} label="Check-in" value={booking.checkIn?.split('T')[0]} />
            <InfoRow icon={Calendar} label="Check-out" value={booking.checkOut?.split('T')[0]} />
            <InfoRow icon={Calendar} label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
            {booking.bookingItems?.map((item: any, i: number) => (
              <InfoRow key={i} icon={BedDouble} label="Room"
                value={`${item.roomType?.name || 'Room'} × ${item.quantity}`} />
            ))}
          </div>
        </div>

        {/* Property info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Property</h3>
          <p className="font-medium">{booking.property?.name}</p>
          <p className="text-sm text-gray-500 mt-1">{booking.property?.address}, {booking.property?.city}</p>
        </div>

        {/* Payment info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Payment</h3>
          <div className="space-y-3">
            <InfoRow icon={CreditCard} label="Method" value={booking.payment?.method || '-'} />
            <InfoRow icon={CreditCard} label="Status" value={booking.payment?.status || '-'} />
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Amount</span>
                <span className="text-xl font-bold text-primary">
                  {booking.currency} {booking.totalAmount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room breakdown */}
      {booking.bookingItems?.length > 0 && (
        <div className="card mt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left pb-2">Room</th>
                <th className="text-center pb-2">Qty</th>
                <th className="text-center pb-2">Nights</th>
                <th className="text-right pb-2">Price/Night</th>
                <th className="text-right pb-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {booking.bookingItems.map((item: any, i: number) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{item.roomType?.name || 'Room'}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-center py-2">{item.nights}</td>
                  <td className="text-right py-2">{booking.currency} {item.pricePerNight?.toLocaleString()}</td>
                  <td className="text-right py-2 font-medium">{booking.currency} {item.subtotal?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td colSpan={4} className="pt-3 text-right font-semibold">Total</td>
                <td className="pt-3 text-right font-bold text-primary text-base">
                  {booking.currency} {booking.totalAmount?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 w-20">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

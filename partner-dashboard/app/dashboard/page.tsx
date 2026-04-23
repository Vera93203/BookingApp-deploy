'use client';
import { useEffect, useState } from 'react';
import { partnerApi } from '../../lib/api';
import { Building2, BedDouble, CalendarCheck, Clock } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  properties: number;
  rooms: number;
  totalBookings: number;
  pendingBookings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ properties: 0, rooms: 0, totalBookings: 0, pendingBookings: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, bookingsRes] = await Promise.all([
        partnerApi.getProperties(),
        partnerApi.getBookings(),
      ]);

      const properties = propsRes.data;
      const bookings = bookingsRes.data;
      const rooms = properties.reduce((acc: number, p: any) => acc + (p.roomTypes?.length || 0), 0);
      const pending = bookings.filter((b: any) => b.status === 'PAID_PENDING_PARTNER_APPROVAL');

      setStats({
        properties: properties.length,
        rooms,
        totalBookings: bookings.length,
        pendingBookings: pending.length,
      });
      setRecentBookings(bookings.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'bg-amber-100 text-amber-700';
      case 'PENDING_PAYMENT': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'Awaiting Approval';
      case 'PENDING_PAYMENT': return 'Pending Payment';
      case 'PAYMENT_FAILED': return 'Payment Failed';
      default: return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Properties" value={stats.properties} color="bg-blue-500" />
        <StatCard icon={BedDouble} label="Room Types" value={stats.rooms} color="bg-emerald-500" />
        <StatCard icon={CalendarCheck} label="Total Bookings" value={stats.totalBookings} color="bg-purple-500" />
        <StatCard icon={Clock} label="Pending Approval" value={stats.pendingBookings} color="bg-amber-500" href="/bookings" />
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link href="/bookings" className="text-primary text-sm hover:underline">View all</Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b">
                  <th className="pb-3 pr-4">Guest</th>
                  <th className="pb-3 pr-4">Property</th>
                  <th className="pb-3 pr-4">Dates</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-sm">{booking.guestName}</div>
                      <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm">{booking.property?.name}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {booking.checkIn?.split('T')[0]} → {booking.checkOut?.split('T')[0]}
                    </td>
                    <td className="py-3 pr-4 text-sm font-medium">
                      {booking.currency} {booking.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${statusColor(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: any; label: string; value: number; color: string; href?: string;
}) {
  const content = (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

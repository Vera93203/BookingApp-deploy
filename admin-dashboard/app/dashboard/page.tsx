'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Users, Building2, CalendarCheck, UserPlus, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>;
  }

  const stats = [
    { icon: Users, label: 'Total Users', value: data?.totalUsers || 0, color: 'bg-blue-500', href: '/users' },
    { icon: UserPlus, label: 'Partners', value: data?.totalPartners || 0, color: 'bg-purple-500', href: '/partners' },
    { icon: Building2, label: 'Properties', value: data?.totalProperties || 0, color: 'bg-emerald-500', href: '/properties' },
    { icon: CalendarCheck, label: 'Bookings', value: data?.totalBookings || 0, color: 'bg-amber-500', href: '/bookings' },
  ];

  const statusColor = (s: string) => {
    switch (s) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'bg-amber-100 text-amber-700';
      case 'PENDING_PAYMENT': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">System overview and management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}>
            <div className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <Link href="/partners" className="card border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-purple-500" />
            <div>
              <h3 className="font-semibold">Pending Partner Approvals</h3>
              <p className="text-sm text-gray-500">Review and approve new partner applications</p>
            </div>
          </div>
        </Link>
        <Link href="/properties" className="card border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-emerald-500" />
            <div>
              <h3 className="font-semibold">Pending Property Approvals</h3>
              <p className="text-sm text-gray-500">Review and approve new property listings</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link href="/bookings" className="text-accent text-sm hover:underline">View all</Link>
        </div>

        {!data?.recentBookings?.length ? (
          <p className="text-gray-400 text-center py-8">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-header pb-3 pr-4">User</th>
                  <th className="table-header pb-3 pr-4">Property</th>
                  <th className="table-header pb-3 pr-4">Amount</th>
                  <th className="table-header pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.map((b: any) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="text-sm font-medium">{b.guestName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{b.user?.phone || b.user?.email || ''}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm">{b.property?.name || 'N/A'}</td>
                    <td className="py-3 pr-4 text-sm font-medium">
                      {b.currency || 'MMK'} {b.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${statusColor(b.status)}`}>
                        {b.status?.replace(/_/g, ' ')}
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

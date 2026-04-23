'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Users as UsersIcon, Phone, Mail, ChevronLeft, ChevronRight, Shield, User } from 'lucide-react';

export default function UsersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(page, 20);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'PARTNER': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading && !data) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>;
  }

  const users = data?.users || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} registered users</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="table-header px-6 py-3">User</th>
                <th className="table-header px-6 py-3">Contact</th>
                <th className="table-header px-6 py-3">Role</th>
                <th className="table-header px-6 py-3">Status</th>
                <th className="table-header px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {user.role === 'ADMIN' ? (
                          <Shield size={16} className="text-red-500" />
                        ) : (
                          <User size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {user.profile?.fullName || user.profile?.username || 'No name'}
                        </div>
                        {user.profile?.username && (
                          <div className="text-xs text-gray-400">@{user.profile.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={12} /> {user.phone}
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Mail size={12} /> {user.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${roleBadge(user.role)}`}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {data.page} of {data.totalPages} ({data.total} users)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-outline py-1.5 px-3 text-sm flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="btn-outline py-1.5 px-3 text-sm flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, User, Phone, Mail, Building2, FileText, UserPlus } from 'lucide-react';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadPartners(); }, []);

  const loadPartners = async () => {
    try {
      const res = await adminApi.getPendingPartners();
      setPartners(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.approvePartner(id);
      toast.success('Partner approved!');
      loadPartners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const reject = async (id: string) => {
    if (!confirm('Reject this partner application?')) return;
    setActionLoading(id);
    try {
      await adminApi.rejectPartner(id);
      toast.success('Partner rejected');
      loadPartners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Partner Approvals</h1>
      <p className="text-gray-500 text-sm mb-6">Review and manage partner applications</p>

      {partners.length === 0 ? (
        <div className="card text-center py-16">
          <UserPlus size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No pending applications</h3>
          <p className="text-gray-400 text-sm mt-1">All partner applications have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {partners.map((partner: any) => (
            <div key={partner.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Building2 size={22} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{partner.businessName}</h3>
                      <span className="badge bg-amber-100 text-amber-700">Pending Approval</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {partner.businessEmail}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {partner.businessPhone}
                    </div>
                    {partner.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 size={14} className="text-gray-400" />
                        {partner.address}
                      </div>
                    )}
                    {partner.licenseNumber && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText size={14} className="text-gray-400" />
                        License: {partner.licenseNumber}
                      </div>
                    )}
                    {partner.user && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={14} className="text-gray-400" />
                        {partner.user.profile?.fullName || partner.user.phone || partner.user.email}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    Applied: {new Date(partner.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex gap-2 ml-4">
                  <button onClick={() => approve(partner.id)}
                    disabled={actionLoading === partner.id}
                    className="btn-success flex items-center gap-1.5 text-sm">
                    <Check size={16} /> Approve
                  </button>
                  <button onClick={() => reject(partner.id)}
                    disabled={actionLoading === partner.id}
                    className="btn-danger flex items-center gap-1.5 text-sm">
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, MapPin, Star, Building2 } from 'lucide-react';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      const res = await adminApi.getPendingProperties();
      setProperties(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.approveProperty(id);
      toast.success('Property approved! Now visible to users.');
      loadProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const reject = async (id: string) => {
    if (!confirm('Reject this property?')) return;
    setActionLoading(id);
    try {
      await adminApi.rejectProperty(id);
      toast.success('Property rejected');
      loadProperties();
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Approvals</h1>
      <p className="text-gray-500 text-sm mb-6">Review and approve property listings</p>

      {properties.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No pending properties</h3>
          <p className="text-gray-400 text-sm mt-1">All property submissions have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop: any) => (
            <div key={prop.id} className="card">
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {prop.images?.[0] ? (
                    <img src={prop.images[0]} alt={prop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{prop.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                        <MapPin size={14} />
                        <span>{prop.address}, {prop.city}, {prop.country}</span>
                      </div>
                      {prop.starRating && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: prop.starRating }).map((_, i) => (
                            <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      {prop.partner && (
                        <p className="text-sm text-gray-500 mt-2">
                          Partner: <span className="font-medium">{prop.partner.businessName}</span>
                        </p>
                      )}
                      {prop.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{prop.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button onClick={() => approve(prop.id)}
                        disabled={actionLoading === prop.id}
                        className="btn-success flex items-center gap-1.5 text-sm">
                        <Check size={16} /> Approve
                      </button>
                      <button onClick={() => reject(prop.id)}
                        disabled={actionLoading === prop.id}
                        className="btn-danger flex items-center gap-1.5 text-sm">
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>

                  {/* Amenities */}
                  {prop.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {prop.amenities.slice(0, 6).map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {prop.amenities.length > 6 && (
                        <span className="text-xs text-gray-400">+{prop.amenities.length - 6} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

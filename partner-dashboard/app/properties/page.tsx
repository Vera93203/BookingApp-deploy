'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { normalizeServerUrl, partnerApi } from '@/lib/api';
import { Plus, MapPin, Star, Edit } from 'lucide-react';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const res = await partnerApi.getProperties();
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <Link href="/properties/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="card text-center py-16">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No properties yet</h3>
          <p className="text-gray-500 mb-6">Add your first property to start receiving bookings.</p>
          <Link href="/properties/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Add Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property: any) => (
            <div key={property.id} className="card overflow-hidden p-0">
              {/* Image */}
              <div className="h-40 bg-gray-200 relative">
                {property.images?.[0] ? (
                  <img
                    src={normalizeServerUrl(property.images[0])}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <MapPin size={32} className="text-gray-400" />
                  </div>
                )}
                <span className={`badge ${statusBadge(property.status)} absolute top-3 right-3`}>
                  {property.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <MapPin size={14} />
                  <span>{property.city}, {property.country}</span>
                </div>
                {property.starRating && (
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: property.starRating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {property.roomTypes?.length || 0} room type{(property.roomTypes?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <Link
                    href={`/properties/${property.id}/edit`}
                    className="btn-outline text-sm py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    <Edit size={14} /> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

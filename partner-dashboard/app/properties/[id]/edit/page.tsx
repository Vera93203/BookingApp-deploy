'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeServerUrl, partnerApi, uploadPartnerPropertyImages } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, ImagePlus, X, Loader2 } from 'lucide-react';

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    propertyType: 'HOTEL' as 'HOTEL' | 'ROOM' | 'APARTMENT' | 'HOSTEL' | 'MOTEL' | 'BUNGALOW',
    address: '',
    city: '',
    state: '',
    country: 'Myanmar',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    amenities: [] as string[],
    images: [] as string[],
  });

  const generalAmenityOptions = [
    'wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'parking',
    'room_service', 'airport_shuttle', 'laundry', 'garden', 'terrace',
  ];
  const roomApartmentAmenityOptions = ['furnished', 'bill_included', 'unfurnished'];

  const isRoomOrApartment = form.propertyType === 'ROOM' || form.propertyType === 'APARTMENT';
  const amenityOptions = isRoomOrApartment ? roomApartmentAmenityOptions : generalAmenityOptions;

  const setPropertyType = (propertyType: typeof form.propertyType) => {
    setForm((prev) => {
      const nextIsRoomOrApartment = propertyType === 'ROOM' || propertyType === 'APARTMENT';
      const nextAllowed = new Set(
        nextIsRoomOrApartment ? roomApartmentAmenityOptions : generalAmenityOptions,
      );
      return {
        ...prev,
        propertyType,
        amenities: prev.amenities.filter((a) => nextAllowed.has(a)),
      };
    });
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await partnerApi.getProperty(id);
        const p = res.data;
        setForm({
          name: p.name || '',
          propertyType: (p.propertyType || 'HOTEL') as any,
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          country: p.country || 'Myanmar',
          checkInTime: p.checkInTime || '14:00',
          checkOutTime: p.checkOutTime || '11:00',
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          images: Array.isArray(p.images) ? [...p.images] : [],
        });
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load property');
        router.push('/properties');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const toggleAmenity = (a: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((u) => u !== url),
    }));
  };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = '';
    setUploading(true);
    try {
      const res = await uploadPartnerPropertyImages(id, files);
      const updated = res.data?.property;
      if (updated?.images) {
        setForm((prev) => ({ ...prev, images: [...updated.images] }));
      }
      toast.success('Images uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city) {
      return toast.error('Please fill required fields');
    }
    setSaving(true);
    try {
      await partnerApi.updateProperty(id, {
        name: form.name,
        propertyType: form.propertyType,
        address: form.address,
        city: form.city,
        state: form.state || undefined,
        country: form.country,
        amenities: form.amenities,
        images: form.images,
        ...(isRoomOrApartment
          ? {}
          : { checkInTime: form.checkInTime, checkOutTime: form.checkOutTime }),
      });
      toast.success('Property updated');
      router.push('/properties');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/properties"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> Back to properties
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit property</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Photos</h2>
          <p className="text-sm text-gray-500">
            Upload JPG, PNG, or WebP (max 10 per request, up to 20 total on the property).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={onPickFiles}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn-outline flex items-center gap-2 w-full justify-center"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus size={18} />
            )}
            {uploading ? 'Uploading…' : 'Add images'}
          </button>

          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {form.images.map((url) => (
                <div key={url} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[4/3]">
                  <img src={normalizeServerUrl(url)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-90 hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Basic information</h2>

          <div>
            <label className="label">Property name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Property type *</label>
            <select
              className="input"
              value={form.propertyType}
              onChange={(e) => setPropertyType(e.target.value as any)}
            >
              <option value="HOTEL">Hotel</option>
              <option value="ROOM">House</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOSTEL">Hostel</option>
              <option value="MOTEL">Motel</option>
              <option value="BUNGALOW">Bungalow</option>
            </select>
          </div>

          <div>
            <label className="label">Country</label>
            <input
              className="input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Location</h2>
          <div>
            <label className="label">Address *</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City *</label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State / region</label>
              <input
                className="input"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
        </div>

        {!isRoomOrApartment && (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Check-in & check-out</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Check-in</label>
                <input
                  type="time"
                  className="input"
                  value={form.checkInTime}
                  onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Check-out</label>
                <input
                  type="time"
                  className="input"
                  value={form.checkOutTime}
                  onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.amenities.includes(a)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                }`}
              >
                {a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/properties')} className="btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { partnerApi } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    propertyType: 'HOTEL' as 'HOTEL' | 'ROOM' | 'APARTMENT' | 'HOSTEL' | 'MOTEL' | 'BUNGALOW',
    address: '', city: '', state: '',
    country: 'Myanmar', checkInTime: '14:00', checkOutTime: '11:00',
    amenities: [] as string[],
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

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city) {
      return toast.error('Please fill required fields');
    }
    setLoading(true);
    try {
      await partnerApi.createProperty({
        name: form.name,
        propertyType: form.propertyType,
        address: form.address,
        city: form.city,
        state: form.state || undefined,
        country: form.country,
        amenities: form.amenities,
        ...(isRoomOrApartment
          ? {}
          : { checkInTime: form.checkInTime, checkOutTime: form.checkOutTime }),
      });
      toast.success('Property submitted for approval!');
      router.push('/properties');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Property</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label className="label">Property Name *</label>
            <input className="input" placeholder="e.g. Golden Palace Hotel"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="label">Property Type *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Country</label>
              <input className="input" value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Location</h2>
          <div>
            <label className="label">Address *</label>
            <input className="input" placeholder="Street address"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City *</label>
              <input className="input" placeholder="e.g. Yangon"
                value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="label">State / Region</label>
              <input className="input" placeholder="e.g. Yangon Region"
                value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>
        </div>

        {!isRoomOrApartment && (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Check-in & Check-out</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Check-in Time</label>
                <input type="time" className="input" value={form.checkInTime}
                  onChange={e => setForm({ ...form, checkInTime: e.target.value })} />
              </div>
              <div>
                <label className="label">Check-out Time</label>
                <input type="time" className="input" value={form.checkOutTime}
                  onChange={e => setForm({ ...form, checkOutTime: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.amenities.includes(a)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                }`}>
                {a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}

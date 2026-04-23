'use client';
import { useEffect, useState } from 'react';
import { partnerApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, Bed } from 'lucide-react';

export default function RoomsPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: '', description: '', maxGuests: 2, bedType: 'Queen',
    roomSize: 30, basePrice: 80000, currency: 'MMK', totalRooms: 5,
    amenities: [] as string[],
  });

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      const res = await partnerApi.getProperties();
      setProperties(res.data);
      if (res.data.length > 0) setSelectedProperty(res.data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const selectedProp = properties.find(p => p.id === selectedProperty);
  const rooms = selectedProp?.roomTypes || [];

  const roomAmenities = ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'bathrobe', 'balcony', 'jacuzzi', 'kitchen'];

  const toggleAmenity = (a: string) => {
    setRoomForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a],
    }));
  };

  const createRoom = async () => {
    if (!roomForm.name || !selectedProperty) return toast.error('Fill required fields');
    setFormLoading(true);
    try {
      await partnerApi.createRoom(selectedProperty, {
        ...roomForm,
        maxGuests: Number(roomForm.maxGuests),
        roomSize: Number(roomForm.roomSize),
        basePrice: Number(roomForm.basePrice),
        totalRooms: Number(roomForm.totalRooms),
      });
      toast.success('Room type added!');
      setShowForm(false);
      setRoomForm({ name: '', description: '', maxGuests: 2, bedType: 'Queen', roomSize: 30, basePrice: 80000, currency: 'MMK', totalRooms: 5, amenities: [] });
      loadProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add room');
    } finally { setFormLoading(false); }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room type?')) return;
    try {
      await partnerApi.deleteRoom(roomId);
      toast.success('Room deleted');
      loadProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
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
        <h1 className="text-2xl font-bold text-gray-900">Room Types</h1>
        {selectedProperty && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Room Type
          </button>
        )}
      </div>

      {/* Property selector */}
      {properties.length > 0 && (
        <div className="mb-6">
          <label className="label">Select Property</label>
          <select className="input max-w-md" value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value)}>
            {properties.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add room form */}
      {showForm && (
        <div className="card mb-6 max-w-2xl space-y-4">
          <h3 className="text-lg font-semibold">New Room Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Room Name *</label>
              <input className="input" placeholder="e.g. Deluxe Double Room"
                value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" placeholder="Room description..."
                value={roomForm.description} onChange={e => setRoomForm({ ...roomForm, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Max Guests</label>
              <input type="number" className="input" min={1} value={roomForm.maxGuests}
                onChange={e => setRoomForm({ ...roomForm, maxGuests: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Bed Type</label>
              <select className="input" value={roomForm.bedType}
                onChange={e => setRoomForm({ ...roomForm, bedType: e.target.value })}>
                {['Single', 'Twin', 'Double', 'Queen', 'King'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Room Size (m²)</label>
              <input type="number" className="input" min={1} value={roomForm.roomSize}
                onChange={e => setRoomForm({ ...roomForm, roomSize: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Total Rooms</label>
              <input type="number" className="input" min={1} value={roomForm.totalRooms}
                onChange={e => setRoomForm({ ...roomForm, totalRooms: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Price Per Night</label>
              <input type="number" className="input" min={0} value={roomForm.basePrice}
                onChange={e => setRoomForm({ ...roomForm, basePrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={roomForm.currency}
                onChange={e => setRoomForm({ ...roomForm, currency: e.target.value })}>
                <option value="MMK">MMK</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {roomAmenities.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    roomForm.amenities.includes(a) ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            <button onClick={createRoom} disabled={formLoading} className="btn-primary">
              {formLoading ? 'Adding...' : 'Add Room Type'}
            </button>
          </div>
        </div>
      )}

      {/* Room list */}
      {rooms.length === 0 ? (
        <div className="card text-center py-12">
          <Bed size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No room types for this property yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room: any) => (
            <div key={room.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{room.name}</h3>
                <button onClick={() => deleteRoom(room.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
              {room.description && <p className="text-sm text-gray-500 mb-3">{room.description}</p>}
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Users size={14} /> {room.maxGuests} guests</div>
                {room.bedType && <div className="flex items-center gap-2"><Bed size={14} /> {room.bedType}</div>}
                <div>Rooms: {room.totalRooms}</div>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {room.currency} {room.basePrice?.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400">per night</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

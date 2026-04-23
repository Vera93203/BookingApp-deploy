import { PrismaClient, UserRole, PartnerStatus, PropertyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myanmartravel.com' },
    update: {},
    create: {
      email: 'admin@myanmartravel.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          username: 'admin',
          fullName: 'System Admin',
          isComplete: true,
        },
      },
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Create sample partner user
  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@goldenpalace.com' },
    update: {},
    create: {
      email: 'partner@goldenpalace.com',
      phone: '+959111222333',
      role: UserRole.PARTNER,
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          username: 'golden_palace',
          fullName: 'U Kyaw Kyaw',
          isComplete: true,
        },
      },
    },
  });

  // Create partner profile
  const partner = await prisma.partner.upsert({
    where: { userId: partnerUser.id },
    update: {},
    create: {
      userId: partnerUser.id,
      businessName: 'Golden Palace Hotels',
      businessEmail: 'partner@goldenpalace.com',
      businessPhone: '+959111222333',
      address: 'No. 45, Strand Road, Yangon',
      licenseNumber: 'MHL-2024-001',
      status: PartnerStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  // Create sample properties
  const property1 = await prisma.property.upsert({
    where: { id: 'prop-yangon-001' },
    update: {},
    create: {
      id: 'prop-yangon-001',
      partnerId: partner.id,
      name: 'Golden Palace Hotel Yangon',
      description: 'A luxurious 5-star hotel in the heart of Yangon, offering world-class amenities and stunning views of the Shwedagon Pagoda. Experience Myanmar hospitality at its finest.',
      address: 'No. 45, Strand Road, Kyauktada Township',
      city: 'Yangon',
      state: 'Yangon Region',
      country: 'Myanmar',
      latitude: 16.8661,
      longitude: 96.1951,
      starRating: 5,
      amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'room_service', 'airport_shuttle', 'parking', 'laundry'],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      status: PropertyStatus.APPROVED,
    },
  });

  const property2 = await prisma.property.upsert({
    where: { id: 'prop-mandalay-001' },
    update: {},
    create: {
      id: 'prop-mandalay-001',
      partnerId: partner.id,
      name: 'Royal Mandalay Resort',
      description: 'A beautiful resort near Mandalay Hill with traditional Myanmar architecture and modern comforts. Perfect for cultural exploration.',
      address: 'No. 12, 66th Street, Chan Aye Thar Zan Township',
      city: 'Mandalay',
      state: 'Mandalay Region',
      country: 'Myanmar',
      latitude: 21.9588,
      longitude: 96.0891,
      starRating: 4,
      amenities: ['wifi', 'pool', 'restaurant', 'parking', 'garden', 'bicycle_rental'],
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      ],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      status: PropertyStatus.APPROVED,
    },
  });

  const property3 = await prisma.property.upsert({
    where: { id: 'prop-bagan-001' },
    update: {},
    create: {
      id: 'prop-bagan-001',
      partnerId: partner.id,
      name: 'Bagan Temple View Hotel',
      description: 'Wake up to breathtaking views of ancient temples. Our boutique hotel offers an unforgettable Bagan experience with sunrise balloon views.',
      address: 'Thiripyitsaya Quarter, Old Bagan',
      city: 'Bagan',
      state: 'Mandalay Region',
      country: 'Myanmar',
      latitude: 21.1717,
      longitude: 94.8585,
      starRating: 4,
      amenities: ['wifi', 'restaurant', 'terrace', 'bicycle_rental', 'tour_desk', 'garden'],
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      status: PropertyStatus.APPROVED,
    },
  });

  // Create room types
  const rooms = [
    {
      propertyId: property1.id,
      name: 'Deluxe Double Room',
      description: 'Spacious room with city view, king bed, and luxury bathroom',
      maxGuests: 2, bedType: 'King', roomSize: 35,
      basePrice: 120000, currency: 'MMK',
      amenities: ['wifi', 'minibar', 'aircon', 'tv', 'safe', 'bathrobe'],
      totalRooms: 10,
    },
    {
      propertyId: property1.id,
      name: 'Premium Suite',
      description: 'Luxurious suite with Shwedagon Pagoda view, separate living area',
      maxGuests: 3, bedType: 'King', roomSize: 65,
      basePrice: 250000, currency: 'MMK',
      amenities: ['wifi', 'minibar', 'aircon', 'tv', 'safe', 'bathrobe', 'jacuzzi', 'balcony'],
      totalRooms: 4,
    },
    {
      propertyId: property1.id,
      name: 'Standard Twin Room',
      description: 'Comfortable room with twin beds, ideal for friends or colleagues',
      maxGuests: 2, bedType: 'Twin', roomSize: 28,
      basePrice: 85000, currency: 'MMK',
      amenities: ['wifi', 'aircon', 'tv', 'safe'],
      totalRooms: 15,
    },
    {
      propertyId: property2.id,
      name: 'Garden View Room',
      description: 'Peaceful room overlooking the resort gardens',
      maxGuests: 2, bedType: 'Queen', roomSize: 30,
      basePrice: 75000, currency: 'MMK',
      amenities: ['wifi', 'aircon', 'tv', 'minibar'],
      totalRooms: 12,
    },
    {
      propertyId: property2.id,
      name: 'Pool Villa',
      description: 'Private villa with direct pool access',
      maxGuests: 4, bedType: 'King', roomSize: 80,
      basePrice: 180000, currency: 'MMK',
      amenities: ['wifi', 'aircon', 'tv', 'minibar', 'private_pool', 'kitchen'],
      totalRooms: 3,
    },
    {
      propertyId: property3.id,
      name: 'Temple View Room',
      description: 'Room with panoramic views of Bagan temples',
      maxGuests: 2, bedType: 'Queen', roomSize: 25,
      basePrice: 95000, currency: 'MMK',
      amenities: ['wifi', 'aircon', 'terrace', 'tv'],
      totalRooms: 8,
    },
    {
      propertyId: property3.id,
      name: 'Sunrise Suite',
      description: 'Premium suite with private terrace for sunrise viewing',
      maxGuests: 2, bedType: 'King', roomSize: 45,
      basePrice: 160000, currency: 'MMK',
      amenities: ['wifi', 'aircon', 'terrace', 'tv', 'minibar', 'bathrobe'],
      totalRooms: 2,
    },
  ];

  for (const room of rooms) {
    await prisma.roomType.create({ data: room });
  }
  console.log(`✅ Created ${rooms.length} room types`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

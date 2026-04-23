import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/models/property_model.dart';
import '../providers/properties_provider.dart';

class PropertyDetailScreen extends ConsumerStatefulWidget {
  final String propertyId;
  const PropertyDetailScreen({super.key, required this.propertyId});

  @override
  ConsumerState<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends ConsumerState<PropertyDetailScreen> {
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final propertyAsync = ref.watch(propertyDetailProvider(widget.propertyId));

    return Scaffold(
      body: propertyAsync.when(
        data: (property) => _buildContent(context, property),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Error: $e', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () => context.pop(), child: const Text('Go Back')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, PropertyModel property) {
    return CustomScrollView(
      slivers: [
        // Image gallery
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          backgroundColor: AppColors.primary,
          leading: _circleButton(Icons.arrow_back_ios_new, () => context.pop()),
          actions: [
            _circleButton(Icons.share, () {}),
            const SizedBox(width: 8),
            _circleButton(Icons.favorite_border, () {}),
            const SizedBox(width: 12),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              children: [
                PageView.builder(
                  controller: _pageController,
                  itemCount: property.images.isEmpty ? 1 : property.images.length,
                  onPageChanged: (i) => setState(() => _currentImageIndex = i),
                  itemBuilder: (context, index) {
                    final imageUrl = property.images.isNotEmpty
                        ? property.images[index]
                        : property.mainImage;
                    return CachedNetworkImage(
                      imageUrl: AppConstants.normalizeServerUrl(imageUrl),
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                      errorWidget: (_, __, ___) => Container(
                        color: AppColors.shimmerBase,
                        child: const Icon(Icons.hotel, size: 60, color: Colors.grey),
                      ),
                    );
                  },
                ),
                // Image indicator
                if (property.images.length > 1)
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        property.images.length,
                        (i) => Container(
                          width: i == _currentImageIndex ? 24 : 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color: i == _currentImageIndex
                                ? Colors.white
                                : Colors.white.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ),
                // Image counter badge
                Positioned(
                  bottom: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_currentImageIndex + 1}/${property.images.isEmpty ? 1 : property.images.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Property info
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name + stars
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        property.name,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (property.starRating != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.star, size: 14, color: Colors.white),
                            const SizedBox(width: 2),
                            Text(
                              '${property.starRating}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),

                // Location
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 16, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${property.address}, ${property.city}',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Description
                if (property.description != null) ...[
                  Text(
                    property.description!,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
                  ),
                  const SizedBox(height: 20),
                ],

                // Check-in/out times
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            const Icon(Icons.login, color: AppColors.primary, size: 20),
                            const SizedBox(height: 4),
                            const Text('Check-in', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            Text(property.checkInTime, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 40, color: AppColors.divider),
                      Expanded(
                        child: Column(
                          children: [
                            const Icon(Icons.logout, color: AppColors.primary, size: 20),
                            const SizedBox(height: 4),
                            const Text('Check-out', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            Text(property.checkOutTime, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Amenities
                if (property.amenities.isNotEmpty) ...[
                  const Text('Amenities', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: property.amenities.map((amenity) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.divider),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(_getAmenityIcon(amenity), size: 16, color: AppColors.primary),
                            const SizedBox(width: 6),
                            Text(
                              _formatAmenity(amenity),
                              style: const TextStyle(fontSize: 13),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                ],

                // Room types
                const Text('Available Rooms', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),

        // Room type cards
        if (property.roomTypes != null)
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final room = property.roomTypes![index];
                return _RoomTypeCard(
                  room: room,
                  property: property,
                  onBook: () {
                    context.push('/booking/create', extra: {
                      'property': property,
                      'room': room,
                    });
                  },
                );
              },
              childCount: property.roomTypes!.length,
            ),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(top: 8),
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.3),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }

  IconData _getAmenityIcon(String amenity) {
    switch (amenity.toLowerCase()) {
      case 'wifi': return Icons.wifi;
      case 'pool': return Icons.pool;
      case 'spa': return Icons.spa;
      case 'gym': return Icons.fitness_center;
      case 'restaurant': return Icons.restaurant;
      case 'bar': return Icons.local_bar;
      case 'parking': return Icons.local_parking;
      case 'room_service': return Icons.room_service;
      case 'aircon': return Icons.ac_unit;
      case 'tv': return Icons.tv;
      case 'minibar': return Icons.kitchen;
      case 'laundry': return Icons.local_laundry_service;
      case 'airport_shuttle': return Icons.airport_shuttle;
      case 'garden': return Icons.yard;
      case 'terrace': return Icons.deck;
      case 'balcony': return Icons.balcony;
      case 'bicycle_rental': return Icons.pedal_bike;
      case 'tour_desk': return Icons.tour;
      default: return Icons.check_circle_outline;
    }
  }

  String _formatAmenity(String amenity) {
    return amenity.replaceAll('_', ' ').split(' ').map((w) =>
      w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : w
    ).join(' ');
  }
}

class _RoomTypeCard extends StatelessWidget {
  final RoomTypeModel room;
  final PropertyModel property;
  final VoidCallback onBook;

  const _RoomTypeCard({required this.room, required this.property, required this.onBook});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Room image
          if (room.images.isNotEmpty)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: CachedNetworkImage(
                imageUrl: AppConstants.normalizeServerUrl(room.images.first),
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Room name
                Text(room.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),

                // Details row
                if (room.description != null)
                  Text(
                    room.description!,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 10),

                // Info chips
                Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  children: [
                    _infoChip(Icons.person, '${room.maxGuests} guests'),
                    if (room.bedType != null) _infoChip(Icons.bed, room.bedType!),
                    if (room.roomSize != null) _infoChip(Icons.square_foot, '${room.roomSize} m²'),
                  ],
                ),
                const SizedBox(height: 12),

                // Room amenities
                if (room.amenities.isNotEmpty)
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: room.amenities.take(4).map((a) => Text(
                      '• ${a.replaceAll('_', ' ')}',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    )).toList(),
                  ),

                const Divider(height: 24),

                // Price + Book button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          room.formattedPrice,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                        Text('per night', style: TextStyle(fontSize: 12, color: AppColors.textHint)),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: onBook,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                      ),
                      child: const Text('Book Now'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
      ],
    );
  }
}

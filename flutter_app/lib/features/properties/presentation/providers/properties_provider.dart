import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/property_model.dart';
import '../../data/repositories/properties_repository.dart';

// Search state
class PropertySearchState {
  final String? city;
  final String? query;
  final String? checkIn;
  final String? checkOut;
  final int? guests;
  final int page;

  const PropertySearchState({
    this.city,
    this.query,
    this.checkIn,
    this.checkOut,
    this.guests,
    this.page = 1,
  });

  PropertySearchState copyWith({
    String? city,
    String? query,
    String? checkIn,
    String? checkOut,
    int? guests,
    int? page,
  }) {
    return PropertySearchState(
      city: city ?? this.city,
      query: query ?? this.query,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      guests: guests ?? this.guests,
      page: page ?? this.page,
    );
  }
}

final searchStateProvider = StateProvider<PropertySearchState>((ref) {
  return const PropertySearchState();
});

// Properties list provider
final propertiesListProvider =
    FutureProvider.autoDispose<PropertySearchResult>((ref) async {
  final searchState = ref.watch(searchStateProvider);
  final repo = ref.read(propertiesRepositoryProvider);

  return repo.searchProperties(
    city: searchState.city,
    query: searchState.query,
    checkIn: searchState.checkIn,
    checkOut: searchState.checkOut,
    guests: searchState.guests,
    page: searchState.page,
  );
});

// Single property detail provider
final propertyDetailProvider =
    FutureProvider.autoDispose.family<PropertyModel, String>((ref, id) async {
  final repo = ref.read(propertiesRepositoryProvider);
  return repo.getPropertyById(id);
});

// Popular cities
final popularCitiesProvider = Provider<List<Map<String, String>>>((ref) {
  // Same photo IDs as backend/prisma/seed.ts (avoids dead Unsplash hotlinks)
  return [
    {'name': 'Yangon', 'image': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'},
    {'name': 'Mandalay', 'image': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400'},
    {'name': 'Bagan', 'image': 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400'},
    {'name': 'Inle Lake', 'image': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'},
    {'name': 'Ngapali', 'image': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400'},
    {'name': 'Kalaw', 'image': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'},
  ];
});

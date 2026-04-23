class PropertyModel {
  final String id;
  final String name;
  final String? description;
  final String address;
  final String city;
  final String? state;
  final String country;
  final double? latitude;
  final double? longitude;
  final int? starRating;
  final List<String> amenities;
  final List<String> images;
  final String checkInTime;
  final String checkOutTime;
  final double? startingPrice;
  final String? currency;
  final List<RoomTypeModel>? roomTypes;
  final String? partnerName;

  PropertyModel({
    required this.id,
    required this.name,
    this.description,
    required this.address,
    required this.city,
    this.state,
    required this.country,
    this.latitude,
    this.longitude,
    this.starRating,
    this.amenities = const [],
    this.images = const [],
    this.checkInTime = '14:00',
    this.checkOutTime = '11:00',
    this.startingPrice,
    this.currency,
    this.roomTypes,
    this.partnerName,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    return PropertyModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      state: json['state'],
      country: json['country'] ?? 'Myanmar',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      starRating: json['starRating'] ?? json['star_rating'],
      amenities: List<String>.from(json['amenities'] ?? []),
      images: List<String>.from(json['images'] ?? []),
      checkInTime: json['checkInTime'] ?? json['check_in_time'] ?? '14:00',
      checkOutTime: json['checkOutTime'] ?? json['check_out_time'] ?? '11:00',
      startingPrice: (json['startingPrice'] as num?)?.toDouble(),
      currency: json['currency'],
      roomTypes: (json['roomTypes'] as List?)
          ?.map((r) => RoomTypeModel.fromJson(r))
          .toList(),
      partnerName: json['partner']?['businessName'],
    );
  }

  String get mainImage => images.isNotEmpty
      ? images.first
      : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

  String get formattedPrice {
    if (startingPrice == null) return 'Price on request';
    final price = startingPrice!.toStringAsFixed(0);
    final formatted = price.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
    return '${currency ?? "MMK"} $formatted';
  }
}

class RoomTypeModel {
  final String id;
  final String propertyId;
  final String name;
  final String? description;
  final int maxGuests;
  final String? bedType;
  final double? roomSize;
  final double basePrice;
  final String currency;
  final List<String> amenities;
  final List<String> images;
  final int totalRooms;

  RoomTypeModel({
    required this.id,
    required this.propertyId,
    required this.name,
    this.description,
    required this.maxGuests,
    this.bedType,
    this.roomSize,
    required this.basePrice,
    this.currency = 'MMK',
    this.amenities = const [],
    this.images = const [],
    this.totalRooms = 1,
  });

  factory RoomTypeModel.fromJson(Map<String, dynamic> json) {
    return RoomTypeModel(
      id: json['id'] ?? '',
      propertyId: json['propertyId'] ?? json['property_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      maxGuests: json['maxGuests'] ?? json['max_guests'] ?? 2,
      bedType: json['bedType'] ?? json['bed_type'],
      roomSize: (json['roomSize'] ?? json['room_size'] as num?)?.toDouble(),
      basePrice: (json['basePrice'] ?? json['base_price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'MMK',
      amenities: List<String>.from(json['amenities'] ?? []),
      images: List<String>.from(json['images'] ?? []),
      totalRooms: json['totalRooms'] ?? json['total_rooms'] ?? 1,
    );
  }

  String get formattedPrice {
    final price = basePrice.toStringAsFixed(0);
    final formatted = price.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
    return '$currency $formatted';
  }
}

class PropertySearchResult {
  final List<PropertyModel> properties;
  final int total;
  final int page;
  final int totalPages;

  PropertySearchResult({
    required this.properties,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  factory PropertySearchResult.fromJson(Map<String, dynamic> json) {
    return PropertySearchResult(
      properties: (json['properties'] as List?)
          ?.map((p) => PropertyModel.fromJson(p))
          .toList() ?? [],
      total: json['total'] ?? 0,
      page: json['page'] ?? 1,
      totalPages: json['totalPages'] ?? 1,
    );
  }
}

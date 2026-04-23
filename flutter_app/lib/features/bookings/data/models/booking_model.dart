import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/dio_client.dart';
import '../../../../core/errors/api_exception.dart';

class BookingModel {
  final String id;
  final String propertyId;
  final String checkIn;
  final String checkOut;
  final String guestName;
  final String? guestEmail;
  final String guestPhone;
  final int numberOfGuests;
  final String? specialRequests;
  final double totalAmount;
  final String currency;
  final String status;
  final String? propertyName;
  final String? propertyCity;
  final List<String>? propertyImages;
  final List<BookingItemModel>? items;
  final PaymentInfo? payment;
  final String createdAt;

  BookingModel({
    required this.id,
    required this.propertyId,
    required this.checkIn,
    required this.checkOut,
    required this.guestName,
    this.guestEmail,
    required this.guestPhone,
    required this.numberOfGuests,
    this.specialRequests,
    required this.totalAmount,
    this.currency = 'MMK',
    required this.status,
    this.propertyName,
    this.propertyCity,
    this.propertyImages,
    this.items,
    this.payment,
    required this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] ?? '',
      propertyId: json['propertyId'] ?? json['property_id'] ?? '',
      checkIn: json['checkIn'] ?? json['check_in'] ?? '',
      checkOut: json['checkOut'] ?? json['check_out'] ?? '',
      guestName: json['guestName'] ?? json['guest_name'] ?? '',
      guestEmail: json['guestEmail'] ?? json['guest_email'],
      guestPhone: json['guestPhone'] ?? json['guest_phone'] ?? '',
      numberOfGuests: json['numberOfGuests'] ?? json['number_of_guests'] ?? 1,
      specialRequests: json['specialRequests'] ?? json['special_requests'],
      totalAmount: (json['totalAmount'] ?? json['total_amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'MMK',
      status: json['status'] ?? 'PENDING_PAYMENT',
      propertyName: json['property']?['name'],
      propertyCity: json['property']?['city'],
      propertyImages: json['property']?['images'] != null
          ? List<String>.from(json['property']['images'])
          : null,
      items: (json['bookingItems'] as List?)
          ?.map((i) => BookingItemModel.fromJson(i))
          .toList(),
      payment: json['payment'] != null ? PaymentInfo.fromJson(json['payment']) : null,
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Pending Payment';
      case 'PAYMENT_FAILED': return 'Payment Failed';
      case 'PAID_PENDING_PARTNER_APPROVAL': return 'Awaiting Approval';
      case 'CONFIRMED': return 'Confirmed';
      case 'REJECTED': return 'Rejected';
      case 'CANCELLED': return 'Cancelled';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  }

  String get formattedAmount {
    final price = totalAmount.toStringAsFixed(0);
    final formatted = price.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return '$currency $formatted';
  }
}

class BookingItemModel {
  final String id;
  final String roomTypeId;
  final int quantity;
  final int nights;
  final double pricePerNight;
  final double subtotal;
  final String? roomName;

  BookingItemModel({
    required this.id,
    required this.roomTypeId,
    required this.quantity,
    required this.nights,
    required this.pricePerNight,
    required this.subtotal,
    this.roomName,
  });

  factory BookingItemModel.fromJson(Map<String, dynamic> json) {
    return BookingItemModel(
      id: json['id'] ?? '',
      roomTypeId: json['roomTypeId'] ?? json['room_type_id'] ?? '',
      quantity: json['quantity'] ?? 1,
      nights: json['nights'] ?? 1,
      pricePerNight: (json['pricePerNight'] ?? json['price_per_night'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      roomName: json['roomType']?['name'],
    );
  }
}

class PaymentInfo {
  final String id;
  final double amount;
  final String method;
  final String status;
  final String? transactionId;

  PaymentInfo({
    required this.id,
    required this.amount,
    required this.method,
    required this.status,
    this.transactionId,
  });

  factory PaymentInfo.fromJson(Map<String, dynamic> json) {
    return PaymentInfo(
      id: json['id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      method: json['method'] ?? 'KBZPAY',
      status: json['status'] ?? 'UNPAID',
      transactionId: json['transactionId'] ?? json['transaction_id'],
    );
  }
}

// Repository
final bookingsRepositoryProvider = Provider<BookingsRepository>((ref) {
  return BookingsRepository(ref.read(dioProvider));
});

class BookingsRepository {
  final Dio _dio;
  BookingsRepository(this._dio);

  Future<BookingModel> createBooking(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/bookings', data: data);
      return BookingModel.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<BookingModel>> getMyBookings() async {
    try {
      final response = await _dio.get('/bookings/my');
      return (response.data as List).map((b) => BookingModel.fromJson(b)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<BookingModel> getBookingById(String id) async {
    try {
      final response = await _dio.get('/bookings/$id');
      return BookingModel.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> cancelBooking(String id) async {
    try {
      await _dio.post('/bookings/$id/cancel');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // Payments
  Future<Map<String, dynamic>> createPayment(String bookingId) async {
    try {
      final response = await _dio.post('/payments/create/$bookingId');
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> getPaymentStatus(String bookingId) async {
    try {
      final response = await _dio.get('/payments/$bookingId/status');
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> simulatePayment(String bookingId) async {
    try {
      await _dio.post('/payments/simulate/$bookingId');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

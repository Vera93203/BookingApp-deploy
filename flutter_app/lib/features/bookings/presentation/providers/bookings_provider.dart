import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/booking_model.dart';

final myBookingsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final repo = ref.read(bookingsRepositoryProvider);
  return repo.getMyBookings();
});

final bookingDetailProvider =
    FutureProvider.autoDispose.family<BookingModel, String>((ref, id) async {
  final repo = ref.read(bookingsRepositoryProvider);
  return repo.getBookingById(id);
});

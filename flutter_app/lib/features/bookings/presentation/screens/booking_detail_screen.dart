import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/booking_model.dart';
import '../providers/bookings_provider.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  Color _statusColor(String status) {
    switch (status) {
      case 'CONFIRMED': return AppColors.success;
      case 'PAID_PENDING_PARTNER_APPROVAL': return AppColors.warning;
      case 'PENDING_PAYMENT': return AppColors.info;
      case 'REJECTED': case 'CANCELLED': case 'PAYMENT_FAILED': return AppColors.error;
      default: return AppColors.textHint;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingDetailProvider(bookingId));

    return Scaffold(
      appBar: AppBar(title: const Text('Booking Details')),
      body: bookingAsync.when(
        data: (booking) => _buildContent(context, ref, booking),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, BookingModel booking) {
    final statusColor = _statusColor(booking.status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Status badge
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Text(
                booking.statusDisplay,
                style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Booking ID
          _infoCard('Booking Information', [
            _infoRow('Booking ID', booking.id.substring(0, 8).toUpperCase()),
            _infoRow('Created', booking.createdAt.split('T').first),
          ]),
          const SizedBox(height: 12),

          // Hotel info
          _infoCard('Hotel', [
            _infoRow('Hotel', booking.propertyName ?? 'N/A'),
            if (booking.propertyCity != null) _infoRow('City', booking.propertyCity!),
          ]),
          const SizedBox(height: 12),

          // Stay details
          _infoCard('Stay Details', [
            _infoRow('Check-in', booking.checkIn.split('T').first),
            _infoRow('Check-out', booking.checkOut.split('T').first),
            _infoRow('Guests', '${booking.numberOfGuests}'),
            if (booking.items != null)
              ...booking.items!.map((item) =>
                _infoRow('Room', '${item.roomName ?? "Room"} × ${item.quantity}'),
              ),
          ]),
          const SizedBox(height: 12),

          // Guest info
          _infoCard('Guest Information', [
            _infoRow('Name', booking.guestName),
            _infoRow('Phone', booking.guestPhone),
            if (booking.guestEmail != null) _infoRow('Email', booking.guestEmail!),
            if (booking.specialRequests != null)
              _infoRow('Requests', booking.specialRequests!),
          ]),
          const SizedBox(height: 12),

          // Payment
          _infoCard('Payment', [
            _infoRow('Amount', booking.formattedAmount),
            _infoRow('Method', booking.payment?.method ?? 'N/A'),
            _infoRow('Status', booking.payment?.status ?? 'N/A'),
          ]),
          const SizedBox(height: 24),

          // Actions based on status
          if (booking.status == 'PENDING_PAYMENT')
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: () => context.push('/payment/${booking.id}'),
                child: const Text('Complete Payment'),
              ),
            ),

          if (booking.status == 'PENDING_PAYMENT' || booking.status == 'PAID_PENDING_PARTNER_APPROVAL')
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: SizedBox(
                height: 50,
                child: OutlinedButton(
                  onPressed: () => _cancelBooking(context, ref, booking.id),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                  child: const Text('Cancel Booking'),
                ),
              ),
            ),

          if (booking.status == 'CONFIRMED')
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Your booking is confirmed! A confirmation email has been sent.',
                      style: TextStyle(color: AppColors.success, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _infoCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.primary)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14))),
        ],
      ),
    );
  }

  void _cancelBooking(BuildContext context, WidgetRef ref, String id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Booking?'),
        content: const Text('This action cannot be undone. If you already paid, a refund will be processed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Keep')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final repo = ref.read(bookingsRepositoryProvider);
                await repo.cancelBooking(id);
                ref.invalidate(bookingDetailProvider(id));
                ref.invalidate(myBookingsProvider);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Booking cancelled'), backgroundColor: AppColors.success),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
                  );
                }
              }
            },
            child: const Text('Cancel Booking', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

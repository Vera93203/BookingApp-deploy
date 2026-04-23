import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../properties/data/models/property_model.dart';
import '../../data/models/booking_model.dart';

class CreateBookingScreen extends ConsumerStatefulWidget {
  final PropertyModel property;
  final RoomTypeModel room;

  const CreateBookingScreen({super.key, required this.property, required this.room});

  @override
  ConsumerState<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _guestNameController = TextEditingController();
  final _guestEmailController = TextEditingController();
  final _guestPhoneController = TextEditingController();
  final _specialRequestsController = TextEditingController();

  DateTime _checkIn = DateTime.now().add(const Duration(days: 1));
  DateTime _checkOut = DateTime.now().add(const Duration(days: 2));
  int _rooms = 1;
  int _guests = 2;
  String _paymentMethod = 'KBZPAY';
  bool _isLoading = false;

  int get _nights => _checkOut.difference(_checkIn).inDays;
  double get _totalPrice => widget.room.basePrice * _nights * _rooms;

  String get _formattedTotal {
    final p = _totalPrice.toStringAsFixed(0);
    final f = p.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return '${widget.room.currency} $f';
  }

  Future<void> _selectDates() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: DateTimeRange(start: _checkIn, end: _checkOut),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (range != null) {
      setState(() {
        _checkIn = range.start;
        _checkOut = range.end;
      });
    }
  }

  Future<void> _createBooking() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final repo = ref.read(bookingsRepositoryProvider);
      final booking = await repo.createBooking({
        'propertyId': widget.property.id,
        'checkIn': _checkIn.toIso8601String().split('T').first,
        'checkOut': _checkOut.toIso8601String().split('T').first,
        'guestName': _guestNameController.text.trim(),
        'guestEmail': _guestEmailController.text.trim().isEmpty
            ? null
            : _guestEmailController.text.trim(),
        'guestPhone': _guestPhoneController.text.trim(),
        'numberOfGuests': _guests,
        'specialRequests': _specialRequestsController.text.trim().isEmpty
            ? null
            : _specialRequestsController.text.trim(),
        'paymentMethod': _paymentMethod,
        'items': [
          {
            'roomTypeId': widget.room.id,
            'quantity': _rooms,
          },
        ],
      });

      if (mounted) {
        context.push('/payment/${booking.id}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _guestNameController.dispose();
    _guestEmailController.dispose();
    _guestPhoneController.dispose();
    _specialRequestsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Now')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hotel + Room summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withOpacity(0.1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.property.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(widget.room.name, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.room.formattedPrice} / night',
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Dates
              const Text('Stay Dates', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _selectDates,
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.divider),
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, color: AppColors.primary, size: 20),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_formatDate(_checkIn)} → ${_formatDate(_checkOut)}',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          Text(
                            '$_nights night${_nights != 1 ? "s" : ""}',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      const Spacer(),
                      const Icon(Icons.edit, size: 16, color: AppColors.textHint),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Rooms & Guests
              Row(
                children: [
                  Expanded(
                    child: _counterField(
                      label: 'Rooms',
                      value: _rooms,
                      onDecrement: _rooms > 1 ? () => setState(() => _rooms--) : null,
                      onIncrement: _rooms < widget.room.totalRooms
                          ? () => setState(() => _rooms++)
                          : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _counterField(
                      label: 'Guests',
                      value: _guests,
                      onDecrement: _guests > 1 ? () => setState(() => _guests--) : null,
                      onIncrement: _guests < widget.room.maxGuests * _rooms
                          ? () => setState(() => _guests++)
                          : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Guest Details
              const Text('Guest Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _guestNameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                textCapitalization: TextCapitalization.words,
                validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _guestPhoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number *',
                  prefixIcon: Icon(Icons.phone_outlined),
                  hintText: '+959...',
                ),
                keyboardType: TextInputType.phone,
                validator: (v) => v == null || v.trim().isEmpty ? 'Phone is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _guestEmailController,
                decoration: const InputDecoration(
                  labelText: 'Email (for confirmation)',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _specialRequestsController,
                decoration: const InputDecoration(
                  labelText: 'Special Requests (optional)',
                  prefixIcon: Icon(Icons.note_outlined),
                  hintText: 'Early check-in, extra pillows...',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 24),

              // Payment method
              const Text('Payment Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              _paymentOption('KBZPAY', 'KBZPay', Icons.account_balance_wallet, 'Pay with KBZPay mobile wallet'),
              const SizedBox(height: 8),
              _paymentOption('CARD', 'Credit / Debit Card', Icons.credit_card, 'Visa, Mastercard, etc.'),
              const SizedBox(height: 24),

              // Price breakdown
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    _priceRow('${widget.room.formattedPrice} × $_nights nights × $_rooms room${_rooms > 1 ? "s" : ""}', ''),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(
                          _formattedTotal,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Final price calculated by server',
                      style: TextStyle(fontSize: 11, color: AppColors.textHint),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Book button
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _createBooking,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Proceed to Payment', style: TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _paymentOption(String value, String title, IconData icon, String subtitle) {
    final selected = _paymentMethod == value;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: selected ? AppColors.primary : AppColors.divider, width: selected ? 2 : 1),
          borderRadius: BorderRadius.circular(12),
          color: selected ? AppColors.primary.withOpacity(0.03) : Colors.white,
        ),
        child: Row(
          children: [
            Icon(icon, color: selected ? AppColors.primary : AppColors.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? AppColors.primary : AppColors.textPrimary)),
                  Text(subtitle, style: TextStyle(fontSize: 12, color: AppColors.textHint)),
                ],
              ),
            ),
            if (selected) const Icon(Icons.check_circle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }

  Widget _counterField({required String label, required int value, VoidCallback? onDecrement, VoidCallback? onIncrement}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.divider),
        borderRadius: BorderRadius.circular(12),
        color: Colors.white,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _counterIconButton(
                icon: Icons.remove_circle_outline,
                enabled: onDecrement != null,
                onTap: onDecrement,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text('$value', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
              _counterIconButton(
                icon: Icons.add_circle_outline,
                enabled: onIncrement != null,
                onTap: onIncrement,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _counterIconButton({
    required IconData icon,
    required bool enabled,
    required VoidCallback? onTap,
  }) {
    final color = enabled ? AppColors.primary : AppColors.textHint;
    return SizedBox(
      width: 28,
      height: 28,
      child: InkResponse(
        onTap: enabled ? onTap : null,
        radius: 18,
        child: Icon(icon, size: 22, color: color),
      ),
    );
  }

  Widget _priceRow(String label, String amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(child: Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 13))),
        if (amount.isNotEmpty) Text(amount, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  String _formatDate(DateTime d) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

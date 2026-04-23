import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../bookings/data/models/booking_model.dart';

/// Card payment form for Stripe payments
/// In production, use flutter_stripe package for PCI-compliant card collection
/// This screen handles the UI flow and delegates to the backend
class CardPaymentScreen extends ConsumerStatefulWidget {
  final String bookingId;
  final double amount;
  final String currency;
  final String? clientSecret; // Stripe PaymentIntent client_secret

  const CardPaymentScreen({
    super.key,
    required this.bookingId,
    required this.amount,
    required this.currency,
    this.clientSecret,
  });

  @override
  ConsumerState<CardPaymentScreen> createState() => _CardPaymentScreenState();
}

class _CardPaymentScreenState extends ConsumerState<CardPaymentScreen> {
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isProcessing = false;
  bool _saveCard = false;
  String? _error;

  String get _formattedAmount {
    final p = widget.amount.toStringAsFixed(0);
    final f = p.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return '${widget.currency} $f';
  }

  Future<void> _processPayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() { _isProcessing = true; _error = null; });

    try {
      // In production with flutter_stripe:
      // 1. Backend creates PaymentIntent, returns clientSecret
      // 2. Use Stripe.instance.confirmPayment(clientSecret, paymentMethodData)
      // 3. Backend webhook confirms payment
      //
      // For now, we call the backend simulate endpoint for development
      final repo = ref.read(bookingsRepositoryProvider);

      if (widget.clientSecret != null && widget.clientSecret!.isNotEmpty) {
        // TODO: Replace with real Stripe SDK call in production:
        //
        // await Stripe.instance.confirmPayment(
        //   paymentIntentClientSecret: widget.clientSecret!,
        //   data: PaymentMethodParams.card(
        //     paymentMethodData: PaymentMethodData(
        //       billingDetails: BillingDetails(name: _nameController.text),
        //     ),
        //   ),
        // );
        //
        // For development, simulate:
        await repo.simulatePayment(widget.bookingId);
      } else {
        // No client secret — use simulate endpoint
        await repo.simulatePayment(widget.bookingId);
      }

      if (mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _isProcessing = false; });
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 70, height: 70,
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle, color: AppColors.success, size: 45),
            ),
            const SizedBox(height: 16),
            const Text('Payment Successful!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              'Your payment of $_formattedAmount has been processed.\nAwaiting hotel approval.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context, true); // Return success to payment screen
                },
                child: const Text('Done'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Card Payment')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Amount display
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Text('Total Amount', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(
                      _formattedAmount,
                      style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Card form
              const Text('Card Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),

              // Cardholder name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Cardholder Name',
                  prefixIcon: Icon(Icons.person_outline),
                  hintText: 'Name on card',
                ),
                textCapitalization: TextCapitalization.words,
                validator: (v) => v == null || v.trim().isEmpty ? 'Name required' : null,
              ),
              const SizedBox(height: 12),

              // Card number
              TextFormField(
                controller: _cardNumberController,
                decoration: InputDecoration(
                  labelText: 'Card Number',
                  prefixIcon: const Icon(Icons.credit_card),
                  hintText: '4242 4242 4242 4242',
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _cardBrandIcon('visa'),
                      const SizedBox(width: 4),
                      _cardBrandIcon('mastercard'),
                      const SizedBox(width: 8),
                    ],
                  ),
                ),
                keyboardType: TextInputType.number,
                onChanged: (value) {
                  // Auto-format with spaces
                  final cleaned = value.replaceAll(' ', '');
                  if (cleaned.length <= 16) {
                    final formatted = cleaned.replaceAllMapped(
                      RegExp(r'.{1,4}'), (m) => '${m.group(0)} ',
                    ).trim();
                    if (formatted != value) {
                      _cardNumberController.value = TextEditingValue(
                        text: formatted,
                        selection: TextSelection.collapsed(offset: formatted.length),
                      );
                    }
                  }
                },
                validator: (v) {
                  final cleaned = v?.replaceAll(' ', '') ?? '';
                  if (cleaned.length < 13) return 'Invalid card number';
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Expiry + CVC
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _expiryController,
                      decoration: const InputDecoration(
                        labelText: 'Expiry',
                        hintText: 'MM/YY',
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (value) {
                        final cleaned = value.replaceAll('/', '');
                        if (cleaned.length == 2 && !value.contains('/')) {
                          _expiryController.value = TextEditingValue(
                            text: '$cleaned/',
                            selection: TextSelection.collapsed(offset: cleaned.length + 1),
                          );
                        }
                      },
                      validator: (v) {
                        if (v == null || v.length < 5) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _cvcController,
                      decoration: const InputDecoration(
                        labelText: 'CVC',
                        hintText: '123',
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      keyboardType: TextInputType.number,
                      obscureText: true,
                      maxLength: 4,
                      validator: (v) {
                        if (v == null || v.length < 3) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Save card
              Row(
                children: [
                  Checkbox(
                    value: _saveCard,
                    onChanged: (v) => setState(() => _saveCard = v ?? false),
                    activeColor: AppColors.primary,
                  ),
                  const Text('Save card for future payments', style: TextStyle(fontSize: 14)),
                ],
              ),
              const SizedBox(height: 8),

              // Security note
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.info.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.lock, size: 16, color: AppColors.info),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your payment is secured with SSL encryption. Card details are processed by Stripe and never stored on our servers.',
                        style: TextStyle(fontSize: 12, color: AppColors.info, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),

              // Error
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                ),
              ],

              const SizedBox(height: 24),

              // Pay button
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _processPayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          width: 24, height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text('Pay $_formattedAmount', style: const TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _cardBrandIcon(String brand) {
    final colors = {
      'visa': AppColors.primary,
      'mastercard': AppColors.warning,
    };
    return Container(
      width: 30, height: 20,
      decoration: BoxDecoration(
        color: (colors[brand] ?? Colors.grey).withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: Text(
          brand == 'visa' ? 'V' : 'MC',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: colors[brand] ?? Colors.grey,
          ),
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../bookings/data/models/booking_model.dart';
import 'card_payment_screen.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final String bookingId;
  const PaymentScreen({super.key, required this.bookingId});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  bool _isCreatingPayment = false;
  bool _isPolling = false;
  bool _paymentInitiated = false;
  String? _paymentUrl;
  String? _clientSecret;
  String? _paymentMethod;
  String? _error;
  Timer? _pollTimer;
  int _pollCount = 0;

  @override
  void initState() {
    super.initState();
    _initiatePayment();
  }

  Future<void> _initiatePayment() async {
    setState(() { _isCreatingPayment = true; _error = null; });

    try {
      final repo = ref.read(bookingsRepositoryProvider);
      final result = await repo.createPayment(widget.bookingId);

      setState(() {
        _paymentUrl = result['paymentUrl'];
        _clientSecret = result['clientSecret'];
        _paymentMethod = result['method'];
        _paymentInitiated = true;
        _isCreatingPayment = false;
      });

      final isMock =
          (_clientSecret is String && (_clientSecret ?? '').toString().startsWith('MOCK-')) ||
          ((_paymentUrl ?? '').toString().contains('mock-payment'));

      // If KBZPay, open payment URL
      if (_paymentMethod == 'KBZPAY' && _paymentUrl != null && !isMock) {
        _openPaymentUrl(_paymentUrl!);
        // Start polling for payment status
        _startPolling();
      }

      // If CARD, navigate to card payment form
      if (_paymentMethod == 'CARD' && !isMock) {
        if (mounted) {
          final success = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (_) => CardPaymentScreen(
                bookingId: widget.bookingId,
                amount: 0, // Amount comes from backend
                currency: 'MMK',
                clientSecret: _clientSecret,
              ),
            ),
          );
          if (success == true && mounted) {
            _showPaymentSuccess();
            return;
          }
        }
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isCreatingPayment = false;
      });
    }
  }

  void _startPolling() {
    _isPolling = true;
    _pollCount = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkPaymentStatus());
  }

  Future<void> _checkPaymentStatus() async {
    _pollCount++;
    if (_pollCount > 60) {
      // Stop after 3 minutes
      _pollTimer?.cancel();
      setState(() => _isPolling = false);
      return;
    }

    try {
      final repo = ref.read(bookingsRepositoryProvider);
      final status = await repo.getPaymentStatus(widget.bookingId);

      if (status['status'] == 'PAID') {
        _pollTimer?.cancel();
        if (mounted) {
          _showPaymentSuccess();
        }
      } else if (status['status'] == 'FAILED') {
        _pollTimer?.cancel();
        setState(() {
          _error = 'Payment failed. Please try again.';
          _isPolling = false;
        });
      }
    } catch (_) {
      // Continue polling on error
    }
  }

  void _showPaymentSuccess() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle, color: AppColors.success, size: 50),
            ),
            const SizedBox(height: 20),
            const Text(
              'Payment Successful!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Your booking is now awaiting hotel approval. You\'ll receive a confirmation email once approved.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  context.go('/my-bookings');
                },
                child: const Text('View My Bookings'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openPaymentUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // DEV ONLY: Simulate payment
  Future<void> _simulatePayment() async {
    setState(() => _isCreatingPayment = true);
    try {
      final repo = ref.read(bookingsRepositoryProvider);
      await repo.simulatePayment(widget.bookingId);
      if (mounted) _showPaymentSuccess();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isCreatingPayment = false);
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isMockPayment =
        (_clientSecret?.startsWith('MOCK-') ?? false) || ((_paymentUrl ?? '').contains('mock-payment'));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Cancel Payment?'),
                content: const Text('Your booking will remain in pending status.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Stay')),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.go('/my-bookings');
                    },
                    child: const Text('Leave', style: TextStyle(color: AppColors.error)),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Spacer(),

            if (_isCreatingPayment) ...[
              const CircularProgressIndicator(),
              const SizedBox(height: 20),
              const Text('Preparing payment...', style: TextStyle(fontSize: 16)),
            ] else if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: AppColors.error), textAlign: TextAlign.center),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _initiatePayment,
                  child: const Text('Retry Payment'),
                ),
              ),
            ] else if (_paymentInitiated) ...[
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                ),
                child: Column(
                  children: [
                    Icon(
                      _paymentMethod == 'KBZPAY' ? Icons.account_balance_wallet : Icons.credit_card,
                      size: 56,
                      color: AppColors.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isMockPayment
                          ? 'Development payment (mock)'
                          : (_paymentMethod == 'KBZPAY' ? 'Complete in KBZPay' : 'Enter Card Details'),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isMockPayment
                          ? 'Payments are mocked in development. Tap "Simulate Successful Payment" below to continue.'
                          : (_paymentMethod == 'KBZPAY'
                              ? 'Open the KBZPay app to complete your payment. We\'re waiting for confirmation.'
                              : 'Complete your card payment below.'),
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                    if (_isPolling) ...[
                      const SizedBox(height: 20),
                      const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
                      const SizedBox(height: 8),
                      Text(
                        'Waiting for payment...',
                        style: TextStyle(fontSize: 13, color: AppColors.textHint),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (_paymentMethod == 'KBZPAY' && _paymentUrl != null)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () => _openPaymentUrl(_paymentUrl!),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Open KBZPay'),
                  ),
                ),
            ],

            const Spacer(),

            // DEV: Simulate payment button
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.warning.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  Text(
                    'Development Mode',
                    style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton(
                      onPressed: _isCreatingPayment ? null : _simulatePayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.warning,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Simulate Successful Payment'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../partners/data/partner_repository.dart';

class BecomePartnerScreen extends ConsumerStatefulWidget {
  const BecomePartnerScreen({super.key});

  @override
  ConsumerState<BecomePartnerScreen> createState() => _BecomePartnerScreenState();
}

class _BecomePartnerScreenState extends ConsumerState<BecomePartnerScreen> {
  final _businessName = TextEditingController();
  final _businessEmail = TextEditingController();
  final _businessPhone = TextEditingController();
  final _address = TextEditingController();
  final _license = TextEditingController();

  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _businessName.dispose();
    _businessEmail.dispose();
    _businessPhone.dispose();
    _address.dispose();
    _license.dispose();
    super.dispose();
  }

  Future<void> _openPartnerDashboard() async {
    final uri = Uri.parse(AppConstants.partnerDashboardUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open ${AppConstants.partnerDashboardUrl}')),
      );
    }
  }

  Future<void> _submitRegistration() async {
    if (_businessName.text.trim().isEmpty ||
        _businessEmail.text.trim().isEmpty ||
        _businessPhone.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Business name, email and phone are required')),
      );
      return;
    }
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      await ref.read(partnerRepositoryProvider).registerPartner(
            businessName: _businessName.text.trim(),
            businessEmail: _businessEmail.text.trim(),
            businessPhone: _businessPhone.text.trim(),
            address: _address.text.trim().isEmpty ? null : _address.text.trim(),
            licenseNumber: _license.text.trim().isEmpty ? null : _license.text.trim(),
          );
      await ref.read(authProvider.notifier).checkAuthStatus();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You are now a partner (pending admin approval).'),
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authProvider).user?.role ?? 'USER';

    if (role == 'PARTNER' || role == 'ADMIN') {
      return Scaffold(
        appBar: AppBar(title: const Text('Partner')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                role == 'ADMIN'
                    ? 'Use the Admin Dashboard in the browser for admin tasks.'
                    : 'Your account is a partner. Manage properties and bookings in the Partner Dashboard.',
                style: const TextStyle(fontSize: 16, height: 1.4),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _openPartnerDashboard,
                child: const Text('Open partner dashboard'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Become a partner')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'List your property on UCLICK-Y',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Submit your business details. An administrator will approve your account before guests can book new listings.',
              style: TextStyle(color: AppColors.textSecondary, height: 1.35),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _businessName,
              decoration: const InputDecoration(
                labelText: 'Business / property name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _businessEmail,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Business email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _businessPhone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Business phone (E.164 recommended)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _address,
              decoration: const InputDecoration(
                labelText: 'Address (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _license,
              decoration: const InputDecoration(
                labelText: 'License number (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submitRegistration,
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit partner application'),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
            ],
          ],
        ),
      ),
    );
  }
}

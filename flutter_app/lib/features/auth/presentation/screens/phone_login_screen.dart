import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class PhoneLoginScreen extends ConsumerStatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  ConsumerState<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends ConsumerState<PhoneLoginScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String _selectedCountryCode = '+95'; // Myanmar default

  static const _dialToIso2 = {
    '+95': 'MM',
    '+1': 'US',
    '+44': 'GB',
    '+65': 'SG',
    '+66': 'TH',
    '+81': 'JP',
    '+82': 'KR',
    '+91': 'IN',
    '+86': 'CN',
  };

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  String get _iso2 => _dialToIso2[_selectedCountryCode] ?? 'MM';

  String get _fullPhoneNumber {
    String phone = _phoneController.text.trim();
    if (phone.startsWith('0')) phone = phone.substring(1);
    return '$_selectedCountryCode$phone';
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;

    await ref.read(otpProvider.notifier).sendOtp(country: _iso2, phone: _fullPhoneNumber);

    if (mounted) {
      final otpState = ref.read(otpProvider);
      if (otpState.isSent) {
        context.push('/otp-verify', extra: {'country': _iso2, 'phone': _fullPhoneNumber});
      } else if (otpState.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(otpState.error!), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _signInWithGoogle() async {
    final response = await ref.read(googleAuthProvider.notifier).signInWithGoogle();
    if (response != null && mounted) {
      if (!response.profileComplete) {
        context.go('/complete-profile');
      } else {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final otpState = ref.watch(otpProvider);
    final googleState = ref.watch(googleAuthProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),

                // Logo
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Center(
                          child: Text(
                            'U',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'UCLICK-Y',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Book your perfect stay',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 48),

                // Phone input
                const Text(
                  'Enter your phone number',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    // Country code dropdown
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.divider),
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white,
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedCountryCode,
                          items: const [
                            DropdownMenuItem(value: '+95', child: Text('🇲🇲 +95')),
                            DropdownMenuItem(value: '+1', child: Text('🇺🇸 +1')),
                            DropdownMenuItem(value: '+44', child: Text('🇬🇧 +44')),
                            DropdownMenuItem(value: '+65', child: Text('🇸🇬 +65')),
                            DropdownMenuItem(value: '+66', child: Text('🇹🇭 +66')),
                            DropdownMenuItem(value: '+81', child: Text('🇯🇵 +81')),
                            DropdownMenuItem(value: '+82', child: Text('🇰🇷 +82')),
                            DropdownMenuItem(value: '+91', child: Text('🇮🇳 +91')),
                            DropdownMenuItem(value: '+86', child: Text('🇨🇳 +86')),
                          ],
                          onChanged: (val) => setState(() => _selectedCountryCode = val!),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Phone number field
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          hintText: '9XX XXX XXXX',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Phone number is required';
                          }
                          if (value.trim().length < 7) {
                            return 'Invalid phone number';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Send OTP button
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: otpState.isSending ? null : _sendOtp,
                    child: otpState.isSending
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Send OTP'),
                  ),
                ),

                const SizedBox(height: 32),

                // Divider
                Row(
                  children: [
                    Expanded(child: Divider(color: AppColors.divider)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR',
                        style: TextStyle(color: AppColors.textHint, fontSize: 14),
                      ),
                    ),
                    Expanded(child: Divider(color: AppColors.divider)),
                  ],
                ),

                const SizedBox(height: 32),

                // Google sign-in
                SizedBox(
                  height: 52,
                  child: OutlinedButton.icon(
                    onPressed: googleState.isLoading ? null : _signInWithGoogle,
                    icon: googleState.isLoading
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Image.network(
                            'https://developers.google.com/identity/images/g-logo.png',
                            width: 24,
                            height: 24,
                            errorBuilder: (_, __, ___) => const Icon(Icons.g_mobiledata, size: 28),
                          ),
                    label: const Text('Continue with Google'),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.divider),
                      foregroundColor: AppColors.textPrimary,
                    ),
                  ),
                ),

                if (otpState.error != null || googleState.hasError) ...[
                  const SizedBox(height: 16),
                  Text(
                    otpState.error ?? 'Google sign-in failed',
                    style: const TextStyle(color: AppColors.error, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ],

                const SizedBox(height: 40),
                Text(
                  'By continuing, you agree to our Terms of Service\nand Privacy Policy',
                  style: TextStyle(color: AppColors.textHint, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

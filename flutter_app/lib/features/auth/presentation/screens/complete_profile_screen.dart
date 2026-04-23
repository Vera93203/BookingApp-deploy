import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/image_upload_service.dart';
import '../../../../core/widgets/image_picker_widget.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../providers/auth_provider.dart';

class CompleteProfileScreen extends ConsumerStatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  ConsumerState<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends ConsumerState<CompleteProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  File? _avatarFile;
  String? _avatarUrl;

  @override
  void initState() {
    super.initState();
    // Pre-fill from existing data
    final user = ref.read(authProvider).user;
    if (user != null) {
      _emailController.text = user.email ?? '';
      _fullNameController.text = user.profile?.fullName ?? '';
      _usernameController.text = user.profile?.username ?? '';
      final av = user.profile?.avatarUrl;
      if (av != null && av.isNotEmpty) {
        _avatarUrl = AppConstants.normalizeServerUrl(av);
      }
    }
  }

  Future<void> _pickAvatar(ImageSource source) async {
    final uploadService = ref.read(imageUploadServiceProvider);
    final file = await uploadService.pickImage(source: source, maxWidth: 600, maxHeight: 600);
    if (file != null) {
      setState(() => _avatarFile = File(file.path));
    }
  }

  Future<void> _completeProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Upload avatar first if selected
      String? uploadedAvatarUrl;
      if (_avatarFile != null) {
        final uploadService = ref.read(imageUploadServiceProvider);
        final result = await uploadService.uploadAvatar(XFile(_avatarFile!.path));
        uploadedAvatarUrl = result.url;
      }

      await ref.read(profileProvider.notifier).completeProfile(
        username: _usernameController.text.trim(),
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
      );

      // Update avatar URL if uploaded
      if (uploadedAvatarUrl != null) {
        await ref.read(profileProvider.notifier).updateProfile({
          'avatarUrl': uploadedAvatarUrl,
        });
      }

      // Refresh user data
      final authRepo = ref.read(authProvider.notifier);
      await authRepo.checkAuthStatus();

      if (mounted) context.go('/home');
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
    _usernameController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                const Text(
                  'Complete your profile',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tell us a bit about yourself to get started',
                  style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
                ),

                const SizedBox(height: 40),

                // Avatar upload
                Center(
                  child: ImagePickerWidget(
                    imageUrl: _avatarUrl,
                    imageFile: _avatarFile,
                    size: 120,
                    isCircle: true,
                    onPickFromGallery: () => _pickAvatar(ImageSource.gallery),
                    onPickFromCamera: () => _pickAvatar(ImageSource.camera),
                    onRemove: _avatarFile != null || _avatarUrl != null
                        ? () => setState(() { _avatarFile = null; _avatarUrl = null; })
                        : null,
                  ),
                ),

                const SizedBox(height: 32),

                // Username
                TextFormField(
                  controller: _usernameController,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    hintText: 'Choose a username',
                    prefixIcon: Icon(Icons.alternate_email),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) return 'Username is required';
                    if (value.trim().length < 3) return 'At least 3 characters';
                    if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value.trim())) {
                      return 'Only letters, numbers and underscore';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Full name
                TextFormField(
                  controller: _fullNameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'Enter your full name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  textCapitalization: TextCapitalization.words,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) return 'Full name is required';
                    if (value.trim().length < 2) return 'At least 2 characters';
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Email (optional)
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email (optional)',
                    hintText: 'Enter your email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value != null && value.isNotEmpty) {
                      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                        return 'Invalid email address';
                      }
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 40),

                // Submit
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _completeProfile,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24, height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Get Started'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

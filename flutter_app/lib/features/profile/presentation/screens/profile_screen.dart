import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final profile = user?.profile;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar section
            const SizedBox(height: 10),
            CircleAvatar(
              radius: 50,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              backgroundImage: (profile?.avatarUrl != null && profile!.avatarUrl!.isNotEmpty)
                  ? CachedNetworkImageProvider(
                      AppConstants.normalizeServerUrl(profile.avatarUrl!),
                    )
                  : null,
              onBackgroundImageError: (_, __) {},
              child: (profile?.avatarUrl == null || profile!.avatarUrl!.isEmpty)
                  ? Text(
                      (profile?.fullName ?? 'U')[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    )
                  : null,
            ),
            const SizedBox(height: 12),
            Text(
              profile?.fullName ?? 'User',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            if (profile?.username != null)
              Text(
                '@${profile!.username}',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
              ),
            const SizedBox(height: 24),

            // Info cards
            _infoTile(Icons.phone, 'Phone', user?.phone ?? 'Not set'),
            _infoTile(Icons.email, 'Email', user?.email ?? 'Not set'),
            _infoTile(Icons.badge, 'Role', user?.role ?? 'USER'),
            if (profile?.nationality != null)
              _infoTile(Icons.flag, 'Nationality', profile!.nationality!),

            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 8),

            // Menu items
            if (user?.role == 'USER')
              _menuItem(
                icon: Icons.storefront_outlined,
                title: 'Become a partner',
                subtitle: 'Apply to list your property',
                onTap: () => context.push('/become-partner'),
              ),
            if (user?.role == 'PARTNER')
              _menuItem(
                icon: Icons.dashboard_outlined,
                title: 'Partner dashboard',
                subtitle: 'Web dashboard & listings',
                onTap: () => context.push('/become-partner'),
              ),
            _menuItem(
              icon: Icons.edit,
              title: 'Edit Profile',
              onTap: () => context.push('/complete-profile'),
            ),
            _menuItem(
              icon: Icons.book_outlined,
              title: 'My Bookings',
              onTap: () => context.push('/my-bookings'),
            ),
            _menuItem(
              icon: Icons.notifications_outlined,
              title: 'Notifications',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Notifications screen coming soon')),
                );
              },
            ),
            _menuItem(
              icon: Icons.help_outline,
              title: 'Help & Support',
              onTap: () {},
            ),
            _menuItem(
              icon: Icons.privacy_tip_outlined,
              title: 'Privacy Policy',
              onTap: () {},
            ),
            _menuItem(
              icon: Icons.info_outline,
              title: 'About UCLICK-Y',
              subtitle: 'Version 1.0.0',
              onTap: () {},
            ),

            const SizedBox(height: 16),

            // Logout button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                onPressed: () => _confirmLogout(context, ref),
                icon: const Icon(Icons.logout, color: AppColors.error),
                label: const Text('Log Out', style: TextStyle(color: AppColors.error)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 12),
            Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
            const Spacer(),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _menuItem({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: subtitle != null ? Text(subtitle, style: TextStyle(fontSize: 12, color: AppColors.textHint)) : null,
      trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
      onTap: onTap,
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            child: const Text('Log Out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/phone_login_screen.dart';
import '../../features/auth/presentation/screens/otp_verify_screen.dart';
import '../../features/auth/presentation/screens/complete_profile_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/properties/presentation/screens/search_results_screen.dart';
import '../../features/properties/presentation/screens/property_detail_screen.dart';
import '../../features/properties/data/models/property_model.dart';
import '../../features/bookings/presentation/screens/create_booking_screen.dart';
import '../../features/bookings/presentation/screens/my_bookings_screen.dart';
import '../../features/bookings/presentation/screens/booking_detail_screen.dart';
import '../../features/payments/presentation/screens/payment_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/become_partner_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: kDebugMode,
    redirect: (context, state) {
      final isLoggedIn = authState.status == AuthStatus.authenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/otp-verify' ||
          state.matchedLocation == '/complete-profile';

      // Avoid mounting Home (and network) before we know auth from storage.
      if (authState.status == AuthStatus.initial) {
        if (state.matchedLocation != '/splash') return '/splash';
        return null;
      }
      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn &&
          !authState.profileComplete &&
          state.matchedLocation != '/complete-profile') {
        return '/complete-profile';
      }
      if (isLoggedIn &&
          authState.profileComplete &&
          (state.matchedLocation == '/login' ||
              state.matchedLocation == '/' ||
              state.matchedLocation == '/splash')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', redirect: (_, __) => '/splash'),
      GoRoute(
        path: '/splash',
        builder: (_, __) => const Scaffold(
          // Avoid indeterminate progress here: it animates forever and breaks
          // widget tests (pumpAndSettle) and wastes frames during bootstrap.
          body: Center(child: CircularProgressIndicator(value: 0.15)),
        ),
      ),
      GoRoute(path: '/login', builder: (_, __) => const PhoneLoginScreen()),
      GoRoute(
        path: '/otp-verify',
        builder: (_, state) {
          final extra = state.extra;
          if (extra is Map<String, dynamic>) {
            return OtpVerifyScreen(
              phoneNumber: (extra['phone'] as String?) ?? '',
              country: (extra['country'] as String?) ?? 'MM',
            );
          }
          return OtpVerifyScreen(phoneNumber: extra as String? ?? '', country: 'MM');
        },
      ),
      GoRoute(path: '/complete-profile', builder: (_, __) => const CompleteProfileScreen()),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/search-results', builder: (_, __) => const SearchResultsScreen()),
      GoRoute(
        path: '/property/:id',
        builder: (_, state) => PropertyDetailScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/booking/create',
        builder: (_, state) {
          final data = state.extra as Map<String, dynamic>;
          return CreateBookingScreen(
            property: data['property'] as PropertyModel,
            room: data['room'] as RoomTypeModel,
          );
        },
      ),
      GoRoute(path: '/my-bookings', builder: (_, __) => const MyBookingsScreen()),
      GoRoute(
        path: '/booking/:id',
        builder: (_, state) => BookingDetailScreen(bookingId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/payment/:bookingId',
        builder: (_, state) => PaymentScreen(bookingId: state.pathParameters['bookingId']!),
      ),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/become-partner', builder: (_, __) => const BecomePartnerScreen()),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.uri}')),
    ),
  );
});

class AppConstants {
  AppConstants._();

  // API — Simulator/desktop: localhost works. Physical device: same Wi‑Fi LAN IP or production HTTPS.
  //
  // Release / store builds must point at your public API, for example:
  // flutter build apk --dart-define=API_BASE_URL=https://api.yourdomain.com/api
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3003/api',
  );
  // Example alternative:
  // static const String baseUrl = 'http://localhost:3003/api';

  // App Info
  static const String appName = 'UCLICK-Y';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String onboardingKey = 'onboarding_complete';

  // Defaults
  static const String defaultCurrency = 'MMK';
  static const String defaultCountry = 'Myanmar';
  static const int otpLength = 6;
  static const int otpTimeoutSeconds = 60;

  /// When backend uses OTP mock (`FORCE_DEV_OTP_MOCK=true`). For local UI hint/prefill only:
  /// `flutter run --dart-define=MOCK_OTP_UI=true`
  static const String devMockOtpCode = '123456';
  static const bool mockOtpUi =
      bool.fromEnvironment('MOCK_OTP_UI', defaultValue: false);

  // Google Sign-In (Google Cloud Console → Credentials)
  //
  // Web client — same as backend/.env GOOGLE_CLIENT_ID. Used as serverClientId; ID token audience.
  static const String googleWebClientId =
      '991395194524-9fr6vb73v80e0buqutj3f0s5n8nn4c95.apps.googleusercontent.com';
  //
  // iOS-only OAuth client (type "iOS", bundle ID com.uclicky.uclicky). Must NOT be the Web client —
  // otherwise Google returns "Custom scheme URIs are not allowed for WEB client type".
  static const String googleIosClientId =
      '991395194524-3bouidl9t9o6lpaiv1b5qe6e615ns96q.apps.googleusercontent.com';

  /// Base server origin, e.g. `http://192.168.1.91:3003`
  static String get serverOrigin {
    final uri = Uri.parse(baseUrl);
    return '${uri.scheme}://${uri.host}${uri.hasPort ? ':${uri.port}' : ''}';
  }

  /// Next.js partner dashboard (default port 3001). Override:
  /// `flutter run --dart-define=PARTNER_DASHBOARD_URL=http://192.168.x.x:3001`
  static String get partnerDashboardUrl {
    const fromEnv = String.fromEnvironment('PARTNER_DASHBOARD_URL', defaultValue: '');
    if (fromEnv.isNotEmpty) return fromEnv;
    final u = Uri.parse(baseUrl);
    if (u.host.isEmpty) return 'http://localhost:3001/';
    return Uri(
      scheme: u.scheme,
      host: u.host,
      port: 3001,
      path: '/',
    ).toString();
  }

  /// Normalize server URLs so physical devices can load them.
  ///
  /// Handles:
  /// - absolute `http(s)://localhost:3000|3003/...` → rewritten to current `serverOrigin`
  /// - relative `/uploads/...` → prefixed with current `serverOrigin`
  static String normalizeServerUrl(String url) {
    if (url.isEmpty) return url;
    if (url.startsWith('/')) return '$serverOrigin$url';

    // Backend may emit localhost URLs (common during local development).
    for (final prefix in const [
      'http://localhost:3000/',
      'https://localhost:3000/',
      'http://localhost:3003/',
      'https://localhost:3003/',
    ]) {
      if (url.startsWith(prefix)) {
        return '$serverOrigin/${url.substring(prefix.length)}';
      }
    }
    return url;
  }
}

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository.dart';

// Auth state
enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? error;
  final bool profileComplete;
  final bool isNewUser;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
    this.profileComplete = false,
    this.isNewUser = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? error,
    bool? profileComplete,
    bool? isNewUser,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
      profileComplete: profileComplete ?? this.profileComplete,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}

// OTP flow state
class OtpState {
  final bool isSending;
  final bool isSent;
  final bool isVerifying;
  final String? error;

  const OtpState({
    this.isSending = false,
    this.isSent = false,
    this.isVerifying = false,
    this.error,
  });

  OtpState copyWith({bool? isSending, bool? isSent, bool? isVerifying, String? error}) {
    return OtpState(
      isSending: isSending ?? this.isSending,
      isSent: isSent ?? this.isSent,
      isVerifying: isVerifying ?? this.isVerifying,
      error: error,
    );
  }
}

// Main auth provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState()) {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    try {
      final isLoggedIn = await _repository.isLoggedIn();
      if (isLoggedIn) {
        final user = await _repository.getMe();
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
          profileComplete: user.isProfileComplete,
        );
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  void setAuthenticated(AuthResponse response) {
    state = AuthState(
      status: AuthStatus.authenticated,
      user: response.user,
      profileComplete: response.profileComplete,
      isNewUser: response.isNewUser,
    );
  }

  void updateUser(UserModel user) {
    state = state.copyWith(user: user, profileComplete: user.isProfileComplete);
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

// OTP provider
final otpProvider = StateNotifierProvider<OtpNotifier, OtpState>((ref) {
  return OtpNotifier(ref.read(authRepositoryProvider), ref.read(authProvider.notifier));
});

class OtpNotifier extends StateNotifier<OtpState> {
  final AuthRepository _repository;
  final AuthNotifier _authNotifier;

  OtpNotifier(this._repository, this._authNotifier) : super(const OtpState());

  Future<void> sendOtp({required String country, required String phone}) async {
    state = const OtpState(isSending: true);
    try {
      await _repository.sendOtp(country: country, phone: phone);
      state = const OtpState(isSent: true);
    } catch (e) {
      state = OtpState(error: e.toString());
    }
  }

  Future<AuthResponse?> verifyOtp({
    required String country,
    required String phone,
    required String code,
  }) async {
    state = state.copyWith(isVerifying: true, error: null);
    try {
      final response = await _repository.verifyOtp(country: country, phone: phone, code: code);
      _authNotifier.setAuthenticated(response);
      state = const OtpState();
      return response;
    } catch (e) {
      state = OtpState(error: e.toString());
      return null;
    }
  }

  void reset() {
    state = const OtpState();
  }
}

bool _configured(String id) => id.isNotEmpty && !id.startsWith('YOUR_');

// Google sign-in: Web client ID → server (verify token); iOS client ID → native sign-in on Apple.
final googleSignInProvider = Provider<GoogleSignIn>((ref) {
  const web = AppConstants.googleWebClientId;
  const ios = AppConstants.googleIosClientId;
  final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  return GoogleSignIn(
    scopes: const ['email', 'profile'],
    serverClientId: _configured(web) ? web : null,
    clientId: isIOS && _configured(ios) ? ios : null,
  );
});

final googleAuthProvider = StateNotifierProvider<GoogleAuthNotifier, AsyncValue<void>>((ref) {
  return GoogleAuthNotifier(
    ref.read(googleSignInProvider),
    ref.read(authRepositoryProvider),
    ref.read(authProvider.notifier),
  );
});

class GoogleAuthNotifier extends StateNotifier<AsyncValue<void>> {
  final GoogleSignIn _googleSignIn;
  final AuthRepository _repository;
  final AuthNotifier _authNotifier;

  GoogleAuthNotifier(this._googleSignIn, this._repository, this._authNotifier)
      : super(const AsyncValue.data(null));

  Future<AuthResponse?> signInWithGoogle({String? country}) async {
    state = const AsyncValue.loading();
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        state = const AsyncValue.data(null);
        return null; // User cancelled
      }

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      if (idToken == null) {
        state = AsyncValue.error('Failed to get Google ID token', StackTrace.current);
        return null;
      }

      final response = await _repository.googleAuth(idToken, country: country);
      _authNotifier.setAuthenticated(response);
      state = const AsyncValue.data(null);
      return response;
    } catch (e, st) {
      state = AsyncValue.error(e.toString(), st);
      return null;
    }
  }
}

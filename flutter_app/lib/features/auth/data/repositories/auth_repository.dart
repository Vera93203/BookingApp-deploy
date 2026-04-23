import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/dio_client.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider), ref.read(secureStorageProvider));
});

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthRepository(this._dio, this._storage);

  /// Send OTP to phone via Twilio
  Future<Map<String, dynamic>> sendOtp({required String country, required String phone}) async {
    try {
      final response = await _dio.post('/auth/send-otp', data: {
        'country': country,
        'phone': phone,
      });
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Verify OTP and get JWT tokens
  Future<AuthResponse> verifyOtp({
    required String country,
    required String phone,
    required String code,
  }) async {
    try {
      final response = await _dio.post('/auth/verify-otp', data: {
        'country': country,
        'phone': phone,
        'code': code,
      });

      final authResponse = AuthResponse.fromJson(response.data);

      // Store tokens securely
      await _storage.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );

      return authResponse;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Google Sign-In
  Future<AuthResponse> googleAuth(String idToken, {String? country}) async {
    try {
      final response = await _dio.post('/auth/google', data: {
        'idToken': idToken,
        if (country != null && country.isNotEmpty) 'country': country,
      });

      final authResponse = AuthResponse.fromJson(response.data);

      await _storage.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );

      return authResponse;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Get current user
  Future<UserModel> getMe() async {
    try {
      final response = await _dio.get('/auth/me');
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // Ignore errors on logout
    } finally {
      await _storage.clearAll();
    }
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    return _storage.hasToken();
  }
}

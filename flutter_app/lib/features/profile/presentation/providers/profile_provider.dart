import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/dio_client.dart';
import '../../../../core/errors/api_exception.dart';

final profileProvider = StateNotifierProvider<ProfileNotifier, AsyncValue<void>>((ref) {
  return ProfileNotifier(ref.read(dioProvider));
});

class ProfileNotifier extends StateNotifier<AsyncValue<void>> {
  final Dio _dio;

  ProfileNotifier(this._dio) : super(const AsyncValue.data(null));

  Future<void> completeProfile({
    required String username,
    required String fullName,
    String? email,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _dio.post('/profile/complete', data: {
        'username': username,
        'fullName': fullName,
        if (email != null) 'email': email,
      });
      state = const AsyncValue.data(null);
    } on DioException catch (e, st) {
      state = AsyncValue.error(ApiException.fromDioError(e).message, st);
      rethrow;
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await _dio.put('/profile', data: data);
      state = const AsyncValue.data(null);
    } on DioException catch (e, st) {
      state = AsyncValue.error(ApiException.fromDioError(e).message, st);
      rethrow;
    }
  }
}

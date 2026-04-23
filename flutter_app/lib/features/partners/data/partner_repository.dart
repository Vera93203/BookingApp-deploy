import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/dio_client.dart';
import '../../../../core/errors/api_exception.dart';

final partnerRepositoryProvider = Provider<PartnerRepository>((ref) {
  return PartnerRepository(ref.read(dioProvider));
});

class PartnerRepository {
  PartnerRepository(this._dio);

  final Dio _dio;

  Future<void> registerPartner({
    required String businessName,
    required String businessEmail,
    required String businessPhone,
    String? address,
    String? licenseNumber,
  }) async {
    try {
      await _dio.post('/partner/register', data: {
        'businessName': businessName,
        'businessEmail': businessEmail,
        'businessPhone': businessPhone,
        if (address != null && address.isNotEmpty) 'address': address,
        if (licenseNumber != null && licenseNumber.isNotEmpty) 'licenseNumber': licenseNumber,
      });
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

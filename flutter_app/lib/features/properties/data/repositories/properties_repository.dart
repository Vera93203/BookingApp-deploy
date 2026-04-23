import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/dio_client.dart';
import '../../../../core/errors/api_exception.dart';
import '../models/property_model.dart';

final propertiesRepositoryProvider = Provider<PropertiesRepository>((ref) {
  return PropertiesRepository(ref.read(dioProvider));
});

class PropertiesRepository {
  final Dio _dio;

  PropertiesRepository(this._dio);

  Future<PropertySearchResult> searchProperties({
    String? city,
    String? query,
    String? checkIn,
    String? checkOut,
    int? guests,
    int page = 1,
    int limit = 20,
    double? minPrice,
    double? maxPrice,
    int? minRating,
  }) async {
    try {
      final params = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (city != null) params['city'] = city;
      if (query != null) params['query'] = query;
      if (checkIn != null) params['checkIn'] = checkIn;
      if (checkOut != null) params['checkOut'] = checkOut;
      if (guests != null) params['guests'] = guests;
      if (minPrice != null) params['minPrice'] = minPrice;
      if (maxPrice != null) params['maxPrice'] = maxPrice;
      if (minRating != null) params['minRating'] = minRating;

      final response = await _dio.get('/properties/search', queryParameters: params);
      return PropertySearchResult.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<PropertyModel> getPropertyById(String id) async {
    try {
      final response = await _dio.get('/properties/$id');
      return PropertyModel.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

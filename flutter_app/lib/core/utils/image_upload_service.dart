import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../constants/app_constants.dart';
import '../api/dio_client.dart';
import '../errors/api_exception.dart';

final imageUploadServiceProvider = Provider<ImageUploadService>((ref) {
  return ImageUploadService(ref.read(dioProvider));
});

class UploadResult {
  final String url;
  final String filename;
  final String originalName;
  final int size;

  UploadResult({
    required this.url,
    required this.filename,
    required this.originalName,
    required this.size,
  });

  factory UploadResult.fromJson(Map<String, dynamic> json) {
    return UploadResult(
      url: AppConstants.normalizeServerUrl(json['url'] ?? ''),
      filename: json['filename'] ?? '',
      originalName: json['originalName'] ?? '',
      size: json['size'] ?? 0,
    );
  }
}

class ImageUploadService {
  final Dio _dio;
  final ImagePicker _picker = ImagePicker();

  ImageUploadService(this._dio);

  /// Pick single image from gallery or camera
  Future<XFile?> pickImage({
    ImageSource source = ImageSource.gallery,
    int maxWidth = 1200,
    int maxHeight = 1200,
    int quality = 85,
  }) async {
    try {
      return await _picker.pickImage(
        source: source,
        maxWidth: maxWidth.toDouble(),
        maxHeight: maxHeight.toDouble(),
        imageQuality: quality,
      );
    } catch (e) {
      return null;
    }
  }

  /// Pick multiple images from gallery
  Future<List<XFile>> pickMultipleImages({
    int maxWidth = 1200,
    int maxHeight = 1200,
    int quality = 85,
    int limit = 10,
  }) async {
    try {
      final images = await _picker.pickMultiImage(
        maxWidth: maxWidth.toDouble(),
        maxHeight: maxHeight.toDouble(),
        imageQuality: quality,
        limit: limit,
      );
      return images;
    } catch (e) {
      return [];
    }
  }

  /// Upload user avatar
  Future<UploadResult> uploadAvatar(XFile file) async {
    return _uploadSingle(file, '/uploads/avatar');
  }

  /// Upload property images
  Future<List<UploadResult>> uploadPropertyImages(
    String propertyId,
    List<XFile> files,
  ) async {
    return _uploadMultiple(files, '/uploads/property/$propertyId');
  }

  /// Upload room images
  Future<List<UploadResult>> uploadRoomImages(
    String roomId,
    List<XFile> files,
  ) async {
    return _uploadMultiple(files, '/uploads/room/$roomId');
  }

  /// Pick and upload avatar in one step
  Future<UploadResult?> pickAndUploadAvatar({ImageSource source = ImageSource.gallery}) async {
    final file = await pickImage(source: source, maxWidth: 600, maxHeight: 600, quality: 80);
    if (file == null) return null;
    return uploadAvatar(file);
  }

  /// Pick and upload property images in one step
  Future<List<UploadResult>> pickAndUploadPropertyImages(String propertyId) async {
    final files = await pickMultipleImages(limit: 10);
    if (files.isEmpty) return [];
    return uploadPropertyImages(propertyId, files);
  }

  // ========================================
  // Private upload methods
  // ========================================

  Future<UploadResult> _uploadSingle(XFile file, String endpoint) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: file.name,
        ),
      });

      final response = await _dio.post(
        endpoint,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
        onSendProgress: (sent, total) {
          // Progress callback — can be wired to UI (sent / total)
        },
      );

      return UploadResult.fromJson(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<UploadResult>> _uploadMultiple(List<XFile> files, String endpoint) async {
    try {
      final multipartFiles = <MapEntry<String, MultipartFile>>[];
      for (final file in files) {
        multipartFiles.add(MapEntry(
          'files',
          await MultipartFile.fromFile(file.path, filename: file.name),
        ));
      }

      final formData = FormData();
      for (final entry in multipartFiles) {
        formData.files.add(entry);
      }

      final response = await _dio.post(
        endpoint,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final images = (response.data['images'] as List?)
          ?.map((img) => UploadResult.fromJson(img))
          .toList() ?? [];

      return images;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

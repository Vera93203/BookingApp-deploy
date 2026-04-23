import 'dart:io';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Single image picker with preview and camera/gallery choice
class ImagePickerWidget extends StatelessWidget {
  final String? imageUrl;
  final File? imageFile;
  final VoidCallback onPickFromGallery;
  final VoidCallback onPickFromCamera;
  final VoidCallback? onRemove;
  final double size;
  final bool isCircle;

  const ImagePickerWidget({
    super.key,
    this.imageUrl,
    this.imageFile,
    required this.onPickFromGallery,
    required this.onPickFromCamera,
    this.onRemove,
    this.size = 120,
    this.isCircle = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showPickerSheet(context),
      child: Stack(
        children: [
          // Image/Placeholder
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: isCircle ? null : BorderRadius.circular(16),
              color: AppColors.primary.withOpacity(0.08),
              border: Border.all(color: AppColors.divider, width: 2),
              image: _getDecorationImage(),
            ),
            child: _hasImage()
                ? null
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_a_photo_outlined, size: size * 0.25, color: AppColors.primary),
                      const SizedBox(height: 4),
                      Text(
                        'Add Photo',
                        style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
          ),

          // Camera icon overlay
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Icon(
                Icons.camera_alt,
                size: size * 0.13,
                color: Colors.white,
              ),
            ),
          ),

          // Remove button
          if (_hasImage() && onRemove != null)
            Positioned(
              top: 0,
              right: 0,
              child: GestureDetector(
                onTap: onRemove,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, size: 14, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _hasImage() => imageFile != null || (imageUrl != null && imageUrl!.isNotEmpty);

  DecorationImage? _getDecorationImage() {
    if (imageFile != null) {
      return DecorationImage(image: FileImage(imageFile!), fit: BoxFit.cover);
    }
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return DecorationImage(image: NetworkImage(imageUrl!), fit: BoxFit.cover);
    }
    return null;
  }

  void _showPickerSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.primary),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(ctx);
                  onPickFromGallery();
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: AppColors.primary),
                title: const Text('Take a Photo'),
                onTap: () {
                  Navigator.pop(ctx);
                  onPickFromCamera();
                },
              ),
              if (_hasImage() && onRemove != null)
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: AppColors.error),
                  title: const Text('Remove Photo', style: TextStyle(color: AppColors.error)),
                  onTap: () {
                    Navigator.pop(ctx);
                    onRemove!();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Multi-image picker grid with add button
class MultiImagePickerGrid extends StatelessWidget {
  final List<String> existingUrls;
  final List<File> newFiles;
  final VoidCallback onAddImages;
  final Function(int) onRemoveExisting;
  final Function(int) onRemoveNew;
  final int maxImages;

  const MultiImagePickerGrid({
    super.key,
    this.existingUrls = const [],
    this.newFiles = const [],
    required this.onAddImages,
    required this.onRemoveExisting,
    required this.onRemoveNew,
    this.maxImages = 10,
  });

  @override
  Widget build(BuildContext context) {
    final totalImages = existingUrls.length + newFiles.length;
    final canAdd = totalImages < maxImages;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: totalImages + (canAdd ? 1 : 0),
      itemBuilder: (context, index) {
        // Add button
        if (index == totalImages && canAdd) {
          return GestureDetector(
            onTap: onAddImages,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(12),
                color: AppColors.primary.withOpacity(0.05),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_photo_alternate_outlined, color: AppColors.primary, size: 28),
                  const SizedBox(height: 4),
                  Text(
                    '${totalImages}/${maxImages}',
                    style: TextStyle(fontSize: 11, color: AppColors.textHint),
                  ),
                ],
              ),
            ),
          );
        }

        // Existing URL image
        if (index < existingUrls.length) {
          return _imageCard(
            child: Image.network(existingUrls[index], fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Icon(Icons.broken_image)),
            onRemove: () => onRemoveExisting(index),
          );
        }

        // New file image
        final fileIndex = index - existingUrls.length;
        return _imageCard(
          child: Image.file(newFiles[fileIndex], fit: BoxFit.cover),
          onRemove: () => onRemoveNew(fileIndex),
          isNew: true,
        );
      },
    );
  }

  Widget _imageCard({required Widget child, required VoidCallback onRemove, bool isNew = false}) {
    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isNew ? AppColors.success : AppColors.divider),
          ),
          clipBehavior: Clip.antiAlias,
          child: SizedBox.expand(child: child),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
        if (isNew)
          Positioned(
            bottom: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.success,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('New', style: TextStyle(color: Colors.white, fontSize: 10)),
            ),
          ),
      ],
    );
  }
}

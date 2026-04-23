import '../../../../core/constants/app_constants.dart';

class UserModel {
  final String id;
  final String? phone;
  final String? email;
  final String? googleId;
  final String role;
  final bool isActive;
  final bool isVerified;
  final UserProfileModel? profile;
  final String createdAt;

  UserModel({
    required this.id,
    this.phone,
    this.email,
    this.googleId,
    required this.role,
    required this.isActive,
    required this.isVerified,
    this.profile,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      phone: json['phone'],
      email: json['email'],
      googleId: json['googleId'] ?? json['google_id'],
      role: json['role'] ?? 'USER',
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      isVerified: json['isVerified'] ?? json['is_verified'] ?? false,
      profile: json['profile'] != null
          ? UserProfileModel.fromJson(json['profile'])
          : null,
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'phone': phone,
    'email': email,
    'role': role,
    'isActive': isActive,
    'isVerified': isVerified,
    'profile': profile?.toJson(),
  };

  bool get isProfileComplete => profile?.isComplete ?? false;
}

class UserProfileModel {
  final String id;
  final String userId;
  final String? username;
  final String? fullName;
  final String? avatarUrl;
  final String? dateOfBirth;
  final String? nationality;
  final bool isComplete;

  UserProfileModel({
    required this.id,
    required this.userId,
    this.username,
    this.fullName,
    this.avatarUrl,
    this.dateOfBirth,
    this.nationality,
    required this.isComplete,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    final rawAvatar = (json['avatarUrl'] ?? json['avatar_url'] ?? '').toString();
    return UserProfileModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? json['user_id'] ?? '',
      username: json['username'],
      fullName: json['fullName'] ?? json['full_name'],
      avatarUrl: rawAvatar.isEmpty ? null : AppConstants.normalizeServerUrl(rawAvatar),
      dateOfBirth: json['dateOfBirth'] ?? json['date_of_birth'],
      nationality: json['nationality'],
      isComplete: json['isComplete'] ?? json['is_complete'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'username': username,
    'fullName': fullName,
    'avatarUrl': avatarUrl,
    'isComplete': isComplete,
  };
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final UserModel user;
  final bool isNewUser;
  final bool profileComplete;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    required this.isNewUser,
    required this.profileComplete,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
      user: UserModel.fromJson(json['user'] ?? {}),
      isNewUser: json['isNewUser'] ?? false,
      profileComplete: json['profileComplete'] ?? false,
    );
  }
}

class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? storeId;
  final bool isActive;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.storeId,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Helper function to extract string from either string or object
    String extractString(dynamic value) {
      if (value == null) return '';
      if (value is String) return value;
      if (value is Map && value.containsKey('name')) return value['name'] ?? '';
      if (value is Map && value.containsKey('_id')) return value['_id'] ?? '';
      return '';
    }

    // Helper function to extract store ID from currentStore or storeId
    String? extractStoreId(dynamic currentStore, dynamic storeId) {
      if (currentStore != null) {
        if (currentStore is String) return currentStore;
        if (currentStore is Map && currentStore.containsKey('_id')) {
          return currentStore['_id'];
        }
      }
      if (storeId != null) {
        if (storeId is String) return storeId;
        if (storeId is Map && storeId.containsKey('_id')) {
          return storeId['_id'];
        }
      }
      return null;
    }

    return User(
      id: extractString(json['_id'] ?? json['id']),
      email: extractString(json['email']),
      name: extractString(json['name']),
      role: extractString(json['role']),
      storeId: extractStoreId(json['currentStore'], json['storeId']),
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'storeId': storeId,
      'isActive': isActive,
    };
  }
}

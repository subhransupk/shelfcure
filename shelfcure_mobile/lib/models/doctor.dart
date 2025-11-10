class Doctor {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? specialization;
  final String? registrationNumber;
  final double commissionRate;
  final String commissionType; // 'percentage' or 'fixed'
  final double fixedCommissionAmount;
  final String status; // 'active', 'inactive', 'blocked'
  final bool isVerified;
  final int totalPrescriptions;
  final double totalCommissionEarned;
  final DateTime? lastPrescriptionDate;
  final String? notes;

  Doctor({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.specialization,
    this.registrationNumber,
    this.commissionRate = 0,
    this.commissionType = 'percentage',
    this.fixedCommissionAmount = 0,
    this.status = 'active',
    this.isVerified = false,
    this.totalPrescriptions = 0,
    this.totalCommissionEarned = 0,
    this.lastPrescriptionDate,
    this.notes,
  });

  // Virtual property: full name with title
  String get fullName => 'Dr. $name';

  // Virtual property: commission display
  String get commissionDisplay {
    if (commissionType == 'percentage') {
      return '$commissionRate%';
    } else {
      return '₹${fixedCommissionAmount.toStringAsFixed(2)}';
    }
  }

  // Check if doctor is active
  bool get isActive => status == 'active';

  // Check if doctor is blocked
  bool get isBlocked => status == 'blocked';

  // Display name with specialization
  String get displayName => '$name${specialization != null ? ' - $specialization' : ''}';

  // JSON serialization
  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'],
      specialization: json['specialization'],
      registrationNumber: json['registrationNumber'],
      commissionRate: (json['commissionRate'] ?? 0).toDouble(),
      commissionType: json['commissionType'] ?? 'percentage',
      fixedCommissionAmount: (json['fixedCommissionAmount'] ?? 0).toDouble(),
      status: json['status'] ?? 'active',
      isVerified: json['isVerified'] ?? false,
      totalPrescriptions: json['totalPrescriptions'] ?? 0,
      totalCommissionEarned: (json['totalCommissionEarned'] ?? 0).toDouble(),
      lastPrescriptionDate: json['lastPrescriptionDate'] != null
          ? DateTime.parse(json['lastPrescriptionDate'])
          : null,
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'specialization': specialization,
      'registrationNumber': registrationNumber,
      'commissionRate': commissionRate,
      'commissionType': commissionType,
      'fixedCommissionAmount': fixedCommissionAmount,
      'status': status,
      'isVerified': isVerified,
      'totalPrescriptions': totalPrescriptions,
      'totalCommissionEarned': totalCommissionEarned,
      'lastPrescriptionDate': lastPrescriptionDate?.toIso8601String(),
      'notes': notes,
    };
  }

  // Copy with method for creating modified copies
  Doctor copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? specialization,
    String? registrationNumber,
    double? commissionRate,
    String? commissionType,
    double? fixedCommissionAmount,
    String? status,
    bool? isVerified,
    int? totalPrescriptions,
    double? totalCommissionEarned,
    DateTime? lastPrescriptionDate,
    String? notes,
  }) {
    return Doctor(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      specialization: specialization ?? this.specialization,
      registrationNumber: registrationNumber ?? this.registrationNumber,
      commissionRate: commissionRate ?? this.commissionRate,
      commissionType: commissionType ?? this.commissionType,
      fixedCommissionAmount: fixedCommissionAmount ?? this.fixedCommissionAmount,
      status: status ?? this.status,
      isVerified: isVerified ?? this.isVerified,
      totalPrescriptions: totalPrescriptions ?? this.totalPrescriptions,
      totalCommissionEarned: totalCommissionEarned ?? this.totalCommissionEarned,
      lastPrescriptionDate: lastPrescriptionDate ?? this.lastPrescriptionDate,
      notes: notes ?? this.notes,
    );
  }
}


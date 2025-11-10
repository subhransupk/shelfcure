import 'medicine.dart';

class CartItem {
  final Medicine medicine;
  final double quantity;
  final String unitType; // 'strip' or 'individual'
  final double unitPrice;

  CartItem({
    required this.medicine,
    required this.quantity,
    required this.unitType,
    required this.unitPrice,
  });

  // Calculate total price for this item
  double get totalPrice => quantity * unitPrice;

  // Get unique key for this cart item (medicine + unit type)
  String get uniqueKey => '${medicine.id}_$unitType';

  // Check if this item is for strips
  bool get isStrip => unitType == 'strip';

  // Check if this item is for individual units
  bool get isIndividual => unitType == 'individual';

  // Get available stock for this unit type
  double get availableStock {
    if (isStrip) {
      return medicine.stripInfo?.stock ?? 0;
    } else {
      return medicine.individualInfo?.stock ?? 0;
    }
  }

  // Check if quantity exceeds available stock
  bool get exceedsStock => quantity > availableStock;

  // Create a copy with modified quantity
  CartItem copyWith({double? quantity}) {
    return CartItem(
      medicine: medicine,
      quantity: quantity ?? this.quantity,
      unitType: unitType,
      unitPrice: unitPrice,
    );
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      medicine: Medicine.fromJson(json['medicine']),
      quantity: (json['quantity'] ?? 0).toDouble(),
      unitType: json['unitType'] ?? 'strip',
      unitPrice: (json['unitPrice'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'medicine': medicine.toJson(),
      'quantity': quantity,
      'unitType': unitType,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
    };
  }
}


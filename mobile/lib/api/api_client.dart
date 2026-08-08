import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Telefonda USB ile test ederken `adb reverse tcp:4000 tcp:4000` çalıştırın,
// böylece localhost bilgisayarınızdaki backend'e yönlenir. Wi-Fi ile test
// ederken bu adresi bilgisayarınızın yerel ağ IP'siyle değiştirin
// (ör. "http://192.168.1.20:4000/api").
const String apiBaseUrl = 'http://localhost:4000/api';

const String _tokenKey = 'sultansu_courier_token';

class AuthUser {
  final String id;
  final String name;
  final String phone;
  final String role;

  AuthUser({required this.id, required this.name, required this.phone, required this.role});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String,
        role: json['role'] as String,
      );
}

class ProductRef {
  final String id;
  final String name;
  final String unit;

  ProductRef({required this.id, required this.name, required this.unit});

  factory ProductRef.fromJson(Map<String, dynamic> json) => ProductRef(
        id: json['id'] as String,
        name: json['name'] as String,
        unit: json['unit'] as String? ?? '',
      );
}

class AssignmentItemView {
  final String id;
  final ProductRef product;
  final int quantityAssigned;
  final int quantitySold;
  final int quantityRemaining;
  final int? quantityReturned;

  AssignmentItemView({
    required this.id,
    required this.product,
    required this.quantityAssigned,
    required this.quantitySold,
    required this.quantityRemaining,
    required this.quantityReturned,
  });

  factory AssignmentItemView.fromJson(Map<String, dynamic> json) => AssignmentItemView(
        id: json['id'] as String,
        product: ProductRef.fromJson(json['product'] as Map<String, dynamic>),
        quantityAssigned: json['quantityAssigned'] as int,
        quantitySold: json['quantitySold'] as int,
        quantityRemaining: json['quantityRemaining'] as int,
        quantityReturned: json['quantityReturned'] as int?,
      );
}

class SaleView {
  final String id;
  final ProductRef product;
  final int quantity;
  final double unitPrice;
  final double total;
  final String createdAt;

  SaleView({
    required this.id,
    required this.product,
    required this.quantity,
    required this.unitPrice,
    required this.total,
    required this.createdAt,
  });

  factory SaleView.fromJson(Map<String, dynamic> json) => SaleView(
        id: json['id'] as String,
        product: ProductRef.fromJson(json['product'] as Map<String, dynamic>),
        quantity: json['quantity'] as int,
        unitPrice: (json['unitPrice'] as num).toDouble(),
        total: (json['total'] as num).toDouble(),
        createdAt: json['createdAt'] as String,
      );
}

class CourierRef {
  final String id;
  final String name;
  final String phone;

  CourierRef({required this.id, required this.name, required this.phone});

  factory CourierRef.fromJson(Map<String, dynamic> json) => CourierRef(
        id: json['id'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String,
      );
}

class AssignmentView {
  final String id;
  final String status;
  final String createdAt;
  final String? closedAt;
  final CourierRef courier;
  final List<AssignmentItemView> items;
  final List<SaleView> sales;
  final double totalSalesAmount;

  AssignmentView({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.closedAt,
    required this.courier,
    required this.items,
    required this.sales,
    required this.totalSalesAmount,
  });

  factory AssignmentView.fromJson(Map<String, dynamic> json) => AssignmentView(
        id: json['id'] as String,
        status: json['status'] as String,
        createdAt: json['createdAt'] as String,
        closedAt: json['closedAt'] as String?,
        courier: CourierRef.fromJson(json['courier'] as Map<String, dynamic>),
        items: (json['items'] as List)
            .map((e) => AssignmentItemView.fromJson(e as Map<String, dynamic>))
            .toList(),
        sales: (json['sales'] as List).map((e) => SaleView.fromJson(e as Map<String, dynamic>)).toList(),
        totalSalesAmount: (json['totalSalesAmount'] as num).toDouble(),
      );
}

class ApiException implements Exception {
  final String message;
  final int status;
  ApiException(this.message, this.status);

  @override
  String toString() => message;
}

Future<String?> getToken() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString(_tokenKey);
}

Future<void> setToken(String? token) async {
  final prefs = await SharedPreferences.getInstance();
  if (token == null) {
    await prefs.remove(_tokenKey);
  } else {
    await prefs.setString(_tokenKey, token);
  }
}

class ApiClient {
  Future<T> _request<T>(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    required T Function(dynamic json) parse,
  }) async {
    final token = await getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    final uri = Uri.parse('$apiBaseUrl$path');
    final http.Response res;
    switch (method) {
      case 'POST':
        res = await http.post(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      default:
        res = await http.get(uri, headers: headers);
    }

    final isJson = res.headers['content-type']?.contains('application/json') ?? false;
    final dynamic decoded = isJson && res.body.isNotEmpty ? jsonDecode(res.body) : null;

    if (res.statusCode < 200 || res.statusCode >= 300) {
      final message =
          decoded is Map && decoded['error'] is String ? decoded['error'] as String : 'İstek başarısız (${res.statusCode})';
      throw ApiException(message, res.statusCode);
    }

    return parse(decoded);
  }

  Future<({String token, AuthUser user})> login(String phone, String password) {
    return _request(
      '/auth/login',
      method: 'POST',
      body: {'phone': phone, 'password': password},
      parse: (json) => (
        token: json['token'] as String,
        user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      ),
    );
  }

  Future<AuthUser> me() {
    return _request('/auth/me', parse: (json) => AuthUser.fromJson(json as Map<String, dynamic>));
  }

  Future<AssignmentView> activeAssignment() {
    return _request('/assignments/active', parse: (json) => AssignmentView.fromJson(json as Map<String, dynamic>));
  }

  Future<AssignmentView> addSale(String assignmentId, String productId, int quantity) {
    return _request(
      '/assignments/$assignmentId/sales',
      method: 'POST',
      body: {'productId': productId, 'quantity': quantity},
      parse: (json) => AssignmentView.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<AssignmentView> closeAssignment(String assignmentId) {
    return _request(
      '/assignments/$assignmentId/close',
      method: 'POST',
      parse: (json) => AssignmentView.fromJson(json as Map<String, dynamic>),
    );
  }
}

final api = ApiClient();

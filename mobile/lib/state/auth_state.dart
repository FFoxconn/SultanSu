import 'package:flutter/foundation.dart';

import '../api/api_client.dart';

class AuthState extends ChangeNotifier {
  AuthUser? user;
  bool loading = true;

  Future<void> bootstrap() async {
    final token = await getToken();
    if (token == null) {
      loading = false;
      notifyListeners();
      return;
    }
    try {
      user = await api.me();
    } catch (_) {
      await setToken(null);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String phone, String password) async {
    final result = await api.login(phone, password);
    await setToken(result.token);
    user = result.user;
    notifyListeners();
  }

  void logout() {
    setToken(null);
    user = null;
    notifyListeners();
  }
}

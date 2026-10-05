import 'package:flutter/foundation.dart';

import '../data/app_services.dart';
import '../models/models.dart';

/// Estado de sesión (equivale a AuthContext.tsx del frontend Next.js).
class AuthController extends ChangeNotifier {
  AuthController(this._services);

  final AppServices _services;

  AppUser? _user;
  bool _loading = true;

  AppUser? get user => _user;

  /// true mientras se comprueba si hay una sesión activa al arrancar.
  bool get loading => _loading;

  bool get isLoggedIn => _user != null;

  Future<void> init() async {
    try {
      _user = await _services.me();
    } catch (_) {
      // Sin sesión (401) o backend caído: se trata como invitado.
      _user = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login({required String email, required String password}) async {
    _user = await _services.login(email: email, password: password);
    notifyListeners();
  }

  /// El registro no abre sesión; se inicia sesión automáticamente.
  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    await _services.register(name: name, email: email, phone: phone, password: password);
    await login(email: email, password: password);
  }

  Future<void> logout() async {
    try {
      await _services.logout();
    } finally {
      _user = null;
      notifyListeners();
    }
  }

  void setUser(AppUser user) {
    _user = user;
    notifyListeners();
  }
}

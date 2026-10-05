import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../config/env.dart';

/// Error devuelto por la API con el formato {"error": {"code", "message"}}.
class ApiException implements Exception {
  const ApiException(this.message, {this.status, this.code});

  final String message;
  final int? status;
  final String? code;

  @override
  String toString() => message;
}

/// Cliente HTTP único. La sesión va por cookie httpOnly (session_token):
/// en web el navegador la gestiona solo; en móvil se guarda en memoria.
class ApiClient {
  ApiClient({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Crea el cliente con la sesión lista. En Android/iOS las cookies se guardan en disco,
  /// así la sesión sigue activa al cerrar y volver a abrir la app. En web las gestiona el navegador.
  static Future<ApiClient> create() async {
    final dio = Dio(
      BaseOptions(
        // La barra final hace que las rutas relativas ("auth/me") se anexen a /api.
        baseUrl: '${Env.apiBaseUrl}/',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
      ),
    );
    if (!kIsWeb) {
      final dir = await getApplicationSupportDirectory();
      dio.interceptors.add(
        CookieManager(PersistCookieJar(storage: FileStorage('${dir.path}/cookies/'))),
      );
    }
    return ApiClient(dio: dio);
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path, {Object? body}) => _send('POST', path, body: body);

  Future<dynamic> patch(String path, {Object? body}) => _send('PATCH', path, body: body);

  Future<dynamic> put(String path, {Object? body}) => _send('PUT', path, body: body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: body,
        queryParameters: query,
        options: Options(method: method),
      );
      return response.data;
    } on DioException catch (e) {
      throw _toException(e);
    }
  }

  ApiException _toException(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    String? message;
    String? code;
    if (data is Map && data['error'] is Map) {
      final error = data['error'] as Map;
      message = error['message'] as String?;
      code = error['code'] as String?;
    }
    final fallback = status == null
        ? 'No hay conexión con el servidor.'
        : 'Error HTTP $status';
    return ApiException(message ?? fallback, status: status, code: code);
  }
}

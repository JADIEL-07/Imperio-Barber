import '../core/api_client.dart';
import '../models/models.dart';

/// Acceso a todos los endpoints de la API (auth, catalog y booking).
/// Equivale a web/src/lib/api/*.ts del frontend Next.js.
class AppServices {
  AppServices({required ApiClient client}) : _client = client;

  final ApiClient _client;

  Map<String, dynamic> _map(Object? v) => v as Map<String, dynamic>;

  List<Map<String, dynamic>> _maps(Object? v) => (v as List).cast<Map<String, dynamic>>();

  // ---------------------------------------------------------------- Auth

  Future<AppUser> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final res = await _client.post('auth/register', body: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    });
    return AppUser.fromJson(_map(res));
  }

  Future<AppUser> login({required String email, required String password}) async {
    final res = await _client.post('auth/login', body: {'email': email, 'password': password});
    return AppUser.fromJson(_map(res));
  }

  Future<void> logout() async {
    await _client.post('auth/logout');
  }

  Future<AppUser> me() async => AppUser.fromJson(_map(await _client.get('auth/me')));

  Future<AppUser> updateMe({String? name, String? phone, String? password}) async {
    final res = await _client.patch('auth/me', body: {
      if (name != null) 'name': name,
      if (phone != null) 'phone': phone,
      if (password != null) 'password': password,
    });
    return AppUser.fromJson(_map(res));
  }

  Future<Page<AppUser>> listUsers({
    String? role,
    String? search,
    int page = 1,
    int pageSize = 10,
  }) async {
    final res = await _client.get('auth/users', query: {
      'page': page,
      'page_size': pageSize,
      if (role != null && role.isNotEmpty) 'role': role,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return Page.fromJson(_map(res), AppUser.fromJson);
  }

  Future<AppUser> createUser({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String role,
  }) async {
    final res = await _client.post('auth/users', body: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'role': role,
    });
    return AppUser.fromJson(_map(res));
  }

  Future<AppUser> updateUser(String id, Map<String, dynamic> body) async =>
      AppUser.fromJson(_map(await _client.patch('auth/users/$id', body: body)));

  // ------------------------------------------------------------- Catalog

  Future<List<Service>> services({bool all = false}) async {
    final res = await _client.get('catalog/services', query: all ? {'all': true} : null);
    return _maps(res).map(Service.fromJson).toList();
  }

  Future<Service> createService(Map<String, dynamic> body) async =>
      Service.fromJson(_map(await _client.post('catalog/services', body: body)));

  Future<Service> updateService(String id, Map<String, dynamic> body) async =>
      Service.fromJson(_map(await _client.patch('catalog/services/$id', body: body)));

  Future<List<Combo>> combos({bool all = false}) async {
    final res = await _client.get('catalog/combos', query: all ? {'all': true} : null);
    return _maps(res).map(Combo.fromJson).toList();
  }

  Future<Combo> createCombo(Map<String, dynamic> body) async =>
      Combo.fromJson(_map(await _client.post('catalog/combos', body: body)));

  Future<Combo> updateCombo(String id, Map<String, dynamic> body) async =>
      Combo.fromJson(_map(await _client.patch('catalog/combos/$id', body: body)));

  // ------------------------------------------------------------- Booking

  Future<List<Barber>> barbers() async =>
      _maps(await _client.get('bookings/barbers')).map(Barber.fromJson).toList();

  Future<Barber> updateBarber(String id, Map<String, dynamic> body) async =>
      Barber.fromJson(_map(await _client.patch('bookings/barbers/$id', body: body)));

  Future<List<Slot>> availability({
    required String date,
    String? barberId,
    List<String>? serviceIds,
    String? comboId,
    int durationMinutes = 45,
  }) async {
    final res = await _client.get('bookings/availability', query: {
      'date': date,
      'duration_minutes': durationMinutes,
      if (barberId != null) 'barber_id': barberId,
      if (serviceIds != null && serviceIds.isNotEmpty) 'service_ids': serviceIds.join(','),
      if (comboId != null) 'combo_id': comboId,
    });
    final slots = _map(res)['slots'];
    return _maps(slots).map(Slot.fromJson).toList();
  }

  Future<Appointment> createAppointment({
    String? barberId,
    required String start,
    List<String>? serviceIds,
    String? comboId,
  }) async {
    final res = await _client.post('bookings/appointments', body: {
      if (barberId != null) 'barber_id': barberId,
      'start': start,
      if (serviceIds != null) 'service_ids': serviceIds,
      if (comboId != null) 'combo_id': comboId,
    });
    return Appointment.fromJson(_map(res));
  }

  Future<Page<Appointment>> appointments({
    String scope = 'mine',
    String? status,
    String? from,
    String? to,
    int page = 1,
    int pageSize = 20,
  }) async {
    final res = await _client.get('bookings/appointments', query: {
      'scope': scope,
      'page': page,
      'page_size': pageSize,
      if (status != null && status.isNotEmpty) 'status': status,
      if (from != null) 'from': from,
      if (to != null) 'to': to,
    });
    return Page.fromJson(_map(res), Appointment.fromJson);
  }

  Future<Appointment> updateAppointment(String id, {String? status, String? start}) async {
    final res = await _client.patch('bookings/appointments/$id', body: {
      if (status != null) 'status': status,
      if (start != null) 'start': start,
    });
    return Appointment.fromJson(_map(res));
  }

  Future<Appointment> checkIn(String id) async =>
      Appointment.fromJson(_map(await _client.post('bookings/appointments/$id/check-in')));

  Future<List<Schedule>> schedule(String barberId) async =>
      _maps(await _client.get('bookings/barbers/$barberId/schedule')).map(Schedule.fromJson).toList();

  Future<void> saveSchedule(String barberId, List<Schedule> items) async {
    await _client.put(
      'bookings/barbers/$barberId/schedule',
      body: items.map((s) => s.toJson()).toList(),
    );
  }

  Future<List<TimeOff>> timeOffs(String barberId) async =>
      _maps(await _client.get('bookings/barbers/$barberId/time-off')).map(TimeOff.fromJson).toList();

  Future<TimeOff> addTimeOff(
    String barberId, {
    required String from,
    required String to,
    required String reason,
  }) async {
    final res = await _client.post('bookings/barbers/$barberId/time-off', body: {
      'from': from,
      'to': to,
      'reason': reason,
    });
    return TimeOff.fromJson(_map(res));
  }

  Future<void> deleteTimeOff(String barberId, String timeOffId) async {
    await _client.delete('bookings/barbers/$barberId/time-off/$timeOffId');
  }

  Future<CommissionSummary> commissions(String barberId) async =>
      CommissionSummary.fromJson(_map(await _client.get('bookings/barbers/$barberId/commissions')));

  Future<void> payCommissions(String barberId) async {
    await _client.post('bookings/barbers/$barberId/commissions/payout');
  }

  Future<BookingSettings> settings() async =>
      BookingSettings.fromJson(_map(await _client.get('bookings/settings')));

  Future<BookingSettings> saveSettings(BookingSettings value) async =>
      BookingSettings.fromJson(_map(await _client.put('bookings/settings', body: value.toJson())));

  Future<Stats> stats() async => Stats.fromJson(_map(await _client.get('bookings/stats')));
}

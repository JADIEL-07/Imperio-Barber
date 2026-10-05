import '../core/api_client.dart';
import '../models/models.dart';

/// Acceso a todos los endpoints de la API (auth, catalog y booking).
/// Equivale a web/src/lib/api/*.ts del frontend Next.js.
class AppServices {
  AppServices({required this.client});

  final ApiClient client;

  Map<String, dynamic> _map(Object? v) => v as Map<String, dynamic>;

  List<Map<String, dynamic>> _maps(Object? v) => (v as List).cast<Map<String, dynamic>>();

  // ---------------------------------------------------------------- Auth

  Future<AppUser> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final res = await client.post('auth/register', body: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    });
    return AppUser.fromJson(_map(res));
  }

  Future<AppUser> login({required String email, required String password}) async {
    final res = await client.post('auth/login', body: {'email': email, 'password': password});
    return AppUser.fromJson(_map(res));
  }

  Future<void> logout() async {
    await client.post('auth/logout');
  }

  Future<AppUser> me() async => AppUser.fromJson(_map(await client.get('auth/me')));

  Future<AppUser> updateMe({String? name, String? phone, String? password}) async {
    final res = await client.patch('auth/me', body: {
      'name': ?name,
      'phone': ?phone,
      'password': ?password,
    });
    return AppUser.fromJson(_map(res));
  }

  Future<PageResponse<AppUser>> listUsers({
    String? role,
    String? search,
    int page = 1,
    int pageSize = 10,
  }) async {
    final res = await client.get('auth/users', query: {
      'page': page,
      'page_size': pageSize,
      if (role != null && role.isNotEmpty) 'role': role,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return PageResponse.fromJson(_map(res), AppUser.fromJson);
  }

  Future<AppUser> createUser({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String role,
  }) async {
    final res = await client.post('auth/users', body: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'role': role,
    });
    return AppUser.fromJson(_map(res));
  }

  Future<AppUser> updateUser(String id, Map<String, dynamic> body) async =>
      AppUser.fromJson(_map(await client.patch('auth/users/$id', body: body)));

  // ------------------------------------------------------------- Catalog

  Future<List<Service>> services({bool all = false}) async {
    final res = await client.get('catalog/services', query: all ? {'all': true} : null);
    return _maps(res).map(Service.fromJson).toList();
  }

  Future<Service> createService(Map<String, dynamic> body) async =>
      Service.fromJson(_map(await client.post('catalog/services', body: body)));

  Future<Service> updateService(String id, Map<String, dynamic> body) async =>
      Service.fromJson(_map(await client.patch('catalog/services/$id', body: body)));

  Future<List<Combo>> combos({bool all = false}) async {
    final res = await client.get('catalog/combos', query: all ? {'all': true} : null);
    return _maps(res).map(Combo.fromJson).toList();
  }

  Future<Combo> createCombo(Map<String, dynamic> body) async =>
      Combo.fromJson(_map(await client.post('catalog/combos', body: body)));

  Future<Combo> updateCombo(String id, Map<String, dynamic> body) async =>
      Combo.fromJson(_map(await client.patch('catalog/combos/$id', body: body)));

  // ------------------------------------------------------------- Booking

  Future<List<Barber>> barbers() async =>
      _maps(await client.get('bookings/barbers')).map(Barber.fromJson).toList();

  Future<Barber> updateBarber(String id, Map<String, dynamic> body) async =>
      Barber.fromJson(_map(await client.patch('bookings/barbers/$id', body: body)));

  Future<List<Slot>> availability({
    required String date,
    String? barberId,
    List<String>? serviceIds,
    String? comboId,
    int durationMinutes = 45,
  }) async {
    final res = await client.get('bookings/availability', query: {
      'date': date,
      'duration_minutes': durationMinutes,
      'barber_id': ?barberId,
      if (serviceIds != null && serviceIds.isNotEmpty) 'service_ids': serviceIds.join(','),
      'combo_id': ?comboId,
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
    final res = await client.post('bookings/appointments', body: {
      'barber_id': ?barberId,
      'start': start,
      'service_ids': ?serviceIds,
      'combo_id': ?comboId,
    });
    return Appointment.fromJson(_map(res));
  }

  Future<PageResponse<Appointment>> appointments({
    String scope = 'mine',
    String? status,
    String? from,
    String? to,
    int page = 1,
    int pageSize = 20,
  }) async {
    final res = await client.get('bookings/appointments', query: {
      'scope': scope,
      'page': page,
      'page_size': pageSize,
      if (status != null && status.isNotEmpty) 'status': status,
      'from': ?from,
      'to': ?to,
    });
    return PageResponse.fromJson(_map(res), Appointment.fromJson);
  }

  Future<Appointment> updateAppointment(String id, {String? status, String? start}) async {
    final res = await client.patch('bookings/appointments/$id', body: {
      'status': ?status,
      'start': ?start,
    });
    return Appointment.fromJson(_map(res));
  }

  Future<Appointment> checkIn(String id) async =>
      Appointment.fromJson(_map(await client.post('bookings/appointments/$id/check-in')));

  Future<List<Schedule>> schedule(String barberId) async =>
      _maps(await client.get('bookings/barbers/$barberId/schedule')).map(Schedule.fromJson).toList();

  Future<void> saveSchedule(String barberId, List<Schedule> items) async {
    await client.put(
      'bookings/barbers/$barberId/schedule',
      body: items.map((s) => s.toJson()).toList(),
    );
  }

  Future<List<TimeOff>> timeOffs(String barberId) async =>
      _maps(await client.get('bookings/barbers/$barberId/time-off')).map(TimeOff.fromJson).toList();

  Future<TimeOff> addTimeOff(
    String barberId, {
    required String from,
    required String to,
    required String reason,
  }) async {
    final res = await client.post('bookings/barbers/$barberId/time-off', body: {
      'from': from,
      'to': to,
      'reason': reason,
    });
    return TimeOff.fromJson(_map(res));
  }

  Future<void> deleteTimeOff(String barberId, String timeOffId) async {
    await client.delete('bookings/barbers/$barberId/time-off/$timeOffId');
  }

  Future<CommissionSummary> commissions(String barberId) async =>
      CommissionSummary.fromJson(_map(await client.get('bookings/barbers/$barberId/commissions')));

  Future<void> payCommissions(String barberId) async {
    await client.post('bookings/barbers/$barberId/commissions/payout');
  }

  Future<BookingSettings> settings() async =>
      BookingSettings.fromJson(_map(await client.get('bookings/settings')));

  Future<BookingSettings> saveSettings(BookingSettings value) async =>
      BookingSettings.fromJson(_map(await client.put('bookings/settings', body: value.toJson())));

  Future<Stats> stats() async => Stats.fromJson(_map(await client.get('bookings/stats')));
}

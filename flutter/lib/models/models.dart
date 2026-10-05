// Modelos que reflejan docs/api-contract.md (snake_case del backend -> camelCase en Dart).

double _num(Object? v) => (v as num?)?.toDouble() ?? 0;

int _int(Object? v) => (v as num?)?.toInt() ?? 0;

String _str(Object? v) => v as String? ?? '';

List<T> _list<T>(Object? v, T Function(Map<String, dynamic>) fromJson) =>
    ((v as List?) ?? const []).map((e) => fromJson(e as Map<String, dynamic>)).toList();

class PageResponse<T> {
  const PageResponse({required this.items, required this.total, required this.page, required this.pageSize});

  factory PageResponse.fromJson(Map<String, dynamic> j, T Function(Map<String, dynamic>) fromJson) => PageResponse(
        items: _list(j['items'], fromJson),
        total: _int(j['total']),
        page: _int(j['page']),
        pageSize: _int(j['page_size']),
      );

  final List<T> items;
  final int total;
  final int page;
  final int pageSize;
}

class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.isActive,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: _str(j['id']),
        name: _str(j['name']),
        email: _str(j['email']),
        phone: _str(j['phone']),
        role: _str(j['role']),
        isActive: j['is_active'] as bool? ?? true,
      );

  final String id;
  final String name;
  final String email;
  final String phone;
  final String role; // admin | employee | client
  final bool isActive;

  String get initial => name.isEmpty ? 'U' : name[0].toUpperCase();
}

class Service {
  const Service({
    required this.id,
    required this.name,
    required this.description,
    required this.durationMinutes,
    required this.price,
    this.imageUrl,
    this.isActive = true,
  });

  factory Service.fromJson(Map<String, dynamic> j) => Service(
        id: _str(j['id']),
        name: _str(j['name']),
        description: _str(j['description']),
        durationMinutes: _int(j['duration_minutes']),
        price: _int(j['price']),
        imageUrl: j['image_url'] as String?,
        isActive: j['is_active'] as bool? ?? true,
      );

  final String id;
  final String name;
  final String description;
  final int durationMinutes;
  final int price;
  final String? imageUrl;
  final bool isActive;
}

class Combo {
  const Combo({
    required this.id,
    required this.name,
    required this.description,
    required this.services,
    required this.price,
    required this.durationMinutes,
    required this.savings,
    this.imageUrl,
    this.isActive = true,
  });

  factory Combo.fromJson(Map<String, dynamic> j) => Combo(
        id: _str(j['id']),
        name: _str(j['name']),
        description: _str(j['description']),
        services: _list(j['services'], Service.fromJson),
        price: _int(j['price']),
        durationMinutes: _int(j['duration_minutes']),
        savings: _int(j['savings']),
        imageUrl: j['image_url'] as String?,
        isActive: j['is_active'] as bool? ?? true,
      );

  final String id;
  final String name;
  final String description;
  final List<Service> services;
  final int price;
  final int durationMinutes;
  final int savings;
  final String? imageUrl;
  final bool isActive;
}

class Barber {
  const Barber({
    required this.id,
    required this.name,
    this.phone = '',
    this.isActive = true,
    this.commissionRate = 0,
    this.imageUrl,
    this.services = const [],
  });

  factory Barber.fromJson(Map<String, dynamic> j) => Barber(
        id: _str(j['id']),
        name: _str(j['name']),
        phone: _str(j['phone']),
        isActive: j['is_active'] as bool? ?? true,
        commissionRate: _num(j['commission_rate']),
        imageUrl: j['avatar_url'] as String?,
        services: _list(j['services'], Service.fromJson),
      );

  final String id;
  final String name;
  final String phone;
  final bool isActive;
  final double commissionRate; // 0.0 - 1.0
  final String? imageUrl;
  final List<Service> services;
}

class Slot {
  const Slot({required this.start, required this.end, required this.barberId});

  factory Slot.fromJson(Map<String, dynamic> j) => Slot(
        start: _str(j['start']),
        end: _str(j['end']),
        barberId: _str(j['barber_id']),
      );

  final String start; // ISO 8601 tal como lo envía el backend
  final String end;
  final String barberId;
}

class AppointmentItem {
  const AppointmentItem({required this.name, required this.durationMinutes, required this.price});

  factory AppointmentItem.fromJson(Map<String, dynamic> j) => AppointmentItem(
        name: _str(j['name']),
        durationMinutes: _int(j['duration_minutes']),
        price: _int(j['price']),
      );

  final String name;
  final int durationMinutes;
  final int price;
}

class Appointment {
  const Appointment({
    required this.id,
    required this.clientId,
    required this.clientName,
    required this.clientPhone,
    required this.barberId,
    required this.barberName,
    required this.items,
    required this.start,
    required this.end,
    required this.totalPrice,
    required this.status,
    required this.canCancel,
    this.checkedInAt,
    this.commissionAmount,
    this.commissionPaid = false,
  });

  factory Appointment.fromJson(Map<String, dynamic> j) {
    final client = j['client'] as Map<String, dynamic>;
    final barber = j['barber'] as Map<String, dynamic>;
    return Appointment(
      id: _str(j['id']),
      clientId: _str(client['id']),
      clientName: _str(client['name']),
      clientPhone: _str(client['phone']),
      barberId: _str(barber['id']),
      barberName: _str(barber['name']),
      items: _list(j['items'], AppointmentItem.fromJson),
      start: _str(j['start']),
      end: _str(j['end']),
      totalPrice: _int(j['total_price']),
      status: _str(j['status']),
      canCancel: j['can_cancel'] as bool? ?? false,
      checkedInAt: j['checked_in_at'] as String?,
      commissionAmount: (j['commission_amount'] as num?)?.toInt(),
      commissionPaid: j['commission_paid'] as bool? ?? false,
    );
  }

  final String id;
  final String clientId;
  final String clientName;
  final String clientPhone;
  final String barberId;
  final String barberName;
  final List<AppointmentItem> items;
  final String start;
  final String end;
  final int totalPrice;
  final String status;
  final bool canCancel;
  final String? checkedInAt;
  final int? commissionAmount;
  final bool commissionPaid;

  String get title => items.map((i) => i.name).join(' + ');

  bool get isOpen => status == 'pending' || status == 'confirmed';

  bool get canCheckIn => isOpen && checkedInAt == null;
}

class Schedule {
  const Schedule({required this.weekday, required this.start, required this.end});

  factory Schedule.fromJson(Map<String, dynamic> j) => Schedule(
        weekday: _int(j['weekday']),
        start: _str(j['start']),
        end: _str(j['end']),
      );

  final int weekday; // 0 = lunes
  final String start; // HH:MM
  final String end;

  Map<String, dynamic> toJson() => {'weekday': weekday, 'start': start, 'end': end};
}

class TimeOff {
  const TimeOff({required this.id, required this.from, required this.to, required this.reason});

  factory TimeOff.fromJson(Map<String, dynamic> j) => TimeOff(
        id: _str(j['id']),
        from: _str(j['from']),
        to: _str(j['to']),
        reason: _str(j['reason']),
      );

  final String id;
  final String from;
  final String to;
  final String reason;
}

class CommissionSummary {
  const CommissionSummary({
    required this.barberName,
    required this.rate,
    required this.pendingAmount,
    required this.pendingCount,
    required this.paidAmount,
  });

  factory CommissionSummary.fromJson(Map<String, dynamic> j) => CommissionSummary(
        barberName: _str(j['barber_name']),
        rate: _num(j['commission_rate']),
        pendingAmount: _int(j['pending_amount']),
        pendingCount: _int(j['pending_count']),
        paidAmount: _int(j['paid_amount']),
      );

  final String barberName;
  final double rate;
  final int pendingAmount;
  final int pendingCount;
  final int paidAmount;
}

class DayHours {
  const DayHours({required this.open, required this.close});

  factory DayHours.fromJson(Map<String, dynamic> j) =>
      DayHours(open: _str(j['open']), close: _str(j['close']));

  final String open;
  final String close;

  DayHours copyWith({String? open, String? close}) =>
      DayHours(open: open ?? this.open, close: close ?? this.close);

  Map<String, dynamic> toJson() => {'open': open, 'close': close};
}

class BookingSettings {
  const BookingSettings({
    required this.openingHours,
    required this.cancelMinHours,
    required this.slotMinutes,
  });

  factory BookingSettings.fromJson(Map<String, dynamic> j) {
    final raw = (j['opening_hours'] as Map<String, dynamic>?) ?? const {};
    return BookingSettings(
      openingHours: raw.map((k, v) => MapEntry(k, DayHours.fromJson(v as Map<String, dynamic>))),
      cancelMinHours: _int(j['cancel_min_hours']),
      slotMinutes: _int(j['slot_minutes']),
    );
  }

  final Map<String, DayHours> openingHours; // clave "0".."6"
  final int cancelMinHours;
  final int slotMinutes;

  Map<String, dynamic> toJson() => {
        'opening_hours': openingHours.map((k, v) => MapEntry(k, v.toJson())),
        'cancel_min_hours': cancelMinHours,
        'slot_minutes': slotMinutes,
      };
}

class NamedValue {
  const NamedValue({required this.name, required this.value});

  factory NamedValue.fromJson(Map<String, dynamic> j, String valueKey) =>
      NamedValue(name: _str(j['name']), value: _int(j[valueKey]));

  final String name;
  final int value;
}

class DatedValue {
  const DatedValue({required this.date, required this.total});

  factory DatedValue.fromJson(Map<String, dynamic> j) =>
      DatedValue(date: _str(j['date']), total: _int(j['total']));

  final String date; // YYYY-MM-DD
  final int total;
}

class Stats {
  const Stats({
    required this.todayAppointments,
    required this.statusCounts,
    required this.monthRevenue,
    required this.topServices,
    required this.revenueByService,
    required this.revenueByDay,
    required this.totalCommissionsPaid,
  });

  factory Stats.fromJson(Map<String, dynamic> j) => Stats(
        todayAppointments: _int(j['today_appointments']),
        statusCounts: ((j['status_counts'] as Map<String, dynamic>?) ?? const {})
            .map((k, v) => MapEntry(k, _int(v))),
        monthRevenue: _int(j['month_revenue']),
        topServices: _list(j['top_services'], (m) => NamedValue.fromJson(m, 'count')),
        revenueByService: _list(j['revenue_by_service'], (m) => NamedValue.fromJson(m, 'total')),
        revenueByDay: _list(j['revenue_by_day'], DatedValue.fromJson),
        totalCommissionsPaid: _int(j['total_commissions_paid']),
      );

  final int todayAppointments;
  final Map<String, int> statusCounts;
  final int monthRevenue;
  final List<NamedValue> topServices;
  final List<NamedValue> revenueByService;
  final List<DatedValue> revenueByDay;
  final int totalCommissionsPaid;
}

import 'package:intl/intl.dart';

/// Todas las fechas del negocio son America/Bogota (UTC-5, sin horario de verano).
const Duration _bogotaOffset = Duration(hours: 5);

/// Convierte un ISO 8601 del backend (ej. 2026-10-24T11:15:00-05:00) a hora de pared de Bogotá.
DateTime toBogota(String iso) => DateTime.parse(iso).toUtc().subtract(_bogotaOffset);

/// Fecha de hoy en Bogotá, solo con año/mes/día.
DateTime bogotaToday() {
  final now = toBogotaNow();
  return DateTime(now.year, now.month, now.day);
}

DateTime toBogotaNow() => DateTime.now().toUtc().subtract(_bogotaOffset);

/// Fecha en formato YYYY-MM-DD, la que espera la API en query params.
String isoDate(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

final NumberFormat _cop = NumberFormat.currency(locale: 'es_CO', symbol: r'$', decimalDigits: 0);

String formatCop(num value) => _cop.format(value);

String formatPercent(double rate) => '${(rate * 100).round()}%';

String fmtDate(DateTime d) => DateFormat('dd MMM yyyy', 'es_CO').format(d);

String fmtDateLong(DateTime d) => DateFormat("dd 'de' MMMM 'de' yyyy", 'es_CO').format(d);

String fmtTime(DateTime d) => DateFormat('h:mm a', 'es_CO').format(d);

String fmtDay(DateTime d) => DateFormat('dd').format(d);

String fmtMonth(DateTime d) =>
    DateFormat('MMM', 'es_CO').format(d).replaceAll('.', '').toUpperCase();

String fmtTimeRange(DateTime start, DateTime end) => '${fmtTime(start)} - ${fmtTime(end)}';

String shortId(String id) => (id.length >= 8 ? id.substring(0, 8) : id).toUpperCase();

const Map<String, String> _statusLabels = {
  'pending': 'Pendiente',
  'confirmed': 'Confirmada',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
  'no_show': 'No asistió',
};

String statusLabel(String status) => _statusLabels[status] ?? status;

const List<String> weekdayLabels = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

String weekdayLabel(int weekday) => weekdayLabels[weekday];

const Map<String, String> roleLabels = {
  'admin': 'Administrador',
  'employee': 'Empleado',
  'client': 'Cliente',
};

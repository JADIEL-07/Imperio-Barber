import 'package:flutter_test/flutter_test.dart';
import 'package:imperio_barber/core/format.dart';
import 'package:imperio_barber/models/models.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('es_CO');
  });

  group('formato', () {
    test('formatCop usa separador de miles colombiano y símbolo de peso', () {
      final text = formatCop(75000);
      expect(text, contains('75.000'));
      expect(text, contains(r'$'));
    });

    test('statusLabel y weekdayLabel traducen los valores de la API', () {
      expect(statusLabel('no_show'), 'No asistió');
      expect(statusLabel('confirmed'), 'Confirmada');
      expect(weekdayLabel(0), 'Lunes');
      expect(weekdayLabel(6), 'Domingo');
    });

    test('shortId toma los 8 primeros caracteres en mayúsculas', () {
      expect(shortId('abcdef0123456789'), 'ABCDEF01');
    });
  });

  group('zona horaria Bogotá (UTC-5)', () {
    test('toBogota convierte 16:15 UTC en 11:15 en Bogotá', () {
      final d = toBogota('2026-10-24T16:15:00+00:00');
      expect(d.hour, 11);
      expect(d.minute, 15);
    });

    test('toBogota respeta el offset -05:00 del backend', () {
      final d = toBogota('2026-10-24T11:15:00-05:00');
      expect(d.hour, 11);
      expect(d.day, 24);
    });

    test('isoDate devuelve YYYY-MM-DD', () {
      expect(isoDate(DateTime(2026, 10, 5)), '2026-10-05');
    });
  });

  group('modelos (contrato de api-contract.md)', () {
    test('Appointment.fromJson lee la estructura anidada', () {
      final appt = Appointment.fromJson({
        'id': 'a1',
        'client': {'id': 'c1', 'name': 'Ana', 'phone': '3001234567'},
        'barber': {'id': 'b1', 'name': 'Carlos'},
        'items': [
          {'name': 'Corte', 'duration_minutes': 45, 'price': 35000},
          {'name': 'Barba', 'duration_minutes': 20, 'price': 20000},
        ],
        'start': '2026-10-24T11:15:00-05:00',
        'end': '2026-10-24T12:20:00-05:00',
        'total_price': 55000,
        'status': 'pending',
        'can_cancel': true,
        'checked_in_at': null,
        'commission_amount': null,
        'commission_paid': false,
      });

      expect(appt.clientName, 'Ana');
      expect(appt.barberName, 'Carlos');
      expect(appt.title, 'Corte + Barba');
      expect(appt.totalPrice, 55000);
      expect(appt.isOpen, isTrue);
      expect(appt.canCheckIn, isTrue);
    });

    test('Appointment cancelada no es abierta ni admite check-in', () {
      final appt = Appointment.fromJson({
        'id': 'a2',
        'client': {'id': 'c1', 'name': 'Ana', 'phone': ''},
        'barber': {'id': 'b1', 'name': 'Carlos'},
        'items': <Map<String, dynamic>>[],
        'start': '2026-10-24T11:15:00-05:00',
        'end': '2026-10-24T12:00:00-05:00',
        'total_price': 0,
        'status': 'cancelled',
        'can_cancel': false,
      });

      expect(appt.isOpen, isFalse);
      expect(appt.canCheckIn, isFalse);
    });

    test('Page.fromJson lee items y paginación', () {
      final page = PageResponse.fromJson(
        {
          'items': [
            {'id': 'u1', 'name': 'Ana', 'email': 'a@x.co', 'phone': '', 'role': 'client', 'is_active': true},
          ],
          'total': 1,
          'page': 1,
          'page_size': 10,
        },
        AppUser.fromJson,
      );

      expect(page.items.single.name, 'Ana');
      expect(page.total, 1);
      expect(page.pageSize, 10);
    });

    test('Combo calcula el ahorro desde el backend', () {
      final combo = Combo.fromJson({
        'id': 'k1',
        'name': 'Ritual',
        'description': '',
        'services': [
          {'id': 's1', 'name': 'Corte', 'description': '', 'duration_minutes': 45, 'price': 35000},
        ],
        'price': 30000,
        'duration_minutes': 45,
        'savings': 5000,
      });

      expect(combo.savings, 5000);
      expect(combo.services.single.name, 'Corte');
    });
  });
}

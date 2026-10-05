import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Reemplazo de window.confirm() del frontend web.
Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirmar',
  bool destructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: destructive ? AppColors.errorContainer : AppColors.primaryContainer,
            foregroundColor: destructive ? AppColors.onErrorContainer : AppColors.onPrimary,
          ),
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// Título + contenido + botones de un diálogo de formulario.
class FormDialog extends StatelessWidget {
  const FormDialog({
    super.key,
    required this.title,
    required this.content,
    required this.actions,
    this.width = 440,
  });

  final String title;
  final Widget content;
  final List<Widget> actions;
  final double width;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Expanded(child: Text(title)),
          IconButton(
            tooltip: 'Cerrar',
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close, size: 18),
          ),
        ],
      ),
      content: SizedBox(
        width: width,
        child: SingleChildScrollView(child: content),
      ),
      actions: actions,
    );
  }
}

import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../models/models.dart';
import '../../ui/widgets.dart';

/// Tarjeta de servicio (ServiceCard en services/page.tsx y home).
class ServiceCard extends StatelessWidget {
  const ServiceCard({
    super.key,
    required this.service,
    this.selected = false,
    this.onTap,
    this.leading,
    this.imageHeight = 120,
  });

  final Service service;
  final bool selected;
  final VoidCallback? onTap;
  final Widget? leading;
  final double imageHeight;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Panel(
      padding: EdgeInsets.zero,
      color: selected ? AppColors.surfaceContainer : AppColors.surfaceLow,
      borderColor: selected ? AppColors.primary.withValues(alpha: 0.5) : AppColors.surfaceHigh,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (service.imageUrl != null) NetworkImageBox(url: service.imageUrl!, height: imageHeight),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (leading != null) ...[leading!, const SizedBox(width: 8)],
                    Expanded(child: Text(service.name, style: textTheme.titleMedium)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  service.description,
                  style: textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.schedule, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text('${service.durationMinutes} min', style: textTheme.labelSmall),
                    const Spacer(),
                    Text(
                      formatCop(service.price),
                      style: textTheme.titleSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Tarjeta de combo (combos/page.tsx y home).
class ComboCard extends StatelessWidget {
  const ComboCard({super.key, required this.combo, this.leading, this.onTap, this.selected = false});

  final Combo combo;
  final Widget? leading;
  final VoidCallback? onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final muted = textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant);

    return Panel(
      padding: EdgeInsets.zero,
      color: selected ? AppColors.surfaceContainer : AppColors.surfaceLow,
      borderColor: selected ? AppColors.primary.withValues(alpha: 0.6) : AppColors.primary.withValues(alpha: 0.3),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (combo.imageUrl != null) NetworkImageBox(url: combo.imageUrl!, height: 150),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (leading != null) ...[leading!, const SizedBox(width: 8)],
                    Expanded(child: Text(combo.name, style: textTheme.titleMedium)),
                    if (combo.savings > 0)
                      Tag('Ahorras ${formatCop(combo.savings)}', color: AppColors.primary.withValues(alpha: 0.2), textColor: AppColors.primary),
                  ],
                ),
                const SizedBox(height: 6),
                Text(combo.description, style: muted),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final s in combo.services)
                      Tag(s.name, color: AppColors.surfaceContainer, textColor: AppColors.onSurfaceVariant),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(color: AppColors.surfaceHigh, height: 1),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.schedule, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text('${combo.durationMinutes} min', style: textTheme.labelSmall),
                    const Spacer(),
                    Text(
                      formatCop(combo.price),
                      style: textTheme.titleSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

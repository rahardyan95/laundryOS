import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../models/catalog.dart";
import "../state/auth_controller.dart";
import "../state/catalog_controller.dart";
import "../state/order_controller.dart";
import "../theme/app_metrics.dart";
import "../theme/app_typography.dart";
import "../widgets/app_scaffold.dart";
import "../widgets/async_section.dart";
import "../widgets/empty_state.dart";
import "../widgets/error_notice.dart";
import "../widgets/section_header.dart";
import "../widgets/surface_card.dart";

/// Formulir satu order. Urutannya mengikuti percakapan di depan meja:
/// siapa pelanggannya, layanan apa, berapa banyak, lalu bayarnya berapa.
/// Total muncul sebagai satu kartu sendiri supaya jadi fokus sebelum menyimpan.
class NewOrderScreen extends StatefulWidget {
  const NewOrderScreen({super.key});

  @override
  State<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends State<NewOrderScreen> {
  final _qty = TextEditingController(text: "1");
  final _paid = TextEditingController(text: "0");
  final _note = TextEditingController();

  String? _customerId;
  String? _serviceId;
  String _paymentMethod = "cash";
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<CatalogController>().load();
    });
  }

  @override
  void dispose() {
    _qty.dispose();
    _paid.dispose();
    _note.dispose();
    super.dispose();
  }

  Service? _selectedService(CatalogController catalog) {
    if (_serviceId == null) return null;
    for (final service in catalog.services) {
      if (service.id == _serviceId) return service;
    }
    return null;
  }

  int _total(CatalogController catalog) {
    final service = _selectedService(catalog);
    final qty = double.tryParse(_qty.text.replaceAll(",", ".")) ?? 0;
    if (service == null) return 0;
    return (qty * service.pricePerUnit).round();
  }

  Future<void> _submit() async {
    final catalog = context.read<CatalogController>();
    final session = context.read<AuthController>().session;
    final total = _total(catalog);
    final paid = int.tryParse(_paid.text) ?? 0;
    final qty = double.tryParse(_qty.text.replaceAll(",", ".")) ?? 0;

    if (session == null) {
      setState(() => _error = "Sesi berakhir. Masuk kembali.");
      return;
    }
    if (_customerId == null) {
      setState(() => _error = "Pilih pelanggan.");
      return;
    }
    if (_serviceId == null || qty <= 0) {
      setState(() => _error = "Pilih layanan dan jumlah yang benar.");
      return;
    }
    if (paid < 0 || paid > total) {
      setState(() => _error = "Nominal dibayar harus antara Rp0 dan total.");
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    final created = await context.read<OrderController>().create(
          outletId: session.outletId,
          customerId: _customerId!,
          items: [(serviceId: _serviceId!, qty: qty)],
          paidAmount: paid,
          paymentMethod: paid > 0 ? _paymentMethod : null,
          note: _note.text.trim().isEmpty ? null : _note.text.trim(),
        );
    if (!mounted) return;
    if (created == null) {
      final message =
          context.read<OrderController>().error ?? "Gagal menyimpan order.";
      setState(() {
        _saving = false;
        _error = message;
      });
      return;
    }
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogController>();
    final total = _total(catalog);
    final catalogEmpty = catalog.customers.isEmpty || catalog.services.isEmpty;

    return AppScaffold(
      title: "Order Baru",
      showLogout: false,
      body: ListView(
        padding: AppSpacing.screen,
        children: [
          AsyncSection(
            isLoading: catalog.loading,
            isEmpty: catalogEmpty,
            errorMessage: catalog.error,
            onRetry: () => context.read<CatalogController>().load(),
            empty: const EmptyState(
              icon: Icons.people_outline,
              message: "Pelanggan atau layanan belum ada",
              hint:
                  "Tambahkan pelanggan dan layanan dari dashboard web, lalu tekan muat ulang.",
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionHeader(
                    title: "Pelanggan",
                    caption: "Siapa yang menyerahkan cucian"),
                DropdownButtonFormField<String>(
                  initialValue: _customerId,
                  isExpanded: true,
                  decoration:
                      const InputDecoration(labelText: "Nama pelanggan"),
                  items: catalog.customers
                      .map((c) =>
                          DropdownMenuItem(value: c.id, child: Text(c.name)))
                      .toList(),
                  onChanged: (value) => setState(() => _customerId = value),
                ),
                const SizedBox(height: AppSpacing.xl),
                const SectionHeader(
                    title: "Layanan", caption: "Jenis cucian dan jumlahnya"),
                DropdownButtonFormField<String>(
                  initialValue: _serviceId,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: "Layanan"),
                  items: catalog.services
                      .map(
                        (s) => DropdownMenuItem(
                          value: s.id,
                          child: Text(
                              "${s.name} · ${Format.rupiah(s.pricePerUnit)}/${s.unit}"),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => _serviceId = value),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _qty,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(labelText: "Jumlah"),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: TextField(
                        controller: _paid,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: "Dibayar (Rp)"),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                const SectionHeader(
                    title: "Pembayaran", caption: "Metode dan catatan"),
                DropdownButtonFormField<String>(
                  initialValue: _paymentMethod,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: "Metode bayar"),
                  items: const [
                    DropdownMenuItem(value: "cash", child: Text("Tunai")),
                    DropdownMenuItem(
                        value: "transfer", child: Text("Transfer")),
                    DropdownMenuItem(value: "qris", child: Text("QRIS")),
                  ],
                  onChanged: (value) =>
                      setState(() => _paymentMethod = value ?? "cash"),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: _note,
                  decoration:
                      const InputDecoration(labelText: "Catatan (opsional)"),
                  maxLines: 2,
                ),
                const SizedBox(height: AppSpacing.xl),
                SurfaceCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text("Total",
                            style: Theme.of(context).textTheme.titleMedium),
                      ),
                      Text(
                        Format.rupiah(total),
                        style: AppTypography.amount(
                          context,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  ErrorNotice(message: _error!),
                ],
                const SizedBox(height: AppSpacing.xl),
                FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: _saving
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text("Simpan Order"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

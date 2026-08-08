import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../state/auth_scope.dart';
import '../theme/app_theme.dart';

class AssignmentScreen extends StatefulWidget {
  const AssignmentScreen({super.key});

  @override
  State<AssignmentScreen> createState() => _AssignmentScreenState();
}

class _AssignmentScreenState extends State<AssignmentScreen> {
  AssignmentView? _assignment;
  bool _loading = true;
  bool _notFound = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await api.activeAssignment();
      setState(() {
        _assignment = data;
        _notFound = false;
      });
    } on ApiException catch (err) {
      if (err.status == 404) {
        setState(() {
          _assignment = null;
          _notFound = true;
        });
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _openSaleSheet(AssignmentItemView item) async {
    final assignment = _assignment;
    if (assignment == null) return;

    final quantityController = TextEditingController();
    String? saleError;
    bool submitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            Future<void> submit() async {
              final qty = int.tryParse(quantityController.text) ?? 0;
              if (qty <= 0) {
                setSheetState(() => saleError = 'Geçerli bir miktar girin');
                return;
              }
              if (qty > item.quantityRemaining) {
                setSheetState(
                  () => saleError = 'Kalan miktardan fazla giremezsiniz (kalan: ${item.quantityRemaining})',
                );
                return;
              }
              setSheetState(() {
                submitting = true;
                saleError = null;
              });
              try {
                final updated = await api.addSale(assignment.id, item.product.id, qty);
                if (mounted) setState(() => _assignment = updated);
                if (sheetContext.mounted) Navigator.of(sheetContext).pop();
              } on ApiException catch (err) {
                setSheetState(() => saleError = err.message);
              } finally {
                setSheetState(() => submitting = false);
              }
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 22,
                right: 22,
                top: 22,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 22,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    '${item.product.name} — Satış Ekle',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.navy),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Kalan: ${item.quantityRemaining}',
                    style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'Miktar'),
                  ),
                  if (saleError != null) ...[
                    const SizedBox(height: 10),
                    Text(saleError!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                  ],
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(sheetContext).pop(),
                        child: const Text('Vazgeç', style: TextStyle(color: AppColors.text)),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: submitting ? null : submit,
                        child: submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Kaydet'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _openCloseSheet() async {
    final assignment = _assignment;
    if (assignment == null) return;
    bool closing = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        final remainingItems = assignment.items.where((i) => i.quantityRemaining > 0).toList();
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            Future<void> confirm() async {
              setSheetState(() => closing = true);
              try {
                final updated = await api.closeAssignment(assignment.id);
                if (mounted) setState(() => _assignment = updated);
                if (sheetContext.mounted) Navigator.of(sheetContext).pop();
              } on ApiException catch (err) {
                if (sheetContext.mounted) {
                  ScaffoldMessenger.of(sheetContext).showSnackBar(
                    SnackBar(content: Text(err.message)),
                  );
                }
              } finally {
                setSheetState(() => closing = false);
              }
            }

            return Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Günü Kapat',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.navy),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Aşağıdaki kalan ürünler depoya iade edilecek:',
                    style: TextStyle(fontSize: 12.5, color: AppColors.muted),
                  ),
                  const SizedBox(height: 8),
                  if (remainingItems.isEmpty)
                    const Text(
                      'İade edilecek ürün yok, hepsi satıldı.',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                    )
                  else
                    ...remainingItems.map(
                      (i) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Text(
                          '${i.product.name}: ${i.quantityRemaining} adet',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                        ),
                      ),
                    ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(sheetContext).pop(),
                        child: const Text('Vazgeç', style: TextStyle(color: AppColors.text)),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                        onPressed: closing ? null : confirm,
                        child: closing
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Onayla ve Kapat'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);

    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.accent)),
      );
    }

    final assignment = _assignment;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 40),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Merhaba, ${auth.user?.name ?? ''}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
                      ),
                      const Text('Bugünkü Zimmetim', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                    ],
                  ),
                  TextButton(
                    onPressed: auth.logout,
                    child: const Text('Çıkış', style: TextStyle(color: AppColors.danger, fontSize: 14)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_notFound)
                _Card(
                  child: const Text(
                    'Bugün size henüz bir zimmet atanmadı. Patronunuzla iletişime geçin.',
                    style: TextStyle(color: AppColors.muted, fontSize: 13.5),
                  ),
                ),
              if (assignment != null) ...[
                if (assignment.status == 'CLOSED')
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.successBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.successBorder),
                    ),
                    child: const Text(
                      'Gün kapatıldı. Kalan ürünler depoya iade edildi.',
                      style: TextStyle(color: AppColors.success, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                _Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Zimmetim (${assignment.status == 'OPEN' ? 'Sahada' : 'Kapandı'})',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.navy),
                      ),
                      const SizedBox(height: 10),
                      for (final item in assignment.items)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: const BoxDecoration(
                            border: Border(top: BorderSide(color: AppColors.divider)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.product.name,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Zimmet: ${item.quantityAssigned} · Satılan: ${item.quantitySold} · Kalan: ${item.quantityRemaining}'
                                      '${item.quantityReturned != null ? ' · İade: ${item.quantityReturned}' : ''}',
                                      style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
                                    ),
                                  ],
                                ),
                              ),
                              if (assignment.status == 'OPEN' && item.quantityRemaining > 0)
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 14),
                                    textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  onPressed: () => _openSaleSheet(item),
                                  child: const Text('Satış Ekle'),
                                ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Satışlarım (${_formatCurrency(assignment.totalSalesAmount)} ₺)',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.navy),
                      ),
                      const SizedBox(height: 10),
                      if (assignment.sales.isEmpty)
                        const Text('Henüz satış girilmedi.', style: TextStyle(color: AppColors.muted, fontSize: 13.5))
                      else
                        for (final sale in assignment.sales.reversed)
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: const BoxDecoration(
                              border: Border(top: BorderSide(color: AppColors.divider)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${sale.product.name} × ${sale.quantity}',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                                ),
                                Text(
                                  '${_formatCurrency(sale.total)} ₺',
                                  style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
                                ),
                              ],
                            ),
                          ),
                    ],
                  ),
                ),
                if (assignment.status == 'OPEN') ...[
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.danger,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: _openCloseSheet,
                      child: const Text('Günü Kapat', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}

String _formatCurrency(double value) {
  final fixed = value.toStringAsFixed(2);
  final parts = fixed.split('.');
  final intPart = parts[0];
  final decPart = parts[1];
  final buffer = StringBuffer();
  for (int i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 == 0) buffer.write('.');
    buffer.write(intPart[i]);
  }
  return decPart == '00' ? buffer.toString() : '$buffer,$decPart';
}

import "package:flutter/material.dart";

import "../theme/app_metrics.dart";
import "error_notice.dart";

/// Memilih tampilan yang tepat untuk data asinkron: galat, memuat, kosong, isi.
///
/// Semua layar daftar memakai kelas ini supaya ketiga keadaan wajib (antislop
/// R-27) tidak pernah terlewat di satu layar saja, dan supaya urutannya sama
/// di seluruh aplikasi: galat di atas, isi di bawahnya.
class AsyncSection extends StatelessWidget {
  const AsyncSection({
    super.key,
    required this.isLoading,
    required this.isEmpty,
    required this.empty,
    required this.child,
    this.errorMessage,
    this.onRetry,
    this.isLoadingMore = false,
  });

  final bool isLoading;
  final bool isLoadingMore;
  final bool isEmpty;
  final String? errorMessage;
  final Widget empty;
  final Widget child;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (errorMessage != null)
          ErrorNotice(message: errorMessage!, onRetry: onRetry),
        if (isLoading && isEmpty)
          const _LoadingBlock()
        else if (isEmpty)
          empty
        else
          child,
        if (isLoadingMore) const _LoadingBlock(compact: true),
      ],
    );
  }
}

class _LoadingBlock extends StatelessWidget {
  const _LoadingBlock({this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
          vertical: compact ? AppSpacing.lg : AppSpacing.xxl),
      child: const Center(
          child: SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.5))),
    );
  }
}

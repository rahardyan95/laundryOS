import "package:flutter/foundation.dart";

import "../api/api_exception.dart";
import "../models/dashboard.dart";
import "../repositories/dashboard_repository.dart";

class DashboardController extends ChangeNotifier {
  DashboardController(this._repository);

  final DashboardRepository _repository;

  DashboardSummary? _summary;
  bool _loading = false;
  String? _error;

  DashboardSummary? get summary => _summary;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> load({String? outletId}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _summary = await _repository.summary(outletId: outletId);
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = "Gagal memuat ringkasan.";
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}

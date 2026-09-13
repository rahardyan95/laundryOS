import "package:flutter/foundation.dart";

import "../models/catalog.dart";
import "../repositories/catalog_repository.dart";

class CatalogController extends ChangeNotifier {
  CatalogController(this._repository);

  final CatalogRepository _repository;

  List<Customer> _customers = [];
  List<Service> _services = [];
  bool _loading = false;
  String? _error;

  List<Customer> get customers => List.unmodifiable(_customers);
  List<Service> get services => List.unmodifiable(_services);
  bool get loading => _loading;
  String? get error => _error;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([_repository.customers(), _repository.services()]);
      _customers = results[0] as List<Customer>;
      _services = (results[1] as List<Service>).where((service) => service.active).toList();
    } catch (_) {
      _error = "Gagal memuat pelanggan dan layanan.";
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}

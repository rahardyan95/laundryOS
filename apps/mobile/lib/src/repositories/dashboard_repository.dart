import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../models/dashboard.dart";

class DashboardRepository {
  DashboardRepository(this._api, this._tokenProvider);

  final ApiClient _api;
  final Future<String?> Function() _tokenProvider;

  Future<DashboardSummary> summary({String? outletId}) async {
    final token = await _tokenProvider();
    if (token == null) throw ApiException(401, "Sesi berakhir. Silakan masuk kembali.");
    return _api.dashboardSummary(token, outletId: outletId);
  }
}

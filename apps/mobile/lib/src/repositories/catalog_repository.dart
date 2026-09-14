import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../models/catalog.dart";

class CatalogRepository {
  CatalogRepository(this._api, this._tokenProvider);

  final ApiClient _api;
  final Future<String?> Function() _tokenProvider;

  Future<List<Customer>> customers({String? query}) async {
    return _api.listCustomers(await _token(), query: query);
  }

  Future<List<Service>> services() async {
    return _api.listServices(await _token());
  }

  Future<String> _token() async {
    final token = await _tokenProvider();
    if (token == null) {
      throw ApiException(401, "Sesi berakhir. Silakan masuk kembali.");
    }
    return token;
  }
}

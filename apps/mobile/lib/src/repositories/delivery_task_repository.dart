import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../models/delivery_task.dart";

class DeliveryTaskRepository {
  DeliveryTaskRepository(this._api, this._tokenProvider);

  final ApiClient _api;
  final Future<String?> Function() _tokenProvider;

  Future<DeliveryTaskPage> page({int page = 1}) async {
    return _api.listDeliveryTasks(await _token(), page: page);
  }

  Future<DeliveryTask> advance(String taskId, DeliveryTaskStatus status) async {
    return _api.advanceDeliveryTask(await _token(), taskId, status);
  }

  Future<DeliveryTask> uploadProof(
    String taskId, {
    required List<int> bytes,
    required String filename,
  }) async {
    return _api.uploadDeliveryProof(await _token(), taskId, bytes: bytes, filename: filename);
  }

  Future<String> _token() async {
    final token = await _tokenProvider();
    if (token == null) throw ApiException(401, "Sesi berakhir. Silakan masuk kembali.");
    return token;
  }
}

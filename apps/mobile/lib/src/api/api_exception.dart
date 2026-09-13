class ApiException implements Exception {
  ApiException(this.status, this.message, {this.errors});

  final int status;
  final String message;
  final Map<String, dynamic>? errors;

  bool get isUnauthorized => status == 401;

  @override
  String toString() => message;
}

class NetworkException implements Exception {
  NetworkException([this.message = "Tidak dapat terhubung ke server."]);

  final String message;

  @override
  String toString() => message;
}

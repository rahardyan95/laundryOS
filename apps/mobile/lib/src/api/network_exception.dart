class NetworkException implements Exception {
  NetworkException([this.message = "Tidak dapat terhubung ke server."]);

  final String message;

  @override
  String toString() => message;
}

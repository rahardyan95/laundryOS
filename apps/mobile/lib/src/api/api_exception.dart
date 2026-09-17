class ApiException implements Exception {
  ApiException(this.status, this.message, {this.errors});

  final int status;
  final String message;
  final Map<String, dynamic>? errors;

  bool get isUnauthorized => status == 401;

  @override
  String toString() => message;
}

/// Mutasi yang gagal terkirim dan menunggu dikirim ulang.
///
/// [userId] mengikat mutasi pada identitas yang membuatnya: mutasi milik
/// pengguna lain tidak boleh terkirim dengan token sesi sekarang.
class PendingMutation {
  const PendingMutation({
    required this.method,
    required this.path,
    required this.idempotencyKey,
    required this.userId,
    this.body,
  });

  final String method;
  final String path;
  final String idempotencyKey;
  final String? userId;
  final Object? body;

  Map<String, dynamic> toJson() => {
        "method": method,
        "path": path,
        "key": idempotencyKey,
        "user_id": userId,
        "body": body,
      };

  factory PendingMutation.fromJson(Map<String, dynamic> json) =>
      PendingMutation(
        method: json["method"] as String,
        path: json["path"] as String,
        idempotencyKey: json["key"] as String,
        userId: json["user_id"] as String?,
        body: json["body"],
      );
}

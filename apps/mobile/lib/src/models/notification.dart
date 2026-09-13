class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.readAt,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String? readAt;
  final String? createdAt;

  bool get unread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json["id"].toString(),
        title: json["title"] as String? ?? "Notifikasi",
        body: json["body"] as String? ?? "",
        readAt: json["read_at"] as String?,
        createdAt: json["created_at"] as String?,
      );
}

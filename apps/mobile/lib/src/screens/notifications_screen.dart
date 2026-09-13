import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../state/notification_controller.dart";
import "../widgets/logout_button.dart";

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<NotificationController>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<NotificationController>();

    return Scaffold(
      appBar: AppBar(title: const Text("Notifikasi"), actions: const [LogoutButton()]),
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: controller.items.isEmpty
            ? ListView(
                children: const [
                  Padding(
                    padding: EdgeInsets.symmetric(vertical: 64),
                    child: Center(child: Text("Belum ada notifikasi.")),
                  ),
                ],
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: controller.items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final item = controller.items[index];
                  return ListTile(
                    leading: Icon(
                      item.unread ? Icons.notifications_active : Icons.notifications_none,
                      color: item.unread ? Theme.of(context).colorScheme.primary : null,
                    ),
                    title: Text(item.title),
                    subtitle: Text("${item.body}\n${Format.dateTime(item.createdAt)}"),
                    isThreeLine: true,
                    onTap: () => controller.markRead(item),
                  );
                },
              ),
      ),
    );
  }
}

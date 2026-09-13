import "package:flutter/material.dart";
import "package:image_picker/image_picker.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../domain/task_machine.dart";
import "../models/delivery_task.dart";
import "../state/delivery_task_controller.dart";
import "../widgets/logout_button.dart";

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<DeliveryTaskController>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DeliveryTaskController>();

    return Scaffold(
      appBar: AppBar(title: const Text("Tugas Antar-Jemput"), actions: const [LogoutButton()]),
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            if (controller.error != null)
              Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: Padding(padding: const EdgeInsets.all(12), child: Text(controller.error!)),
              ),
            if (controller.loading && controller.tasks.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (controller.tasks.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: Text("Belum ada tugas.")),
              )
            else
              ...controller.tasks.map((task) => _TaskCard(task: task, controller: controller)),
          ],
        ),
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  const _TaskCard({required this.task, required this.controller});

  final DeliveryTask task;
  final DeliveryTaskController controller;

  Future<void> _uploadProof(BuildContext context) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
      maxWidth: 1600,
    );
    if (file == null) return;
    final bytes = await file.readAsBytes();
    final ok = await controller.uploadProof(task, bytes: bytes, filename: file.name);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? "Bukti terunggah." : "Gagal mengunggah bukti.")),
    );
  }

  @override
  Widget build(BuildContext context) {
    final next = TaskMachine.next(task.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    "${TaskMachine.typeLabel(task.type)} · ${task.orderTicket}",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Chip(
                  label: Text(TaskMachine.label(task.status)),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(task.address),
            const SizedBox(height: 4),
            Text("Jadwal: ${Format.dateTime(task.scheduledAt)}",
                style: Theme.of(context).textTheme.bodySmall),
            if (task.proofUrl != null)
              Text("Bukti: terunggah", style: Theme.of(context).textTheme.bodySmall),
            if (next != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (task.status == DeliveryTaskStatus.inProgress)
                    TextButton.icon(
                      onPressed: () => _uploadProof(context),
                      icon: const Icon(Icons.camera_alt, size: 18),
                      label: const Text("Bukti"),
                    ),
                  FilledButton.tonal(
                    onPressed: () => controller.advance(task, next),
                    child: Text(TaskMachine.nextLabel(task.status)),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

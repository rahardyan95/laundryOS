import "package:flutter/material.dart";

import "../api/api_client.dart";
import "../models/models.dart";
import "login_screen.dart";

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<List<Order>>? _orders;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() => _orders = ApiClient.instance.listOrders());
  }

  Future<void> _advance(Order order) async {
    try {
      await ApiClient.instance.advanceOrderStatus(order.id);
      _reload();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> _logout() async {
    await ApiClient.instance.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Order"),
        actions: [
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout), tooltip: "Keluar"),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<List<Order>>(
          future: _orders,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(child: Text("Gagal memuat: ${snapshot.error}"));
            }
            final orders = snapshot.data ?? const <Order>[];
            if (orders.isEmpty) {
              return const Center(child: Text("Belum ada order."));
            }
            return ListView.separated(
              itemCount: orders.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final order = orders[index];
                return ListTile(
                  title: Text("${order.ticket} · ${order.customerName}"),
                  subtitle: Text("Status: ${order.status} · Rp${order.total}"),
                  trailing: IconButton(
                    icon: const Icon(Icons.arrow_forward),
                    tooltip: "Maju satu tahap",
                    onPressed: () => _advance(order),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

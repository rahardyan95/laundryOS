import "api/api_client.dart";
import "api/api_transport.dart";
import "api/http_api_transport.dart";
import "api/session_store.dart";
import "config/app_config.dart";
import "repositories/auth_repository.dart";
import "repositories/order_repository.dart";
import "state/auth_controller.dart";
import "state/order_controller.dart";

/// Titik komposisi dependency. Test dapat menyuntikkan transport/session store
/// palsu lewat konstruktor.
class AppDependencies {
  AppDependencies({ApiTransport? transport, SessionStore? store})
      : transport = transport ?? HttpApiTransport(baseUrl: AppConfig.apiBaseUrl),
        store = store ?? SecureSessionStore() {
    api = ApiClient(this.transport);
    authRepository = AuthRepository(api, this.store);
    orderRepository = OrderRepository(api, this.store.token);
    authController = AuthController(authRepository);
    orderController = OrderController(orderRepository);
  }

  final ApiTransport transport;
  final SessionStore store;

  late final ApiClient api;
  late final AuthRepository authRepository;
  late final OrderRepository orderRepository;
  late final AuthController authController;
  late final OrderController orderController;
}

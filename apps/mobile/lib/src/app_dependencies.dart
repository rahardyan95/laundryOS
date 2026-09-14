import "api/api_client.dart";
import "api/api_transport.dart";
import "api/caching_api_transport.dart";
import "api/http_api_transport.dart";
import "api/mutation_queue.dart";
import "api/offline_api_transport.dart";
import "api/offline_cache.dart";
import "api/session_store.dart";
import "config/app_config.dart";
import "push/push_registrar.dart";
import "repositories/auth_repository.dart";
import "repositories/catalog_repository.dart";
import "repositories/dashboard_repository.dart";
import "repositories/delivery_task_repository.dart";
import "repositories/notification_repository.dart";
import "repositories/order_repository.dart";
import "state/auth_controller.dart";
import "state/catalog_controller.dart";
import "state/connectivity_controller.dart";
import "state/dashboard_controller.dart";
import "state/delivery_task_controller.dart";
import "state/notification_controller.dart";
import "state/order_controller.dart";
import "state/sync_controller.dart";

/// Titik komposisi dependency. Test dapat menyuntikkan transport/session store
/// palsu lewat konstruktor.
class AppDependencies {
  AppDependencies({
    ApiTransport? transport,
    SessionStore? store,
    OfflineCache? offlineCache,
    MutationQueue? mutationQueue,
    PushRegistrar? pushRegistrar,
  })  : store = store ?? SecureSessionStore(),
        offlineCache = offlineCache ?? SharedPrefsOfflineCache(),
        mutationQueue = mutationQueue ?? SharedPrefsMutationQueue(),
        pushRegistrar = pushRegistrar ?? const NoopPushRegistrar() {
    // Identitas = id pengguna yang tersimpan. Cache dan antrean memakainya
    // supaya tidak ada data yang bocor antar shift di perangkat yang sama.
    final identity = this.store.userId;

    final inner = transport ??
        CachingApiTransport(
          HttpApiTransport(baseUrl: AppConfig.apiBaseUrl),
          this.offlineCache,
          identity,
        );

    offlineTransport = OfflineApiTransport(
        inner, this.mutationQueue, this.store.token, identity);
    this.transport = offlineTransport;

    api = ApiClient(offlineTransport);

    final token = this.store.token;

    authRepository = AuthRepository(api, this.store);
    orderRepository = OrderRepository(api, token);
    deliveryTaskRepository = DeliveryTaskRepository(api, token);
    catalogRepository = CatalogRepository(api, token);
    notificationRepository = NotificationRepository(api, token);
    dashboardRepository = DashboardRepository(api, token);

    authController = AuthController(
      authRepository,
      offlineCache: this.offlineCache,
      mutationQueue: this.mutationQueue,
      pushRegistrar: this.pushRegistrar,
    );
    orderController = OrderController(orderRepository);
    deliveryTaskController = DeliveryTaskController(deliveryTaskRepository);
    catalogController = CatalogController(catalogRepository);
    notificationController = NotificationController(notificationRepository);
    dashboardController = DashboardController(dashboardRepository);
    connectivityController = ConnectivityController();
    syncController = SyncController(offlineTransport, connectivityController);
  }

  final SessionStore store;
  final OfflineCache offlineCache;
  final MutationQueue mutationQueue;
  final PushRegistrar pushRegistrar;

  late final OfflineApiTransport offlineTransport;
  late final ApiTransport transport;

  late final ApiClient api;
  late final AuthRepository authRepository;
  late final OrderRepository orderRepository;
  late final DeliveryTaskRepository deliveryTaskRepository;
  late final CatalogRepository catalogRepository;
  late final NotificationRepository notificationRepository;
  late final DashboardRepository dashboardRepository;

  late final AuthController authController;
  late final OrderController orderController;
  late final DeliveryTaskController deliveryTaskController;
  late final CatalogController catalogController;
  late final NotificationController notificationController;
  late final DashboardController dashboardController;
  late final ConnectivityController connectivityController;
  late final SyncController syncController;
}

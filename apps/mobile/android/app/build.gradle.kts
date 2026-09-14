import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Signing rilis: sediakan android/key.properties (lihat key.properties.example).
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
val hasReleaseKeystore = keystorePropertiesFile.exists()
if (hasReleaseKeystore) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

// Pagar rilis: build Release tanpa keystore berarti artifact ditandatangani
// kunci debug — tidak boleh naik ke toko. CI/emulator dapat memaksa dengan
// -PallowDebugSigning=true. Pagar ini hanya menyala saat task Release diminta,
// sehingga `flutter run` debug tetap jalan di mesin tanpa keystore.
val releaseRequested =
    gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }
val allowDebugSigning = providers.gradleProperty("allowDebugSigning").orNull == "true"
if (releaseRequested && !hasReleaseKeystore && !allowDebugSigning) {
    throw GradleException(
        "Build Release tanpa android/key.properties. Sediakan keystore rilis " +
            "(lihat android/key.properties.example) atau jalankan dengan " +
            "-PallowDebugSigning=true (hanya untuk CI/emulator).",
    )
}

android {
    namespace = "com.laundryos.laundryos_mobile"
    compileSdk = flutter.compileSdkVersion
    // Pin ke NDK yang tersedia; hindari unduhan otomatis yang rapuh di lingkungan build.
    ndkVersion = "30.0.16138531"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.laundryos.laundryos_mobile"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            // Fallback ke debug bila key.properties belum ada (mis. CI tanpa secret).
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

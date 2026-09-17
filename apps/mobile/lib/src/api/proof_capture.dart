import "package:image_picker/image_picker.dart";

/// Pengambilan foto bukti via kamera. Satu-satunya titik yang menyentuh
/// ImagePicker — widget memanggil controller, controller memakai ini (R1.2).
class ProofCapture {
  ProofCapture({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  final ImagePicker _picker;

  Future<({List<int> bytes, String filename})?> capture() async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
      maxWidth: 1600,
    );
    if (file == null) return null;
    return (bytes: await file.readAsBytes(), filename: file.name);
  }
}

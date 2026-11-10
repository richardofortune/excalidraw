import AppKit

// The app writes a rendered preview into each saved .excalidraw file as a
// "thumbnail" field holding a base64 data URL. Both Quick Look extensions
// read it from there; neither draws the scene itself.
func loadStoredPreview(from url: URL) -> NSImage? {
  guard
    let data = try? Data(contentsOf: url),
    let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
    let dataURL = json["thumbnail"] as? String,
    let comma = dataURL.firstIndex(of: ","),
    let imageData = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
    let image = NSImage(data: imageData),
    image.size.width > 0, image.size.height > 0
  else { return nil }
  return image
}

let noStoredPreview = NSError(
  domain: "Excalidraw", code: 1,
  userInfo: [NSLocalizedDescriptionKey: "This file has no stored preview. Save it again in the Excalidraw app."])

func fitted(_ size: CGSize, within bounds: CGSize) -> CGSize {
  let scale = min(bounds.width / size.width, bounds.height / size.height)
  return CGSize(width: size.width * scale, height: size.height * scale)
}

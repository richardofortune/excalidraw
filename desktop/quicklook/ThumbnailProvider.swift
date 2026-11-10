import AppKit
import QuickLookThumbnailing

// Finder icons. Files without a stored preview fall back to the generic icon.
class ThumbnailProvider: QLThumbnailProvider {
  override func provideThumbnail(
    for request: QLFileThumbnailRequest,
    _ handler: @escaping (QLThumbnailReply?, Error?) -> Void
  ) {
    guard let image = loadStoredPreview(from: request.fileURL) else {
      handler(nil, noStoredPreview)
      return
    }
    let size = fitted(image.size, within: request.maximumSize)
    handler(
      QLThumbnailReply(contextSize: size, currentContextDrawing: { () -> Bool in
        image.draw(in: NSRect(origin: .zero, size: size))
        return true
      }), nil)
  }
}

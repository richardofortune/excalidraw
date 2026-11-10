import Cocoa
import Quartz
import WebKit
import os

private let log = Logger(subsystem: "com.richardfortune.excalidraw.preview", category: "preview")

// The Space-bar preview. Loads a bundled page running Excalidraw's own export
// code and hands it the file, which it draws as an SVG that stays sharp at
// any size. Works for any .excalidraw file, saved anywhere.
class PreviewViewController: NSViewController, QLPreviewingController, WKNavigationDelegate {
  private var webView: WKWebView!
  private var pending: (json: String, done: (Error?) -> Void)?

  override func loadView() {
    webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 1000, height: 700))
    webView.navigationDelegate = self
    // Pinch to zoom, two-finger double-tap to zoom in on a spot, scroll to pan.
    webView.allowsMagnification = true
    view = webView
  }

  func preparePreviewOfFile(at url: URL, completionHandler handler: @escaping (Error?) -> Void) {
    log.info("prepare \(url.lastPathComponent, privacy: .public)")
    guard let json = try? String(contentsOf: url, encoding: .utf8) else {
      handler(CocoaError(.fileReadUnknown))
      return
    }
    let web = Bundle.main.resourceURL!.appendingPathComponent("web")
    pending = (json, handler)
    webView.loadFileURL(web.appendingPathComponent("preview.html"), allowingReadAccessTo: web)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    guard let (json, done) = pending else { return }
    pending = nil
    let started = Date()
    webView.callAsyncJavaScript(
      "await renderExcalidraw(json)", arguments: ["json": json], in: nil, in: .page
    ) { result in
      let ms = Int(Date().timeIntervalSince(started) * 1000)
      if case .failure(let error) = result {
        log.error("render failed after \(ms)ms: \(String(describing: error), privacy: .public)")
        done(error)
        return
      }
      log.info("rendered in \(ms)ms")
      done(nil)
    }
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    log.error("page failed: \(String(describing: error), privacy: .public)")
    pending?.done(error)
    pending = nil
  }
}

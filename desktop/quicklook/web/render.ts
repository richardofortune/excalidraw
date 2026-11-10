// Runs inside the Quick Look preview extension's web view. Draws a
// .excalidraw file's scene as a vector SVG with Excalidraw's own export code,
// so the preview stays sharp at any size and needs no stored image.
import { exportToSvg } from "@excalidraw/utils";

declare global {
  interface Window {
    renderExcalidraw: (json: string) => Promise<void>;
  }
}

window.renderExcalidraw = async (json) => {
  const data = JSON.parse(json);
  const svg = await exportToSvg({
    elements: data.elements ?? [],
    appState: {
      ...data.appState,
      exportBackground: true,
      exportWithDarkMode: false,
    },
    files: data.files ?? {},
  });
  // Let the SVG scale to the window; its viewBox keeps the proportions.
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  document.body.replaceChildren(svg);
};

import "@excalidraw/excalidraw/global";
import "@excalidraw/excalidraw/css";

interface Window {
  __EXCALIDRAW_SHA__: string | undefined;
}

declare global {
  interface Window {
    /** exposed by desktop/preload.js when running inside the Electron app */
    desktop?: {
      onOpenFile: (
        callback: (file: { name: string; contents: string }) => void,
      ) => () => void;
    };
  }
}

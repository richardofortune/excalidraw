import React from "react";

import { reseed } from "@excalidraw/common";
import { CaptureUpdateAction } from "@excalidraw/element";

import * as overwriteConfirmStateModule from "../components/OverwriteConfirm/OverwriteConfirmState";
import { actionNewScene } from "../actions";
import { editorJotaiStore } from "../editor-jotai";
import { Excalidraw } from "../index";
import { API } from "../tests/helpers/api";
import {
  act,
  render,
  waitFor,
  withExcalidrawDimensions,
  unmountComponent,
} from "../tests/test-utils";

import {
  backupCurrentSceneToRecentFiles,
  clearRecentFiles,
  loadRecentFileAsActionResult,
  recentFilesAtom,
} from "./recentFiles";
import { loadFromBlob } from "./blob";
import { serializeAsJSON } from "./json";

const { h } = window;

describe("recent files", () => {
  beforeEach(async () => {
    unmountComponent();
    await clearRecentFiles();
    localStorage.clear();
    editorJotaiStore.set(recentFilesAtom, []);
    reseed(7);
  });

  it("stores and restores a scene snapshot", async () => {
    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    const rectangle = API.createElement({
      id: "rect-1",
      type: "rectangle",
      x: 10,
      y: 20,
      width: 120,
      height: 80,
    });

    API.setElements([rectangle]);
    API.setAppState({ name: "Alpha board" });

    const recentFile = await backupCurrentSceneToRecentFiles({
      elements: h.elements,
      appState: h.state,
      files: h.app.files,
    });

    expect(recentFile?.name).toBe("Alpha board");
    expect(editorJotaiStore.get(recentFilesAtom)).toHaveLength(1);

    API.setElements([]);
    API.setAppState({ name: null });

    const actionResult = await loadRecentFileAsActionResult({
      id: recentFile!.id,
      localAppState: h.state,
      localElements: h.elements,
    });

    expect(actionResult).not.toBeNull();

    act(() => {
      h.app.syncActionResult({
        ...actionResult!,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    });

    await waitFor(() => {
      expect(h.elements.some((element) => element.id === "rect-1")).toBe(true);
      expect(h.state.name).toBe("Alpha board");
    });
  });

  it("uses the opened file name when the scene has no explicit name", async () => {
    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    API.setElements([
      API.createElement({
        id: "rect-3",
        type: "rectangle",
        x: 40,
        y: 50,
        width: 120,
        height: 90,
      }),
    ]);
    API.setAppState({
      name: null,
      fileHandle: { name: "Roadmap.excalidraw" } as FileSystemFileHandle,
    });

    const recentFile = await backupCurrentSceneToRecentFiles({
      elements: h.elements,
      appState: h.state,
      files: h.app.files,
    });

    expect(recentFile?.name).toBe("Roadmap");
  });

  it("stores a file location when the environment exposes one", async () => {
    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    API.setElements([
      API.createElement({
        id: "rect-5",
        type: "rectangle",
        x: 10,
        y: 10,
        width: 80,
        height: 60,
      }),
    ]);
    API.setAppState({
      name: null,
      fileHandle: {
        name: "Roadmap.excalidraw",
        path: "/Users/mrfortune/Documents/Roadmap.excalidraw",
      } as unknown as FileSystemFileHandle,
    });

    const recentFile = await backupCurrentSceneToRecentFiles({
      elements: h.elements,
      appState: h.state,
      files: h.app.files,
    });

    expect(recentFile?.sourceFileLocation).toBe(
      "/Users/mrfortune/Documents/Roadmap.excalidraw",
    );
  });

  it("prefers the opened filename over the current local untitled name", async () => {
    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    const serializedScene = serializeAsJSON(
      [
        API.createElement({
          id: "rect-4",
          type: "rectangle",
          x: 30,
          y: 20,
          width: 100,
          height: 70,
        }),
      ],
      h.state,
      h.app.files,
      "local",
    );
    const file = new File([serializedScene], "Roadmap.excalidraw", {
      type: "application/json",
    });

    Object.defineProperty(file, "handle", {
      configurable: true,
      value: { name: "Roadmap.excalidraw" },
    });

    API.setAppState({ name: "Untitled-2026-05-09" });

    const loadedScene = await loadFromBlob(file, h.state, h.elements, file.handle);

    expect(loadedScene.appState.name).toBe("Roadmap");
  });

  it("backs up the current scene when creating a new file", async () => {
    vi.spyOn(overwriteConfirmStateModule, "openConfirmModal").mockResolvedValue(
      true,
    );

    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    API.setElements([
      API.createElement({
        id: "rect-2",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }),
    ]);
    API.setAppState({ name: "Draft scene" });

    API.executeAction(actionNewScene);

    await waitFor(() => {
      expect(editorJotaiStore.get(recentFilesAtom)).toHaveLength(1);
      expect(
        h.elements.filter((element) => !element.isDeleted),
      ).toHaveLength(0);
      expect(h.state.name).toBeNull();
    });
  });

  it("renders recent files in the persistent sidebar tab", async () => {
    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T18:00:00.000Z"));

    API.setElements([
      API.createElement({
        id: "rect-6",
        type: "rectangle",
        x: 12,
        y: 18,
        width: 96,
        height: 72,
      }),
    ]);
    API.setAppState({
      name: null,
      fileHandle: { name: "Roadmap.excalidraw" } as FileSystemFileHandle,
    });

    await backupCurrentSceneToRecentFiles({
      elements: h.elements,
      appState: h.state,
      files: h.app.files,
    });

    await withExcalidrawDimensions({ width: 1920, height: 1080 }, async () => {
      act(() => {
        h.app.setAppState({
          openSidebar: { name: "default", tab: "recentFiles" },
        });
      });

      await waitFor(() => {
        expect(document.querySelector(".RecentFilesPanel")).not.toBeNull();
        expect(document.querySelector(".RecentFilesPanel__itemName")?.textContent).toBe(
          "Roadmap",
        );
        expect(
          document.querySelector(".RecentFilesPanel__itemTimestamp")?.textContent,
        ).toBe("now");
      });
    });

    vi.useRealTimers();
  });

  it("opens a recent file without showing an overwrite confirmation", async () => {
    const confirmModalSpy = vi.spyOn(
      overwriteConfirmStateModule,
      "openConfirmModal",
    );

    await render(<Excalidraw autoFocus={true} handleKeyboardGlobally={true} />);

    API.setElements([
      API.createElement({
        id: "recent-rect",
        type: "rectangle",
        x: 20,
        y: 20,
        width: 120,
        height: 80,
      }),
    ]);
    API.setAppState({
      name: "Roadmap",
      fileHandle: { name: "Roadmap.excalidraw" } as FileSystemFileHandle,
    });

    await backupCurrentSceneToRecentFiles({
      elements: h.elements,
      appState: h.state,
      files: h.app.files,
    });

    API.setElements([
      API.createElement({
        id: "current-rect",
        type: "rectangle",
        x: 200,
        y: 200,
        width: 80,
        height: 60,
      }),
    ]);
    API.setAppState({ name: "Current draft", fileHandle: null });

    await withExcalidrawDimensions({ width: 1920, height: 1080 }, async () => {
      act(() => {
        h.app.setAppState({
          openSidebar: { name: "default", tab: "recentFiles" },
        });
      });

      const recentFileButton = document.querySelector<HTMLElement>(
        ".RecentFilesPanel__itemButton",
      );
      expect(recentFileButton).not.toBeNull();

      act(() => {
        recentFileButton!.click();
      });

      await waitFor(() => {
        expect(confirmModalSpy).not.toHaveBeenCalled();
        expect(h.state.name).toBe("Roadmap");
        expect(h.elements.some((element) => element.id === "recent-rect")).toBe(
          true,
        );
      });
    });
  });
});

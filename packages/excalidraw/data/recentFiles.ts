import {
  DEFAULT_FILENAME,
  EDITOR_LS_KEYS,
  MIME_TYPES,
} from "@excalidraw/common";

import { getNonDeletedElements } from "@excalidraw/element";

import { createStore, del, get, set } from "idb-keyval";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { atom, editorJotaiStore } from "../editor-jotai";

import { EditorLocalStorage } from "./EditorLocalStorage";
import { loadFromBlob } from "./blob";
import { serializeAsJSON } from "./json";

import type { AppState, BinaryFiles } from "../types";

export const DEFAULT_RECENT_FILES_LIMIT = 8;

export type RecentFile = {
  id: string;
  name: string;
  sourceFileName: string | null;
  sourceFileLocation: string | null;
  lastOpened: number;
};

const recentFilesStore = createStore(
  "excalidraw-recent-files-db",
  "scene-snapshots",
);

const isRecentFile = (value: unknown): value is RecentFile => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    (candidate.sourceFileName === null ||
      typeof candidate.sourceFileName === "string") &&
    (candidate.sourceFileLocation === undefined ||
      candidate.sourceFileLocation === null ||
      typeof candidate.sourceFileLocation === "string") &&
    typeof candidate.lastOpened === "number"
  );
};

const sanitizeRecentFiles = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecentFile).sort((a, b) => b.lastOpened - a.lastOpened);
};

const persistRecentFiles = (files: RecentFile[]) => {
  if (files.length) {
    EditorLocalStorage.set(EDITOR_LS_KEYS.RECENT_FILES, files);
  } else {
    EditorLocalStorage.delete(EDITOR_LS_KEYS.RECENT_FILES);
  }
};

const stripExcalidrawExtension = (filename: string) =>
  filename.replace(/\.(?:excalidraw|json)$/iu, "");

const getFileLocationFromHandle = (fileHandle: AppState["fileHandle"]) => {
  const pathLikeValue =
    (fileHandle as any)?.path ||
    (fileHandle as any)?.webkitRelativePath ||
    (fileHandle as any)?.relativePath ||
    null;

  if (typeof pathLikeValue !== "string" || !pathLikeValue) {
    return null;
  }

  return pathLikeValue;
};

const getRecentFileName = (appState: Pick<AppState, "name" | "fileHandle">) =>
  appState.name ||
  (appState.fileHandle?.name
    ? stripExcalidrawExtension(appState.fileHandle.name)
    : null) ||
  DEFAULT_FILENAME;

const buildRecentFileId = (
  currentFiles: readonly RecentFile[],
  name: string,
  sourceFileName: string | null,
) => {
  if (sourceFileName) {
    return `file:${sourceFileName}`;
  }

  const existingFile = currentFiles.find(
    (file) => !file.sourceFileName && file.name === name,
  );

  return (
    existingFile?.id ||
    `recent:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
  );
};

const getNextRecentFiles = (
  currentFiles: readonly RecentFile[],
  nextFile: RecentFile,
  limit = DEFAULT_RECENT_FILES_LIMIT,
) => {
  return [
    nextFile,
    ...currentFiles.filter((file) => file.id !== nextFile.id),
  ].slice(0, limit);
};

const loadRecentFiles = () =>
  sanitizeRecentFiles(EditorLocalStorage.get(EDITOR_LS_KEYS.RECENT_FILES));

export const recentFilesAtom = atom<RecentFile[]>(loadRecentFiles());

export const clearRecentFiles = async () => {
  const currentFiles = editorJotaiStore.get(recentFilesAtom).length
    ? editorJotaiStore.get(recentFilesAtom)
    : loadRecentFiles();

  editorJotaiStore.set(recentFilesAtom, []);
  persistRecentFiles([]);

  await Promise.all(currentFiles.map((file) => del(file.id, recentFilesStore)));
};

export const removeRecentFile = async (fileId: string) => {
  const nextFiles = editorJotaiStore
    .get(recentFilesAtom)
    .filter((file) => file.id !== fileId);

  editorJotaiStore.set(recentFilesAtom, nextFiles);
  persistRecentFiles(nextFiles);

  await del(fileId, recentFilesStore);
};

export const backupCurrentSceneToRecentFiles = async ({
  elements,
  appState,
  files,
}: {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
}) => {
  if (
    getNonDeletedElements(elements).length === 0 &&
    !appState.name &&
    !appState.fileHandle
  ) {
    return null;
  }

  const recentFiles = editorJotaiStore.get(recentFilesAtom);
  const name = getRecentFileName(appState);
  const sourceFileName = appState.fileHandle?.name ?? null;
  const sourceFileLocation = getFileLocationFromHandle(appState.fileHandle);
  const id = buildRecentFileId(recentFiles, name, sourceFileName);
  const lastOpened = Date.now();

  await set(
    id,
    serializeAsJSON(
      getNonDeletedElements(elements),
      {
        ...appState,
        name,
      },
      files,
      "local",
    ),
    recentFilesStore,
  );

  const nextRecentFiles = getNextRecentFiles(recentFiles, {
    id,
    name,
    sourceFileName,
    sourceFileLocation,
    lastOpened,
  });

  editorJotaiStore.set(recentFilesAtom, nextRecentFiles);
  persistRecentFiles(nextRecentFiles);

  const evictedFiles = recentFiles
    .filter(
      (file) => !nextRecentFiles.some((nextFile) => nextFile.id === file.id),
    )
    .map((file) => file.id);

  if (evictedFiles.length) {
    await Promise.all(
      evictedFiles.map((fileId) => del(fileId, recentFilesStore)),
    );
  }

  return nextRecentFiles[0];
};

export const loadRecentFileAsActionResult = async ({
  id,
  localAppState,
  localElements,
}: {
  id: string;
  localAppState: AppState;
  localElements: readonly ExcalidrawElement[];
}) => {
  const snapshot = await get<string>(id, recentFilesStore);

  if (!snapshot) {
    await removeRecentFile(id);
    return null;
  }

  const recentFile = editorJotaiStore
    .get(recentFilesAtom)
    .find((file) => file.id === id);
  const loadedScene = await loadFromBlob(
    new Blob([snapshot], { type: MIME_TYPES.excalidraw }),
    localAppState,
    localElements,
    null,
  );

  const nextRecentFiles = getNextRecentFiles(
    editorJotaiStore.get(recentFilesAtom),
    {
      id,
      name: recentFile?.name || loadedScene.appState.name || DEFAULT_FILENAME,
      sourceFileName: recentFile?.sourceFileName || null,
      sourceFileLocation: recentFile?.sourceFileLocation || null,
      lastOpened: Date.now(),
    },
  );

  editorJotaiStore.set(recentFilesAtom, nextRecentFiles);
  persistRecentFiles(nextRecentFiles);

  return {
    elements: loadedScene.elements,
    files: loadedScene.files,
    appState: {
      ...loadedScene.appState,
      fileHandle: null,
      name: recentFile?.name || loadedScene.appState.name || DEFAULT_FILENAME,
    },
  };
};

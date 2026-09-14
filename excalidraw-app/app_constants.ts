// time constants (ms)
export const SAVE_TO_LOCAL_STORAGE_TIMEOUT = 300;
export const INITIAL_SCENE_UPDATE_TIMEOUT = 5000;
export const FILE_UPLOAD_TIMEOUT = 300;
export const LOAD_IMAGES_TIMEOUT = 500;
export const SYNC_FULL_SCENE_INTERVAL_MS = 20000;
export const SYNC_BROWSER_TABS_TIMEOUT = 50;
export const CURSOR_SYNC_TIMEOUT = 33; // ~30fps
export const DELETED_ELEMENT_TIMEOUT = 24 * 60 * 60 * 1000; // 1 day

// should be aligned with MAX_ALLOWED_FILE_BYTES
export const FILE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024; // 4 MiB
// 1 year (https://stackoverflow.com/a/25201898/927631)
export const FILE_CACHE_MAX_AGE_SEC = 31536000;

export const WS_EVENTS = {
  SERVER_VOLATILE: "server-volatile-broadcast",
  SERVER: "server-broadcast",
  USER_FOLLOW_CHANGE: "user-follow",
  USER_FOLLOW_ROOM_CHANGE: "user-follow-room-change",
} as const;

export enum WS_SUBTYPES {
  INVALID_RESPONSE = "INVALID_RESPONSE",
  INIT = "SCENE_INIT",
  UPDATE = "SCENE_UPDATE",
  MOUSE_LOCATION = "MOUSE_LOCATION",
  IDLE_STATUS = "IDLE_STATUS",
  USER_VISIBLE_SCENE_BOUNDS = "USER_VISIBLE_SCENE_BOUNDS",
}

export const FIREBASE_STORAGE_PREFIXES = {
  shareLinkFiles: `/files/shareLinks`,
  collabFiles: `/files/rooms`,
};

export const ROOM_ID_BYTES = 10;

export const STORAGE_KEYS = {
  LOCAL_STORAGE_ELEMENTS: "excalidraw",
  LOCAL_STORAGE_APP_STATE: "excalidraw-state",
  LOCAL_STORAGE_COLLAB: "excalidraw-collab",
  LOCAL_STORAGE_THEME: "excalidraw-theme",
  LOCAL_STORAGE_DEBUG: "excalidraw-debug",
  VERSION_DATA_STATE: "version-dataState",
  VERSION_FILES: "version-files",

  IDB_LIBRARY: "excalidraw-library",
  IDB_TTD_CHATS: "excalidraw-ttd-chats",

  // do not use apart from migrations
  __LEGACY_LOCAL_STORAGE_LIBRARY: "excalidraw-library",
} as const;

export const COOKIES = {
  AUTH_STATE_COOKIE: "excplus-auth",
} as const;

export const isExcalidrawPlusSignedUser = document.cookie.includes(
  COOKIES.AUTH_STATE_COOKIE,
);

// version of this fork, bumped manually when we ship changes on top of upstream
export const FORK_VERSION = "1.0.0";

const gitInfo =
  typeof __FORK_GIT_INFO__ === "undefined" ? null : __FORK_GIT_INFO__;

/** short label for the menu, e.g. `v1.0.0 · master +1 −11*` */
export const FORK_VERSION_LABEL = (() => {
  if (!gitInfo) {
    return `v${FORK_VERSION}`;
  }

  const drift = [
    gitInfo.ahead ? `+${gitInfo.ahead}` : "",
    gitInfo.behind ? `−${gitInfo.behind}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `v${FORK_VERSION} · ${gitInfo.branch}${drift ? ` ${drift}` : ""}${
    gitInfo.dirty ? "*" : ""
  }`;
})();

/** the same thing spelled out, shown on hover */
export const FORK_VERSION_TITLE = (() => {
  if (!gitInfo) {
    return `v${FORK_VERSION} (built without git info)`;
  }

  const lines = [`${gitInfo.branch} @ ${gitInfo.sha}`];

  if (gitInfo.base) {
    lines.push(
      gitInfo.ahead || gitInfo.behind
        ? `${gitInfo.ahead} ahead, ${gitInfo.behind} behind ${gitInfo.base}`
        : `in sync with ${gitInfo.base}`,
    );
  }

  if (gitInfo.dirty) {
    lines.push("built with uncommitted changes");
  }

  return lines.join("\n");
})();

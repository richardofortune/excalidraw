import { CaptureUpdateAction } from "@excalidraw/element";

import {
  backupCurrentSceneToRecentFiles,
  clearRecentFiles,
  loadRecentFileAsActionResult,
  recentFilesAtom,
  removeRecentFile,
} from "../data/recentFiles";
import { useAtomValue } from "../editor-jotai";
import { t } from "../i18n";

import { useApp, useExcalidrawAppState, useExcalidrawElements } from "./App";
import { Button } from "./Button";
import { CloseIcon, LoadIcon } from "./icons";

import "./RecentFilesPanel.scss";

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const formatLastOpened = (timestamp: number) => {
  const elapsed = timestamp - Date.now();
  const seconds = Math.round(elapsed / 1000);

  if (Math.abs(seconds) < 60) {
    return relativeTimeFormatter.format(seconds, "second");
  }

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return relativeTimeFormatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return relativeTimeFormatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) {
    return relativeTimeFormatter.format(days, "day");
  }

  const weeks = Math.round(days / 7);
  if (Math.abs(weeks) < 5) {
    return relativeTimeFormatter.format(weeks, "week");
  }

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) {
    return relativeTimeFormatter.format(months, "month");
  }

  const years = Math.round(days / 365);
  return relativeTimeFormatter.format(years, "year");
};

export const RecentFilesPanel = () => {
  const app = useApp();
  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const recentFiles = useAtomValue(recentFilesAtom);

  const openRecentFile = async (recentFileId: string) => {
    await backupCurrentSceneToRecentFiles({
      elements,
      appState,
      files: app.files,
    });

    const actionResult = await loadRecentFileAsActionResult({
      id: recentFileId,
      localAppState: appState,
      localElements: elements,
    });

    if (!actionResult) {
      app.setAppState({
        errorMessage: t("errors.recentFileUnavailable"),
      });
      return;
    }

    app.syncActionResult({
      ...actionResult,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  return (
    <div className="RecentFilesPanel">
      <div className="RecentFilesPanel__header">
        <div className="RecentFilesPanel__title">
          {t("buttons.recentFiles")}
        </div>
        <Button
          className="RecentFilesPanel__clear"
          onSelect={() => {
            void clearRecentFiles();
          }}
          disabled={!recentFiles.length}
          aria-label={t("buttons.clearRecentFiles")}
        >
          {t("buttons.clearRecentFiles")}
        </Button>
      </div>

      {recentFiles.length ? (
        <div className="RecentFilesPanel__list">
          {recentFiles.map((recentFile) => (
            <div className="RecentFilesPanel__item" key={recentFile.id}>
              <button
                type="button"
                className="RecentFilesPanel__itemButton"
                onClick={() => {
                  void openRecentFile(recentFile.id);
                }}
                title={
                  recentFile.sourceFileLocation
                    ? `${recentFile.name}\n${recentFile.sourceFileLocation}`
                    : recentFile.name
                }
                aria-label={recentFile.name}
              >
                <div className="RecentFilesPanel__itemIcon">{LoadIcon}</div>
                <div className="RecentFilesPanel__itemText">
                  <div className="RecentFilesPanel__itemMeta">
                    <div className="RecentFilesPanel__itemName">
                      {recentFile.name}
                    </div>
                    <div className="RecentFilesPanel__itemTimestamp">
                      {formatLastOpened(recentFile.lastOpened)}
                    </div>
                  </div>
                  {recentFile.sourceFileLocation ? (
                    <div className="RecentFilesPanel__itemLocation">
                      {recentFile.sourceFileLocation}
                    </div>
                  ) : null}
                </div>
              </button>
              <button
                type="button"
                className="RecentFilesPanel__remove"
                title={t("buttons.remove")}
                aria-label={`${t("buttons.remove")} ${recentFile.name}`}
                onClick={() => {
                  void removeRecentFile(recentFile.id);
                }}
              >
                {CloseIcon}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="RecentFilesPanel__empty">
          {t("buttons.noRecentFiles")}
        </div>
      )}
    </div>
  );
};

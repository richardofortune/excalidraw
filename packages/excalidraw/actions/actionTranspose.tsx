import {
  CaptureUpdateAction,
  getNonDeletedElements,
  getSelectedElementsByGroup,
  isFrameLikeElement,
  transposeElements,
  updateFrameMembershipOfSelectedElements,
} from "@excalidraw/element";

import { CODES, KEYS, arrayToMap } from "@excalidraw/common";

import { IconButton } from "../components/IconButton";
import { TransposeIcon } from "../components/icons";

import { t } from "../i18n";

import { isSomeElementSelected } from "../scene";

import { getShortcutKey } from "../shortcut";

import { register } from "./register";

import type { AppClassProperties, UIAppState } from "../types";

const enableTranspose = (appState: UIAppState, app: AppClassProperties) => {
  const selectedElements = app.scene.getSelectedElements(appState);
  return (
    getSelectedElementsByGroup(
      selectedElements,
      app.scene.getNonDeletedElementsMap(),
      appState,
    ).length > 1 && !selectedElements.some((el) => isFrameLikeElement(el))
  );
};

export const actionTranspose = register({
  name: "transpose",
  label: "labels.transpose",
  icon: TransposeIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, _, app) => enableTranspose(appState, app),
  perform: (elements, appState, _, app) => {
    const updatedElementsMap = arrayToMap(
      transposeElements(
        app.scene.getSelectedElements(appState),
        app.scene.getNonDeletedElementsMap(),
        appState,
        app.scene,
      ),
    );
    return {
      appState,
      elements: updateFrameMembershipOfSelectedElements(
        elements.map(
          (element) => updatedElementsMap.get(element.id) || element,
        ),
        appState,
        app,
      ),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.T,
  PanelComponent: ({ elements, appState, updateData, app }) => (
    <IconButton
      hidden={!enableTranspose(appState, app)}
      type="button"
      icon={TransposeIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.transpose")} — ${getShortcutKey("Alt+T")}`}
      aria-label={t("labels.transpose")}
      visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
    />
  ),
});

import type { AppState } from "@excalidraw/excalidraw/types";

import { updateBoundElements } from "./binding";
import { getCommonBoundingBox } from "./bounds";

import { getSelectedElementsByGroup } from "./groups";

import { getNonDeletedElements } from ".";

import type { Scene } from "./Scene";

import type { ElementsMap, NonDeletedExcalidrawElement } from "./types";

const AXIS = {
  x: { min: "minX", max: "maxX", mid: "midX" },
  y: { min: "minY", max: "maxY", mid: "midY" },
} as const;

/**
 * Turns a column of elements into a row, or a row into a column.
 *
 * The selection is a column when its bounding box is at least as tall as it
 * is wide. The first element (topmost, or leftmost for a row) stays put. The
 * gaps between neighbours carry over to the new axis, and each element's
 * sideways offset from the first one becomes an offset along the other axis,
 * so running it twice returns the original layout.
 */
export const transposeElements = (
  selectedElements: NonDeletedExcalidrawElement[],
  elementsMap: ElementsMap,
  appState: Readonly<AppState>,
  scene: Scene,
): NonDeletedExcalidrawElement[] => {
  const bounds = getCommonBoundingBox(selectedElements);
  const isColumn = bounds.height >= bounds.width;
  const from = AXIS[isColumn ? "y" : "x"];
  const to = AXIS[isColumn ? "x" : "y"];
  const toAxis = isColumn ? "x" : "y";

  const groups = getSelectedElementsByGroup(
    selectedElements,
    elementsMap,
    appState,
  )
    .map(getNonDeletedElements)
    .map((group) => [group, getCommonBoundingBox(group)] as const)
    .sort((a, b) => a[1][from.min] - b[1][from.min]);

  const anchor = groups[0][1];
  let newEnd = 0;

  return groups.flatMap(([group, box], index) => {
    const gap =
      index === 0 ? 0 : box[from.min] - groups[index - 1][1][from.max];
    const newStart = index === 0 ? anchor[to.min] : newEnd + gap;
    // Shapes keep their size, so along the new axis each one takes up its
    // own extent on that axis.
    newEnd = newStart + (box[to.max] - box[to.min]);

    const newCrossMid = anchor[from.mid] + (box[to.mid] - anchor[to.mid]);

    const deltaTo = newStart - box[to.min];
    const deltaFrom = newCrossMid - box[from.mid];
    const dx = toAxis === "x" ? deltaTo : deltaFrom;
    const dy = toAxis === "x" ? deltaFrom : deltaTo;

    return group.map((element) => {
      const updatedElement = scene.mutateElement(element, {
        x: element.x + dx,
        y: element.y + dy,
      });
      updateBoundElements(element, scene, {
        simultaneouslyUpdated: group,
      });
      return updatedElement;
    });
  });
};

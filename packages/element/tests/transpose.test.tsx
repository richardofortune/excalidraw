import { actionTranspose } from "@excalidraw/excalidraw/actions";
import { Excalidraw } from "@excalidraw/excalidraw";

import { API } from "@excalidraw/excalidraw/tests/helpers/api";
import { Keyboard } from "@excalidraw/excalidraw/tests/helpers/ui";
import {
  act,
  render,
  unmountComponent,
} from "@excalidraw/excalidraw/tests/test-utils";

const positions = () =>
  API.getSelectedElements()
    .map((el) => [el.id, el.x, el.y] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));

describe("transpose", () => {
  beforeEach(async () => {
    unmountComponent();
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  it("turns a column into a row, keeping gaps and the first shape fixed", () => {
    // 100x50 boxes stacked with 20px gaps; the middle one sits 10px right.
    const a = API.createElement({
      id: "a",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    });
    const b = API.createElement({
      id: "b",
      x: 10,
      y: 70,
      width: 100,
      height: 50,
    });
    const c = API.createElement({
      id: "c",
      x: 0,
      y: 140,
      width: 100,
      height: 50,
    });
    API.setElements([a, b, c]);
    API.setSelectedElements([a, b, c]);

    act(() => {
      API.executeAction(actionTranspose);
    });

    // Row: each box keeps its 100px width, 20px gaps, b sits 10px lower.
    expect(positions()).toEqual([
      ["a", 0, 0],
      ["b", 120, 10],
      ["c", 240, 0],
    ]);
  });

  it("restores the original layout when run twice (Alt+T)", () => {
    const a = API.createElement({
      id: "a",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    });
    const b = API.createElement({
      id: "b",
      x: 10,
      y: 70,
      width: 100,
      height: 50,
    });
    const c = API.createElement({
      id: "c",
      x: 0,
      y: 140,
      width: 100,
      height: 50,
    });
    API.setElements([a, b, c]);
    API.setSelectedElements([a, b, c]);
    const before = positions();

    Keyboard.withModifierKeys({ alt: true }, () => {
      Keyboard.codePress("KeyT");
    });
    expect(positions()).not.toEqual(before);

    Keyboard.withModifierKeys({ alt: true }, () => {
      Keyboard.codePress("KeyT");
    });
    expect(positions()).toEqual(before);
  });
});

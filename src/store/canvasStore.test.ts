import { act } from "@testing-library/react";
import { useCanvasStore } from "./canvasStore";
import { createElement } from "@/core/elements/createElement";

const getStore = () => useCanvasStore.getState();

const makeRect = () =>
  createElement("rectangle", { x: 0, y: 0, strokeColor: "#000" });

beforeEach(() => {
  useCanvasStore.setState({
    elements: [],
    selectedIds: [],
    history: { past: [], future: [] },
  });
});

describe("canvasStore", () => {
  describe("addElement", () => {
    it("adds element and creates history entry", () => {
      const el = makeRect();
      act(() => getStore().addElement(el));

      expect(getStore().elements).toHaveLength(1);
      expect(getStore().elements[0].id).toBe(el.id);
      expect(getStore().history.past).toHaveLength(1);
      expect(getStore().history.future).toHaveLength(0);
    });
  });

  describe("deleteElements", () => {
    it("removes element by id and clears selection", () => {
      const el = makeRect();
      act(() => {
        getStore().addElement(el);
        getStore().deleteElements([el.id]);
      });
      expect(getStore().elements).toHaveLength(0);
      expect(getStore().selectedIds).toHaveLength(0);
    });
  });

  describe("selectElements", () => {
    it("marks elements as selected", () => {
      const el = makeRect();
      act(() => {
        getStore().addElement(el);
        getStore().selectElements([el.id]);
      });
      expect(getStore().selectedIds).toContain(el.id);
      expect(getStore().elements[0].isSelected).toBe(true);
    });
  });

  describe("undo/redo", () => {
    it("undo restores previous state", () => {
      const el = makeRect();
      act(() => getStore().addElement(el));
      expect(getStore().elements).toHaveLength(1);

      act(() => getStore().undo());
      expect(getStore().elements).toHaveLength(0);
      expect(getStore().history.future).toHaveLength(1);
    });

    it("redo re-applies undone action", () => {
      const el = makeRect();
      act(() => {
        getStore().addElement(el);
        getStore().undo();
        getStore().redo();
      });
      expect(getStore().elements).toHaveLength(1);
    });

    it("undo does nothing on empty history", () => {
      act(() => getStore().undo());
      expect(getStore().elements).toHaveLength(0);
    });
  });

  describe("clearCanvas", () => {
    it("removes all elements and adds history entry", () => {
      act(() => {
        getStore().addElement(makeRect());
        getStore().addElement(makeRect());
        getStore().clearCanvas();
      });
      expect(getStore().elements).toHaveLength(0);
      expect(getStore().history.past.length).toBeGreaterThan(0);
    });
  });

  describe("zoom and pan", () => {
    it("updates zoom value", () => {
      act(() => getStore().setZoom(2));
      expect(getStore().zoom).toBe(2);
    });

    it("updates pan offset", () => {
      act(() => getStore().setPanOffset({ x: 100, y: 200 }));
      expect(getStore().panOffset).toEqual({ x: 100, y: 200 });
    });
  });
});

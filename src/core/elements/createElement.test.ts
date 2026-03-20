import { createElement } from "./createElement";
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_OPACITY,
  DEFAULT_BORDER_RADIUS,
} from "@/utils/constants";

describe("createElement", () => {
  const baseOpts = { x: 10, y: 20 };

  it("creates a rectangle with default properties", () => {
    const el = createElement("rectangle", baseOpts);
    expect(el.type).toBe("rectangle");
    expect(el.x).toBe(10);
    expect(el.y).toBe(20);
    expect(el.strokeColor).toBe(DEFAULT_STROKE_COLOR);
    expect(el.fillColor).toBe(DEFAULT_FILL_COLOR);
    expect(el.strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
    expect(el.opacity).toBe(DEFAULT_OPACITY);
    expect(el.isSelected).toBe(false);
    if (el.type === "rectangle") {
      expect(el.borderRadius).toBe(DEFAULT_BORDER_RADIUS);
    }
  });

  it("creates a diamond", () => {
    const el = createElement("diamond", baseOpts);
    expect(el.type).toBe("diamond");
    expect(el.x).toBe(10);
    expect(el.y).toBe(20);
  });

  it("creates an ellipse", () => {
    const el = createElement("ellipse", baseOpts);
    expect(el.type).toBe("ellipse");
  });

  it("creates a line with x2/y2 matching start point", () => {
    const el = createElement("line", baseOpts);
    expect(el.type).toBe("line");
    if (el.type === "line") {
      expect(el.x2).toBe(10);
      expect(el.y2).toBe(20);
    }
  });

  it("creates an arrow with x2/y2 matching start point and null bindings", () => {
    const el = createElement("arrow", baseOpts);
    expect(el.type).toBe("arrow");
    if (el.type === "arrow") {
      expect(el.x2).toBe(10);
      expect(el.y2).toBe(20);
      expect(el.midPoint).toBeNull();
      expect(el.startBinding).toBeNull();
      expect(el.endBinding).toBeNull();
    }
  });

  it("creates freehand with initial point in array", () => {
    const el = createElement("freehand", baseOpts);
    expect(el.type).toBe("freehand");
    if (el.type === "freehand") {
      expect(el.points).toHaveLength(1);
      expect(el.points[0]).toEqual({ x: 10, y: 20 });
    }
  });

  it("creates text with default content and font", () => {
    const el = createElement("text", baseOpts);
    expect(el.type).toBe("text");
    if (el.type === "text") {
      expect(el.content).toBe("");
      expect(el.fontSize).toBeGreaterThan(0);
    }
  });

  it("applies custom stroke color override", () => {
    const el = createElement("rectangle", { ...baseOpts, strokeColor: "#ff0000" });
    expect(el.strokeColor).toBe("#ff0000");
  });

  it("defaults sloppiness to 0", () => {
    const el = createElement("rectangle", baseOpts);
    expect(el.sloppiness).toBe(0);
  });

  it("applies custom sloppiness override", () => {
    const el = createElement("ellipse", { ...baseOpts, sloppiness: 2 });
    expect(el.sloppiness).toBe(2);
  });

  it("generates unique IDs for each element", () => {
    const el1 = createElement("rectangle", baseOpts);
    const el2 = createElement("rectangle", baseOpts);
    expect(el1.id).not.toBe(el2.id);
  });

  it("sets createdAt to a recent timestamp", () => {
    const before = Date.now();
    const el = createElement("ellipse", baseOpts);
    const after = Date.now();
    expect(el.createdAt).toBeGreaterThanOrEqual(before);
    expect(el.createdAt).toBeLessThanOrEqual(after);
  });
});

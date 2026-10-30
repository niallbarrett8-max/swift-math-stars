import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAdventureQuestion, generateQuestion } from "../lib/game";

const useRandomValues = (...values: number[]) => {
  let index = 0;
  vi.spyOn(Math, "random").mockImplementation(
    () => values[index++] ?? values[values.length - 1] ?? 0,
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Daily Challenge question generation", () => {
  it("randomizes the larger-range operand's side for medium addition", () => {
    useRandomValues(0, 0.999, 0, 0.1);
    const largerFirst = generateAdventureQuestion("medium");
    expect(largerFirst).toEqual({ a: 20, b: 1, op: "add", answer: 21 });

    vi.restoreAllMocks();
    useRandomValues(0, 0.999, 0, 0.9);
    const singleDigitFirst = generateAdventureQuestion("medium");
    expect(singleDigitFirst).toEqual({ a: 1, b: 20, op: "add", answer: 21 });
  });

  it("uses the 1–50 and 1–9 ranges for hard addition", () => {
    useRandomValues(0, 0.999, 0.999, 0.9);
    expect(generateAdventureQuestion("hard")).toEqual({
      a: 9,
      b: 50,
      op: "add",
      answer: 59,
    });
  });

  it("keeps medium and hard subtraction nonnegative with a 1–9 subtrahend", () => {
    useRandomValues(0.3, 0, 0.9);
    expect(generateAdventureQuestion("medium")).toEqual({
      a: 1,
      b: 1,
      op: "sub",
      answer: 0,
    });

    vi.restoreAllMocks();
    useRandomValues(0.3, 0.999, 0.999);
    expect(generateAdventureQuestion("hard")).toEqual({
      a: 50,
      b: 9,
      op: "sub",
      answer: 41,
    });
  });

  it("keeps Easy adventure questions and multiplication/division ranges unchanged", () => {
    useRandomValues(0, 0.999, 0.7);
    expect(generateAdventureQuestion("easy")).toEqual({
      a: 5,
      b: 4,
      op: "add",
      answer: 9,
    });

    vi.restoreAllMocks();
    useRandomValues(0.55, 0.999, 0.999);
    expect(generateAdventureQuestion("medium")).toEqual({
      a: 10,
      b: 10,
      op: "mul",
      answer: 100,
    });

    vi.restoreAllMocks();
    useRandomValues(0.8, 0.999, 0.999);
    expect(generateAdventureQuestion("hard")).toEqual({
      a: 144,
      b: 12,
      op: "div",
      answer: 12,
    });
  });

  it("leaves regular-game question ranges unchanged", () => {
    useRandomValues(0.999, 0.999);
    expect(generateQuestion("add", "medium")).toEqual({
      a: 20,
      b: 20,
      op: "add",
      answer: 40,
    });
  });
});

import { describe, expect, it } from "vitest";

import { cartTotal } from "../src/cart.js";

describe("cartTotal", () => {
  it("adds each line total", () => {
    expect(
      cartTotal([
        { unitPrice: 12.5, quantity: 2 },
        { unitPrice: 5, quantity: 1 },
      ]),
    ).toBe(30);
  });

  it("rejects invalid quantities", () => {
    expect(() => cartTotal([{ unitPrice: 10, quantity: -1 }])).toThrow(
      "quantity must be a non-negative integer",
    );
  });
});


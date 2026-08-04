import { describe, expect, it } from "vitest";

const runFlakyLab = process.env.RUN_FLAKY_DEMO === "true";

describe.skipIf(!runFlakyLab)("payment provider retry lab", () => {
  it("returns a response before the retry budget is exhausted", () => {
    const shouldSimulateTransientFailure =
      process.env.DEMO_FLAKE_SHOULD_FAIL === "true";

    expect(shouldSimulateTransientFailure).toBe(false);
  });
});

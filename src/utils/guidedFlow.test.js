/**
 * guidedFlow.test.js — Unit tests for the guided-session chaining logic:
 * building the initial uploadConfig, advancing through the step queue with
 * nextGuidedNavigation (including the /thank-you terminal case), and step
 * counting.
 */
import { describe, it, expect } from "vitest";
import {
  DEFAULT_GUIDED_STEPS,
  buildGuidedUploadConfig,
  nextGuidedNavigation,
  totalGuidedSteps,
} from "./guidedFlow";

describe("buildGuidedUploadConfig", () => {
  it("returns the first step with username, guided=true, and the rest queued", () => {
    const cfg = buildGuidedUploadConfig("42");
    expect(cfg.username).toBe("42");
    expect(cfg.guided).toBe(true);
    expect(cfg.kind).toBe(DEFAULT_GUIDED_STEPS[0].kind);
    expect(cfg.route).toBe(DEFAULT_GUIDED_STEPS[0].route);
    expect(cfg.flow).toHaveLength(DEFAULT_GUIDED_STEPS.length - 1);
    expect(cfg.totalSteps).toBe(DEFAULT_GUIDED_STEPS.length);
  });

  it("accepts a custom step list", () => {
    // Custom steps still get normalized through modeConfig (kind must match a
    // MODE_DEFINITIONS entry, route is filled in from mediaMode).
    const custom = [
      { kind: "individual", count: 1, enabled: true },
      { kind: "pairwise", count: 2, enabled: true },
    ];
    const cfg = buildGuidedUploadConfig("7", custom);
    expect(cfg.kind).toBe("individual");
    expect(cfg.flow).toHaveLength(1);
    expect(cfg.flow[0].kind).toBe("pairwise");
    expect(cfg.totalSteps).toBe(2);
  });
});

describe("nextGuidedNavigation", () => {
  it("returns null when not in a guided run", () => {
    expect(nextGuidedNavigation({ guided: false })).toBeNull();
    expect(nextGuidedNavigation(null)).toBeNull();
    expect(nextGuidedNavigation(undefined)).toBeNull();
  });

  it("terminates at /thank-you when flow is empty", () => {
    const cfg = { guided: true, flow: [], username: "1" };
    expect(nextGuidedNavigation(cfg)).toEqual({
      route: "/thank-you",
      uploadConfig: null,
    });
  });

  it("treats undefined flow as empty (terminates at /thank-you)", () => {
    expect(nextGuidedNavigation({ guided: true, username: "1" })).toEqual({
      route: "/thank-you",
      uploadConfig: null,
    });
  });

  it("advances through the full default chain, ending at /thank-you", () => {
    let cfg = buildGuidedUploadConfig("9");
    const visited = [cfg.route];

    while (true) {
      const step = nextGuidedNavigation(cfg);
      visited.push(step.route);
      if (!step.uploadConfig) break;
      cfg = step.uploadConfig;
      // Simulate the calibration-check screen passing through to the
      // actual rate page after a successful gaze validation.
      if (step.route === "/calibration-check") {
        visited.push(cfg.route);
      }
    }

    expect(visited[visited.length - 1]).toBe("/thank-you");
    const ratingRoutes = visited.filter((r) =>
      DEFAULT_GUIDED_STEPS.some((s) => s.route === r)
    );
    expect(ratingRoutes).toEqual(DEFAULT_GUIDED_STEPS.map((s) => s.route));
  });

  it("preserves username across every step", () => {
    let cfg = buildGuidedUploadConfig("123");
    for (let i = 0; i < 10 && cfg; i++) {
      const step = nextGuidedNavigation(cfg);
      if (!step.uploadConfig) break;
      expect(step.uploadConfig.username).toBe("123");
      cfg = step.uploadConfig;
    }
  });

  it("detours through /calibration-check when next step has validateBefore", () => {
    const stepWithValidate = { kind: "x", route: "/x", validateBefore: true };
    const cfg = {
      guided: true, username: "1", flow: [stepWithValidate],
    };
    const result = nextGuidedNavigation(cfg);
    expect(result.route).toBe("/calibration-check");
    expect(result.uploadConfig.route).toBe("/x");
    expect(result.uploadConfig.kind).toBe("x");
  });

  it("does not detour for steps without validateBefore", () => {
    const plainStep = { kind: "x", route: "/x" };
    const cfg = { guided: true, username: "1", flow: [plainStep] };
    expect(nextGuidedNavigation(cfg).route).toBe("/x");
  });
});

describe("totalGuidedSteps", () => {
  it("returns the default count", () => {
    expect(totalGuidedSteps()).toBe(DEFAULT_GUIDED_STEPS.length);
  });

  it("counts a custom step list", () => {
    expect(totalGuidedSteps([{}, {}, {}])).toBe(3);
  });
});

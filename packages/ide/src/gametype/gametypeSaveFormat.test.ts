import { describe, expect, it } from "vitest";
import {
  AUTOSAVE_QUEUE_FILE_SIZE,
  finalizeGametypeSaveBytes,
  padAutosaveQueueBytes,
} from "./gametypeSaveFormat";

describe("autosave queue padding", () => {
  it("zero-pads to 0x6000", () => {
    const input = new Uint8Array([1, 2, 3]);
    const padded = padAutosaveQueueBytes(input);
    expect(padded.length).toBe(AUTOSAVE_QUEUE_FILE_SIZE);
    expect(padded.length).toBe(0x6000);
    expect(padded[0]).toBe(1);
    expect(padded[1]).toBe(2);
    expect(padded[2]).toBe(3);
    expect(padded[3]).toBe(0);
    expect(padded[AUTOSAVE_QUEUE_FILE_SIZE - 1]).toBe(0);
  });

  it("finalizeGametypeSaveBytes only pads asq", () => {
    const input = new Uint8Array(16);
    expect(finalizeGametypeSaveBytes(input, "mpvr").length).toBe(16);
    expect(finalizeGametypeSaveBytes(input, "asq").length).toBe(0x6000);
  });
});

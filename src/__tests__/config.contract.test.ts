import { describe, expect, it } from "vitest";
import { API_BASE_URL, TTS_BASE_URL } from "../config";

describe("runtime config contract", () => {
  it("points the registrar API client at the v1 registrar origin", () => {
    expect(API_BASE_URL).toBe("http://localhost:8709/api/v1");
  });

  it("points direct service clients at their owning origins", () => {
    expect(TTS_BASE_URL).toBe("http://localhost:8700");
  });
});

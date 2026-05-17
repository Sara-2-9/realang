import { LANGUAGES, APPLE_LANGUAGE_CODE_MAP } from "../../constants/languages";

describe("Language constants", () => {
  it("contains at least 29 languages", () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(29);
  });

  it("maps Apple ISO codes correctly", () => {
    expect(APPLE_LANGUAGE_CODE_MAP["English"]).toBe("en");
    expect(APPLE_LANGUAGE_CODE_MAP["Italian"]).toBe("it");
    expect(APPLE_LANGUAGE_CODE_MAP["Japanese"]).toBe("ja");
  });
});

import { describe, it, expect } from "vitest";
import { escapeHtml } from "./email";

describe("escapeHtml", () => {
  it("neutralizes an injection-y customer name", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  it("escapes all five HTML-sensitive characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  it("leaves ordinary names untouched", () => {
    expect(escapeHtml("María José O'Brien")).toBe("María José O&#39;Brien");
    expect(escapeHtml("Jack Ellis")).toBe("Jack Ellis");
  });
});

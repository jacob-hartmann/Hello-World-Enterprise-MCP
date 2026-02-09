import { describe, expect, it } from "vitest";
import {
  CasualGreetingStrategy,
  FormalGreetingStrategy,
  ProfessionalGreetingStrategy,
} from "./greeting-strategies.js";

describe("greeting strategies", () => {
  it("renders casual greeting", () => {
    expect(new CasualGreetingStrategy().render("World")).toBe("Hello World");
  });

  it("renders professional greeting", () => {
    expect(new ProfessionalGreetingStrategy().render("World")).toBe(
      "Hello, World"
    );
  });

  it("renders formal greeting", () => {
    expect(new FormalGreetingStrategy().render("World")).toBe(
      "Greetings, World"
    );
  });
});

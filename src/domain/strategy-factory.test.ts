import { describe, expect, it } from "vitest";
import {
  CasualGreetingStrategy,
  FormalGreetingStrategy,
  ProfessionalGreetingStrategy,
} from "./greeting-strategies.js";
import { GreetingStrategyFactory } from "./strategy-factory.js";

describe("GreetingStrategyFactory", () => {
  it("resolves each supported formality", () => {
    const factory = new GreetingStrategyFactory([
      new CasualGreetingStrategy(),
      new ProfessionalGreetingStrategy(),
      new FormalGreetingStrategy(),
    ]);

    expect(factory.resolve("casual").render("World")).toBe("Hello World");
    expect(factory.resolve("professional").render("World")).toBe(
      "Hello, World"
    );
    expect(factory.resolve("formal").render("World")).toBe("Greetings, World");
  });
});

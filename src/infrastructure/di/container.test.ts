import { describe, expect, it } from "vitest";
import { Container, createToken } from "./container.js";

describe("Container", () => {
  it("resolves singleton values once", () => {
    const container = new Container();
    const token = createToken<{ value: number }>("test-singleton");
    let factoryCalls = 0;

    container.registerSingleton(token, () => {
      factoryCalls += 1;
      return { value: 42 };
    });

    const first = container.resolve(token);
    const second = container.resolve(token);

    expect(first.value).toBe(42);
    expect(second.value).toBe(42);
    expect(factoryCalls).toBe(1);
  });
});

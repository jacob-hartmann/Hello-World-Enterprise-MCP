import type { Formality } from "../contracts/v2.js";
import type { GreetingStrategy } from "./greeting-strategies.js";

export class GreetingStrategyFactory {
  private readonly strategies: Map<Formality, GreetingStrategy>;

  public constructor(strategies: GreetingStrategy[]) {
    this.strategies = new Map<Formality, GreetingStrategy>(
      strategies.map((strategy) => [strategy.formality, strategy])
    );
  }

  public resolve(formality: Formality): GreetingStrategy {
    const strategy = this.strategies.get(formality);
    if (!strategy) {
      throw new Error(
        `No greeting strategy found for formality "${formality}"`
      );
    }

    return strategy;
  }
}

import type { Formality } from "../contracts/v2.js";

export interface GreetingStrategy {
  readonly formality: Formality;
  render(recipient: string): string;
}

export class CasualGreetingStrategy implements GreetingStrategy {
  public readonly formality = "casual" as const;

  public render(recipient: string): string {
    return `Hello ${recipient}`;
  }
}

export class ProfessionalGreetingStrategy implements GreetingStrategy {
  public readonly formality = "professional" as const;

  public render(recipient: string): string {
    return `Hello, ${recipient}`;
  }
}

export class FormalGreetingStrategy implements GreetingStrategy {
  public readonly formality = "formal" as const;

  public render(recipient: string): string {
    return `Greetings, ${recipient}`;
  }
}

import type { StepResult } from "../contracts/v2.js";

export class CompensationEngine {
  public compensate(steps: StepResult[]): StepResult[] {
    const completed = steps.filter((step) => {
      return step.status === "completed";
    });

    return completed
      .slice()
      .reverse()
      .map((step) => {
        return {
          step: step.step,
          status: "compensated",
          message: `Compensated ${step.step}`,
        } as const;
      });
  }
}

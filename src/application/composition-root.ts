import { createRequire } from "node:module";
import {
  CasualGreetingStrategy,
  FormalGreetingStrategy,
  ProfessionalGreetingStrategy,
} from "../domain/greeting-strategies.js";
import { PolicyEngine } from "../domain/policy-engine.js";
import { GreetingStrategyFactory } from "../domain/strategy-factory.js";
import { Container, createToken } from "../infrastructure/di/container.js";
import { EventBus } from "../infrastructure/events/event-bus.js";
import { AuditRepository } from "../infrastructure/repositories/audit-repository.js";
import { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import { GreetingOrchestrator } from "./orchestrator.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as {
  version: string;
  name: string;
  description: string;
};

const TOKENS = {
  eventBus: createToken<EventBus>("event-bus"),
  auditRepository: createToken<AuditRepository>("audit-repository"),
  metricsRepository: createToken<MetricsRepository>("metrics-repository"),
  policyEngine: createToken<PolicyEngine>("policy-engine"),
  strategyFactory: createToken<GreetingStrategyFactory>("strategy-factory"),
  orchestrator: createToken<GreetingOrchestrator>("orchestrator"),
};

export interface ApplicationServices {
  orchestrator: GreetingOrchestrator;
  eventBus: EventBus;
  auditRepository: AuditRepository;
  metricsRepository: MetricsRepository;
  packageInfo: {
    name: string;
    version: string;
    description: string;
  };
}

export function composeApplication(): ApplicationServices {
  const container = new Container();

  container.registerSingleton(TOKENS.eventBus, () => {
    return new EventBus();
  });
  container.registerSingleton(TOKENS.auditRepository, () => {
    return new AuditRepository();
  });
  container.registerSingleton(TOKENS.metricsRepository, () => {
    return new MetricsRepository();
  });
  container.registerSingleton(TOKENS.policyEngine, () => {
    return new PolicyEngine();
  });
  container.registerSingleton(TOKENS.strategyFactory, () => {
    return new GreetingStrategyFactory([
      new CasualGreetingStrategy(),
      new ProfessionalGreetingStrategy(),
      new FormalGreetingStrategy(),
    ]);
  });
  container.registerSingleton(TOKENS.orchestrator, (c) => {
    return new GreetingOrchestrator(
      c.resolve(TOKENS.strategyFactory),
      c.resolve(TOKENS.policyEngine),
      c.resolve(TOKENS.eventBus),
      c.resolve(TOKENS.auditRepository),
      c.resolve(TOKENS.metricsRepository)
    );
  });

  const eventBus = container.resolve(TOKENS.eventBus);
  const auditRepository = container.resolve(TOKENS.auditRepository);
  eventBus.subscribe("*", (event) => {
    auditRepository.append(event);
  });

  return {
    orchestrator: container.resolve(TOKENS.orchestrator),
    eventBus,
    auditRepository,
    metricsRepository: container.resolve(TOKENS.metricsRepository),
    packageInfo: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    },
  };
}

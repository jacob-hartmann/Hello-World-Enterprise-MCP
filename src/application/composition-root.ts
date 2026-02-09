import { createRequire } from "node:module";
import { SQLITE_DB_PATH } from "../constants.js";
import {
  CasualGreetingStrategy,
  FormalGreetingStrategy,
  ProfessionalGreetingStrategy,
} from "../domain/greeting-strategies.js";
import { PolicyEngine } from "../domain/policy-engine.js";
import { AiEnhancementEngine } from "../domain/ai-enhancement-engine.js";
import { EsgOffsetEngine } from "../domain/esg-offset-engine.js";
import { GreetingStrategyFactory } from "../domain/strategy-factory.js";
import { MoatScoringEngine } from "../domain/moat-scoring-engine.js";
import { RunbookGenerationEngine } from "../domain/runbook-generation-engine.js";
import { Container, createToken } from "../infrastructure/di/container.js";
import { EventBus } from "../infrastructure/events/event-bus.js";
import { AiEnrichmentRepository } from "../infrastructure/repositories/ai-enrichment-repository.js";
import { AuditRepository } from "../infrastructure/repositories/audit-repository.js";
import { EsgOffsetRepository } from "../infrastructure/repositories/esg-offset-repository.js";
import { EventLogRepository } from "../infrastructure/repositories/event-log-repository.js";
import { IdempotencyRepository } from "../infrastructure/repositories/idempotency-repository.js";
import { IncidentRepository } from "../infrastructure/repositories/incident-repository.js";
import { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import { MoatRepository } from "../infrastructure/repositories/moat-repository.js";
import { ProjectionRepository } from "../infrastructure/repositories/projection-repository.js";
import { RunbookRepository } from "../infrastructure/repositories/runbook-repository.js";
import { RunbookGenerationRepository } from "../infrastructure/repositories/runbook-generation-repository.js";
import { SagaRepository } from "../infrastructure/repositories/saga-repository.js";
import { EnterpriseDatabase } from "../infrastructure/sqlite/database.js";
import { ChaosEngine } from "./chaos-engine.js";
import { CompensationEngine } from "./compensation-engine.js";
import { EnterpriseEnrichmentPipeline } from "./enterprise-enrichment-pipeline.js";
import { GreetingOrchestrator } from "./orchestrator.js";
import { OperationsService } from "./operations-service.js";
import { ProjectionReplayService } from "./projection-replay-service.js";
import { SagaEngine } from "./saga-engine.js";

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
  aiEnhancementEngine: createToken<AiEnhancementEngine>(
    "ai-enhancement-engine"
  ),
  esgOffsetEngine: createToken<EsgOffsetEngine>("esg-offset-engine"),
  moatScoringEngine: createToken<MoatScoringEngine>("moat-scoring-engine"),
  runbookGenerationEngine: createToken<RunbookGenerationEngine>(
    "runbook-generation-engine"
  ),
  policyEngine: createToken<PolicyEngine>("policy-engine"),
  strategyFactory: createToken<GreetingStrategyFactory>("strategy-factory"),
  sqlite: createToken<EnterpriseDatabase>("sqlite"),
  aiEnrichmentRepository: createToken<AiEnrichmentRepository>(
    "ai-enrichment-repository"
  ),
  esgOffsetRepository: createToken<EsgOffsetRepository>(
    "esg-offset-repository"
  ),
  moatRepository: createToken<MoatRepository>("moat-repository"),
  eventLogRepository: createToken<EventLogRepository>("event-log-repository"),
  sagaRepository: createToken<SagaRepository>("saga-repository"),
  idempotencyRepository: createToken<IdempotencyRepository>(
    "idempotency-repository"
  ),
  incidentRepository: createToken<IncidentRepository>("incident-repository"),
  runbookRepository: createToken<RunbookRepository>("runbook-repository"),
  runbookGenerationRepository: createToken<RunbookGenerationRepository>(
    "runbook-generation-repository"
  ),
  projectionRepository: createToken<ProjectionRepository>(
    "projection-repository"
  ),
  chaosEngine: createToken<ChaosEngine>("chaos-engine"),
  compensationEngine: createToken<CompensationEngine>("compensation-engine"),
  operationsService: createToken<OperationsService>("operations-service"),
  enrichmentPipeline: createToken<EnterpriseEnrichmentPipeline>(
    "enterprise-enrichment-pipeline"
  ),
  projectionReplayService: createToken<ProjectionReplayService>(
    "projection-replay-service"
  ),
  sagaEngine: createToken<SagaEngine>("saga-engine"),
  orchestrator: createToken<GreetingOrchestrator>("orchestrator"),
};

export interface ApplicationServices {
  orchestrator: GreetingOrchestrator;
  projectionReplayService: ProjectionReplayService;
  operationsService: OperationsService;
  eventBus: EventBus;
  auditRepository: AuditRepository;
  eventLogRepository: EventLogRepository;
  incidentRepository: IncidentRepository;
  runbookRepository: RunbookRepository;
  runbookGenerationRepository: RunbookGenerationRepository;
  aiEnrichmentRepository: AiEnrichmentRepository;
  esgOffsetRepository: EsgOffsetRepository;
  moatRepository: MoatRepository;
  metricsRepository: MetricsRepository;
  packageInfo: {
    name: string;
    version: string;
    description: string;
  };
}

export interface CompositionOptions {
  dbPath?: string;
}

export function composeApplication(
  options?: CompositionOptions
): ApplicationServices {
  const container = new Container();
  const dbPath =
    options?.dbPath ?? process.env["ENTERPRISE_DB_PATH"] ?? SQLITE_DB_PATH;

  container.registerSingleton(TOKENS.eventBus, () => {
    return new EventBus();
  });
  container.registerSingleton(TOKENS.auditRepository, () => {
    return new AuditRepository();
  });
  container.registerSingleton(TOKENS.metricsRepository, () => {
    return new MetricsRepository();
  });
  container.registerSingleton(TOKENS.aiEnhancementEngine, () => {
    return new AiEnhancementEngine();
  });
  container.registerSingleton(TOKENS.esgOffsetEngine, () => {
    return new EsgOffsetEngine();
  });
  container.registerSingleton(TOKENS.moatScoringEngine, () => {
    return new MoatScoringEngine();
  });
  container.registerSingleton(TOKENS.runbookGenerationEngine, () => {
    return new RunbookGenerationEngine();
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
  container.registerSingleton(TOKENS.sqlite, () => {
    return new EnterpriseDatabase(dbPath);
  });
  container.registerSingleton(TOKENS.eventLogRepository, (c) => {
    return new EventLogRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.aiEnrichmentRepository, (c) => {
    return new AiEnrichmentRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.esgOffsetRepository, (c) => {
    return new EsgOffsetRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.moatRepository, (c) => {
    return new MoatRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.sagaRepository, (c) => {
    return new SagaRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.idempotencyRepository, (c) => {
    return new IdempotencyRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.incidentRepository, (c) => {
    return new IncidentRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.runbookRepository, (c) => {
    return new RunbookRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.runbookGenerationRepository, (c) => {
    return new RunbookGenerationRepository(
      c.resolve(TOKENS.sqlite).connection()
    );
  });
  container.registerSingleton(TOKENS.projectionRepository, (c) => {
    return new ProjectionRepository(c.resolve(TOKENS.sqlite).connection());
  });
  container.registerSingleton(TOKENS.chaosEngine, () => {
    return new ChaosEngine();
  });
  container.registerSingleton(TOKENS.compensationEngine, () => {
    return new CompensationEngine();
  });
  container.registerSingleton(TOKENS.operationsService, (c) => {
    return new OperationsService(
      c.resolve(TOKENS.incidentRepository),
      c.resolve(TOKENS.runbookRepository),
      c.resolve(TOKENS.runbookGenerationRepository),
      c.resolve(TOKENS.runbookGenerationEngine)
    );
  });
  container.registerSingleton(TOKENS.enrichmentPipeline, (c) => {
    return new EnterpriseEnrichmentPipeline(
      c.resolve(TOKENS.aiEnhancementEngine),
      c.resolve(TOKENS.esgOffsetEngine),
      c.resolve(TOKENS.moatScoringEngine),
      c.resolve(TOKENS.aiEnrichmentRepository),
      c.resolve(TOKENS.esgOffsetRepository),
      c.resolve(TOKENS.moatRepository),
      c.resolve(TOKENS.metricsRepository)
    );
  });
  container.registerSingleton(TOKENS.projectionReplayService, (c) => {
    return new ProjectionReplayService(
      c.resolve(TOKENS.eventLogRepository),
      c.resolve(TOKENS.projectionRepository)
    );
  });
  container.registerSingleton(TOKENS.sagaEngine, (c) => {
    return new SagaEngine(
      c.resolve(TOKENS.strategyFactory),
      c.resolve(TOKENS.policyEngine),
      c.resolve(TOKENS.eventLogRepository),
      c.resolve(TOKENS.sagaRepository),
      c.resolve(TOKENS.metricsRepository),
      c.resolve(TOKENS.chaosEngine),
      c.resolve(TOKENS.compensationEngine),
      c.resolve(TOKENS.operationsService),
      c.resolve(TOKENS.enrichmentPipeline)
    );
  });
  container.registerSingleton(TOKENS.orchestrator, (c) => {
    return new GreetingOrchestrator(
      c.resolve(TOKENS.sagaEngine),
      c.resolve(TOKENS.eventBus),
      c.resolve(TOKENS.auditRepository),
      c.resolve(TOKENS.eventLogRepository),
      c.resolve(TOKENS.idempotencyRepository),
      c.resolve(TOKENS.metricsRepository),
      c.resolve(TOKENS.projectionReplayService)
    );
  });

  const eventBus = container.resolve(TOKENS.eventBus);
  const auditRepository = container.resolve(TOKENS.auditRepository);
  eventBus.subscribe("*", (event) => {
    auditRepository.append(event);
  });

  return {
    orchestrator: container.resolve(TOKENS.orchestrator),
    projectionReplayService: container.resolve(TOKENS.projectionReplayService),
    operationsService: container.resolve(TOKENS.operationsService),
    eventBus,
    auditRepository,
    eventLogRepository: container.resolve(TOKENS.eventLogRepository),
    incidentRepository: container.resolve(TOKENS.incidentRepository),
    runbookRepository: container.resolve(TOKENS.runbookRepository),
    runbookGenerationRepository: container.resolve(
      TOKENS.runbookGenerationRepository
    ),
    aiEnrichmentRepository: container.resolve(TOKENS.aiEnrichmentRepository),
    esgOffsetRepository: container.resolve(TOKENS.esgOffsetRepository),
    moatRepository: container.resolve(TOKENS.moatRepository),
    metricsRepository: container.resolve(TOKENS.metricsRepository),
    packageInfo: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    },
  };
}

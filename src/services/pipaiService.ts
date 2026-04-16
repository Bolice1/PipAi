import { ExecutorAgent } from "../agents/executorAgent";
import { PlannerAgent } from "../agents/plannerAgent";
import { ResearchAgent } from "../agents/researchAgent";
import { isDatabaseConfigured } from "../config/database";
import { AgentPipeline, type PipelineResult } from "../core/pipeline";
import { AppError } from "../utils/errors";

export class PipAIService {
  private pipeline: AgentPipeline;

  constructor() {
    this.pipeline = new AgentPipeline({
      researchAgent: new ResearchAgent(),
      plannerAgent: new PlannerAgent(),
      executorAgent: new ExecutorAgent(),
    });
  }

  async process(userInput: string): Promise<PipelineResult> {
    if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
      throw new AppError("`input` must be a non-empty string.", 400);
    }

    return this.pipeline.run(userInput, {
      contextLabel: "PipAI Express API",
    });
  }

  getHealth() {
    return {
      status: "ok",
      service: "pipai",
      databaseReady: isDatabaseConfigured(),
      agents: [
        "Agent A - Research & Context Builder",
        "Agent B - Task Planner",
        "Agent C - Executor",
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

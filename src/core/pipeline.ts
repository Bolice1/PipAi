import type { ExecutorAgent, ExecutionPayload } from "../agents/executorAgent";
import type { PlannerAgent, PlannerPayload } from "../agents/plannerAgent";
import type {
  ResearchAgent,
  ResearchOptions,
  ResearchPayload,
} from "../agents/researchAgent";

export interface PipelineResult {
  input: string;
  pipeline: {
    research: ResearchPayload;
    plan: PlannerPayload;
    execution: ExecutionPayload;
  };
  final_output: string;
}

interface AgentPipelineDependencies {
  researchAgent: ResearchAgent;
  plannerAgent: PlannerAgent;
  executorAgent: ExecutorAgent;
}

export class AgentPipeline {
  private researchAgent: ResearchAgent;
  private plannerAgent: PlannerAgent;
  private executorAgent: ExecutorAgent;

  constructor({ researchAgent, plannerAgent, executorAgent }: AgentPipelineDependencies) {
    this.researchAgent = researchAgent;
    this.plannerAgent = plannerAgent;
    this.executorAgent = executorAgent;
  }

  async run(userInput: string, options: ResearchOptions = {}): Promise<PipelineResult> {
    const research = await this.researchAgent.run(userInput, options);
    const plan = await this.plannerAgent.run(research);
    const execution = await this.executorAgent.run(plan, research);

    return {
      input: userInput,
      pipeline: {
        research,
        plan,
        execution,
      },
      final_output: execution.output,
    };
  }
}

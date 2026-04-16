import type { PlannerPayload } from "./plannerAgent";
import type { ResearchPayload } from "./researchAgent";

export interface ExecutionPayload {
  agent: string;
  role: string;
  output: string;
  format: string;
  summary: string[];
}

export class ExecutorAgent {
  readonly name = "Agent C";
  readonly role = "Executor";

  async run(
    plannerPayload: PlannerPayload,
    researchPayload: ResearchPayload,
  ): Promise<ExecutionPayload> {
    const summary = this.buildSummary(researchPayload);
    const output = this.buildMarkdown(plannerPayload, researchPayload, summary);

    return {
      agent: this.name,
      role: this.role,
      output,
      format: plannerPayload.format,
      summary,
    };
  }

  private buildSummary(researchPayload: ResearchPayload): string[] {
    return researchPayload.key_points.map((point) => point.insight);
  }

  private buildMarkdown(
    plannerPayload: PlannerPayload,
    researchPayload: ResearchPayload,
    summary: string[],
  ): string {
    const sections = [
      `# ${researchPayload.topic}`,
      "",
      "## Summary",
      ...summary.map((item) => `- ${item}`),
      "",
      "## Execution Plan",
      ...plannerPayload.instructions.map((item) => `- ${item}`),
    ];

    if (researchPayload.sources.length) {
      sections.push("", "## Sources");
      researchPayload.sources.forEach((source) => {
        sections.push(`- ${source.type}: ${source.reference}`);
      });
    }

    return sections.join("\n");
  }
}

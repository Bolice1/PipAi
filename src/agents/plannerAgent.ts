import type { ResearchPayload } from "./researchAgent";

export interface PlannerPayload {
  agent: string;
  role: string;
  task: string;
  instructions: string[];
  format: string;
  constraints: string[];
  handoff: {
    topic: string;
    keywords: string[];
    insights_available: number;
  };
}

export class PlannerAgent {
  readonly name = "Agent B";
  readonly role = "Task Planner";

  async run(researchPayload: ResearchPayload): Promise<PlannerPayload> {
    const instructions = this.buildInstructions(researchPayload);

    return {
      agent: this.name,
      role: this.role,
      task: "generate_structured_response",
      instructions,
      format: "markdown",
      constraints: [
        "Preserve the original intent of the user request.",
        "Ground the output in the structured context from Agent A.",
        "Keep the response concise and easy to scan.",
      ],
      handoff: {
        topic: researchPayload.topic,
        keywords: researchPayload.keywords,
        insights_available: researchPayload.key_points.length,
      },
    };
  }

  private buildInstructions(researchPayload: ResearchPayload): string[] {
    const instructions = [
      `Focus on the topic: ${researchPayload.topic}.`,
      "Turn the available insights into a clear final response.",
      "Surface the most relevant points before supporting details.",
    ];

    if (researchPayload.keywords.length) {
      instructions.push(
        `Incorporate these keywords when relevant: ${researchPayload.keywords.join(", ")}.`,
      );
    }

    return instructions;
  }
}

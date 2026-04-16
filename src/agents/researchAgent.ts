import {
  extractKeywords,
  normalizeWhitespace,
  splitIntoSentences,
} from "../utils/text";

export interface ResearchKeyPoint {
  id: string;
  insight: string;
  confidence: "low" | "medium" | "high";
}

export interface ResearchSource {
  type: string;
  reference: string;
}

export interface ResearchPayload {
  agent: string;
  role: string;
  topic: string;
  key_points: ResearchKeyPoint[];
  keywords: string[];
  sources: ResearchSource[];
  metadata: {
    sentence_count: number;
    character_count: number;
    generated_at: string;
  };
}

export interface ResearchOptions {
  contextLabel?: string;
}

export class ResearchAgent {
  readonly name = "Agent A";
  readonly role = "Research & Context Builder";

  async run(userInput: string, options: ResearchOptions = {}): Promise<ResearchPayload> {
    const topic = normalizeWhitespace(userInput);
    const sentences = splitIntoSentences(topic);
    const keyPoints = this.buildKeyPoints(topic, sentences);

    return {
      agent: this.name,
      role: this.role,
      topic,
      key_points: keyPoints,
      keywords: extractKeywords(topic),
      sources: this.buildSources(topic, options),
      metadata: {
        sentence_count: sentences.length || 1,
        character_count: topic.length,
        generated_at: new Date().toISOString(),
      },
    };
  }

  private buildKeyPoints(topic: string, sentences: string[]): ResearchKeyPoint[] {
    if (sentences.length > 1) {
      return sentences.map((sentence, index) => ({
        id: `kp_${index + 1}`,
        insight: sentence,
        confidence: "medium" as const,
      }));
    }

    return [
      {
        id: "kp_1",
        insight: `Primary request identified: ${topic}`,
        confidence: "high",
      },
      {
        id: "kp_2",
        insight: "Additional external data may be added later without changing the agent contract.",
        confidence: "medium",
      },
    ];
  }

  private buildSources(topic: string, options: ResearchOptions): ResearchSource[] {
    const sources: ResearchSource[] = [
      {
        type: "user_input",
        reference: topic,
      },
    ];

    if (options.contextLabel) {
      sources.push({
        type: "runtime_context",
        reference: options.contextLabel,
      });
    }

    return sources;
  }
}

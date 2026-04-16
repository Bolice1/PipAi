import { AppError } from "../utils/errors";

type ProviderSecrets = {
  openai: string;
  gemini: string;
  claude: string;
};

type ProviderPipelineResult = {
  input: string;
  provider_mapping: {
    agentA: string;
    agentB: string;
    agentC: string;
  };
  pipeline: {
    research: any;
    plan: any;
    execution: any;
  };
  final_output: string;
};

function extractJson<T>(content: string): T {
  const fenceMatch = content.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenceMatch ? fenceMatch[1] : content;
  return JSON.parse(raw.trim()) as T;
}

async function requestJson(url: string, init: any) {
  const response = await fetch(url, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new AppError(payload?.error?.message || payload?.error || "Provider request failed.", 502);
  }

  return payload;
}

export class ProviderPipelineService {
  async run(userInput: string, secrets: ProviderSecrets): Promise<ProviderPipelineResult> {
    if (!userInput.trim()) {
      throw new AppError("`input` must be a non-empty string.", 400);
    }

    const research = await this.runOpenAIResearch(userInput, secrets.openai);
    const plan = await this.runGeminiPlanner(research, secrets.gemini);
    const execution = await this.runClaudeExecutor(plan, research, secrets.claude);

    return {
      input: userInput,
      provider_mapping: {
        agentA: "OpenAI",
        agentB: "Gemini",
        agentC: "Claude Sonnet",
      },
      pipeline: {
        research,
        plan,
        execution,
      },
      final_output: execution.output,
    };
  }

  private async runOpenAIResearch(userInput: string, apiKey: string) {
    const payload = await requestJson("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are Agent A, a research and context builder. Return only valid JSON with keys: topic, key_points, sources, keywords, metadata. key_points must be an array of objects with id, insight, confidence.",
          },
          {
            role: "user",
            content: `Create a research payload for this request: ${userInput}`,
          },
        ],
      }),
    });

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new AppError("OpenAI did not return a research payload.", 502);
    }

    return extractJson<any>(content);
  }

  private async runGeminiPlanner(research: any, apiKey: string) {
    const payload = await requestJson(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "You are Agent B, a task planner. Return only valid JSON with keys: task, instructions, format, constraints, handoff.",
                },
                {
                  text: `Create the planning payload from this research JSON:\n${JSON.stringify(research)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      },
    );

    const content = payload.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join("\n");

    if (!content) {
      throw new AppError("Gemini did not return a planner payload.", 502);
    }

    return extractJson<any>(content);
  }

  private async runClaudeExecutor(plan: any, research: any, apiKey: string) {
    const payload = await requestJson("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1200,
        system:
          "You are Agent C, the executor. Return only valid JSON with keys: output, format, summary.",
        messages: [
          {
            role: "user",
            content: `Create the execution payload from this plan JSON:\n${JSON.stringify(plan)}\n\nResearch JSON:\n${JSON.stringify(research)}`,
          },
        ],
      }),
    });

    const content = payload.content?.map((item: any) => item.text).join("\n");

    if (!content) {
      throw new AppError("Claude did not return an execution payload.", 502);
    }

    return extractJson<any>(content);
  }
}

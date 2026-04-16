import { isDatabaseConfigured } from "../config/database";
import { PipelineRunModel } from "../models/pipelineRunModel";
import { AppError } from "../utils/errors";

function ensureDatabase() {
  if (!isDatabaseConfigured()) {
    throw new AppError("Database is not configured. Set MONGODB_URI to enable history.", 503);
  }
}

export type PipelineRunHistoryItem = {
  id: string;
  input: string;
  finalOutput: string;
  summary: string[];
  status: "success" | "failed";
  errorMessage: string | null;
  providerMapping: {
    agentA: string;
    agentB: string;
    agentC: string;
  };
  createdAt: string;
};

export class HistoryService {
  async recordRun(input: {
    userId: string;
    userInput: string;
    finalOutput: string;
    summary: string[];
    providerMapping: { agentA: string; agentB: string; agentC: string };
    status: "success" | "failed";
    errorMessage?: string | null;
  }) {
    ensureDatabase();

    await PipelineRunModel.create({
      userId: input.userId,
      input: input.userInput,
      providerMapping: input.providerMapping,
      finalOutput: input.finalOutput,
      summary: input.summary,
      status: input.status,
      errorMessage: input.errorMessage || null,
    });
  }

  async listRuns(userId: string): Promise<PipelineRunHistoryItem[]> {
    ensureDatabase();

    const runs = await PipelineRunModel.find({ userId }).sort({ createdAt: -1 }).limit(20);

    return runs.map((run: any) => ({
      id: String(run._id),
      input: run.input,
      finalOutput: run.finalOutput,
      summary: run.summary || [],
      status: run.status,
      errorMessage: run.errorMessage || null,
      providerMapping: run.providerMapping,
      createdAt: run.createdAt?.toISOString?.() || new Date().toISOString(),
    }));
  }
}

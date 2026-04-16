import express from "express";
import type { PipAIService } from "../services/pipaiService";

type RequestLike = {
  body?: {
    input?: string;
  };
};

type ResponseLike = {
  json: (payload: unknown) => void;
  status: (code: number) => ResponseLike;
};

type NextFunctionLike = (error?: unknown) => void;

export function createPipelineRouter(pipaiService: PipAIService) {
  const router = express.Router();

  router.get("/health", (_req: RequestLike, res: ResponseLike) => {
    res.json(pipaiService.getHealth());
  });

  router.post(
    "/pipeline/run",
    async (req: RequestLike, res: ResponseLike, next: NextFunctionLike) => {
      try {
        const result = await pipaiService.process(req.body?.input || "");
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/demo/agents", (_req: RequestLike, res: ResponseLike) => {
    res.json({
      headline: "Agent A to Agent C demo pipeline",
      description:
        "The public landing page uses example agents to show how PipAI stages research, planning, and execution.",
      agents: [
        { id: "agent-a", name: "Agent A", role: "Research & Context Builder" },
        { id: "agent-b", name: "Agent B", role: "Task Planner" },
        { id: "agent-c", name: "Agent C", role: "Executor" },
      ],
    });
  });

  return router;
}

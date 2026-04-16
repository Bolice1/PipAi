import express from "express";
import { requireAuth, type AuthenticatedRequestLike } from "../middleware/authMiddleware";
import { HistoryService } from "../services/historyService";
import { ProviderPipelineService } from "../services/providerPipelineService";
import { UserService } from "../services/userService";

type ResponseLike = {
  json: (payload: unknown) => void;
  status: (code: number) => ResponseLike;
};

type NextFunctionLike = (error?: unknown) => void;

type DashboardBody = {
  input?: string;
  providerKeys?: {
    openai?: string;
    gemini?: string;
    claude?: string;
  };
};

export function createDashboardRouter(
  userService: UserService,
  providerPipelineService: ProviderPipelineService,
  historyService: HistoryService,
) {
  const router = express.Router();

  router.use(requireAuth);

  router.get(
    "/profile",
    async (req: AuthenticatedRequestLike, res: ResponseLike, next: NextFunctionLike) => {
      try {
        const user = await userService.getProfile(req.auth!.userId);
        res.status(200).json({ user });
      } catch (error) {
      next(error);
      }
    },
  );

  router.get(
    "/history",
    async (req: AuthenticatedRequestLike, res: ResponseLike, next: NextFunctionLike) => {
      try {
        const history = await historyService.listRuns(req.auth!.userId);
        res.status(200).json({ history });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/keys",
    async (
      req: AuthenticatedRequestLike & { body?: DashboardBody },
      res: ResponseLike,
      next: NextFunctionLike,
    ) => {
      try {
        await providerPipelineService.validateProviderKeys({
          openai: req.body?.providerKeys?.openai,
          gemini: req.body?.providerKeys?.gemini,
          claude: req.body?.providerKeys?.claude,
        });

        const user = await userService.saveProviderKeys(req.auth!.userId, {
          openai: req.body?.providerKeys?.openai,
          gemini: req.body?.providerKeys?.gemini,
          claude: req.body?.providerKeys?.claude,
        });

        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/pipeline/run",
    async (
      req: AuthenticatedRequestLike & { body?: DashboardBody },
      res: ResponseLike,
      next: NextFunctionLike,
    ) => {
      try {
        const secrets = await userService.getDecryptedProviderKeys(req.auth!.userId);
        const result = await providerPipelineService.run(req.body?.input || "", secrets);
        await historyService.recordRun({
          userId: req.auth!.userId,
          userInput: req.body?.input || "",
          finalOutput: result.final_output,
          summary: result.pipeline.execution.summary || [],
          providerMapping: result.provider_mapping!,
          status: "success",
        });
        res.status(200).json(result);
      } catch (error) {
        if (req.body?.input?.trim()) {
          await historyService
            .recordRun({
              userId: req.auth!.userId,
              userInput: req.body.input,
              finalOutput: "",
              summary: [],
              providerMapping: {
                agentA: "OpenAI",
                agentB: "Gemini",
                agentC: "Claude Sonnet",
              },
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Pipeline run failed.",
            })
            .catch(() => undefined);
        }
        next(error);
      }
    },
  );

  return router;
}

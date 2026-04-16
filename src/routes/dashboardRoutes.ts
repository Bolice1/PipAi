import express from "express";
import { requireAuth, type AuthenticatedRequestLike } from "../middleware/authMiddleware";
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

  router.post(
    "/keys",
    async (
      req: AuthenticatedRequestLike & { body?: DashboardBody },
      res: ResponseLike,
      next: NextFunctionLike,
    ) => {
      try {
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
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

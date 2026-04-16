import express from "express";
import { requireAuth, type AuthenticatedRequestLike } from "../middleware/authMiddleware";
import { UserService } from "../services/userService";

type ResponseLike = {
  json: (payload: unknown) => void;
  status: (code: number) => ResponseLike;
};

type NextFunctionLike = (error?: unknown) => void;

type AuthBody = {
  name?: string;
  email?: string;
  password?: string;
};

export function createAuthRouter(userService: UserService) {
  const router = express.Router();

  router.post(
    "/register",
    async (req: { body?: AuthBody }, res: ResponseLike, next: NextFunctionLike) => {
      try {
        const result = await userService.register({
          name: req.body?.name || "",
          email: req.body?.email || "",
          password: req.body?.password || "",
        });

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/login",
    async (req: { body?: AuthBody }, res: ResponseLike, next: NextFunctionLike) => {
      try {
        const result = await userService.login({
          email: req.body?.email || "",
          password: req.body?.password || "",
        });

        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/me",
    requireAuth,
    async (req: AuthenticatedRequestLike, res: ResponseLike, next: NextFunctionLike) => {
      try {
        const profile = await userService.getProfile(req.auth!.userId);
        res.status(200).json({ user: profile });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

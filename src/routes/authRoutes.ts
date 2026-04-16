import express from "express";
import { requireAuth, type AuthenticatedRequestLike } from "../middleware/authMiddleware";
import { UserService } from "../services/userService";
import { buildClearedSessionCookie, buildSessionCookie } from "../utils/cookies";

type ResponseLike = {
  json: (payload: unknown) => void;
  status: (code: number) => ResponseLike;
  setHeader: (name: string, value: string) => void;
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

        res.setHeader("Set-Cookie", buildSessionCookie(result.token));
        res.status(201).json({ user: result.user });
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

        res.setHeader("Set-Cookie", buildSessionCookie(result.token));
        res.status(200).json({ user: result.user });
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

  router.post("/logout", (_req: { body?: AuthBody }, res: ResponseLike) => {
    res.setHeader("Set-Cookie", buildClearedSessionCookie());
    res.status(200).json({ ok: true });
  });

  return router;
}

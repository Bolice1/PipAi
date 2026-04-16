import { AppError } from "../utils/errors";
import { verifyAuthToken } from "../utils/crypto";
import { readCookieValue, SESSION_COOKIE_NAME } from "../utils/cookies";

export type AuthenticatedRequestLike = {
  headers?: Record<string, string | undefined>;
  auth?: {
    userId: string;
  };
};

type ResponseLike = unknown;
type NextFunctionLike = (error?: unknown) => void;

export function requireAuth(
  req: AuthenticatedRequestLike,
  _res: ResponseLike,
  next: NextFunctionLike,
) {
  const authorization = req.headers?.authorization || req.headers?.Authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const cookieToken = readCookieValue(req.headers?.cookie, SESSION_COOKIE_NAME);
  const token = bearerToken || cookieToken;

  if (!token) {
    next(new AppError("Authentication required.", 401));
    return;
  }

  const session = verifyAuthToken(token);

  if (!session) {
    next(new AppError("Invalid or expired session.", 401));
    return;
  }

  req.auth = session;
  next();
}

import { env } from "../config/env";

const SESSION_COOKIE_NAME = "pipai_session";

function cookieBaseAttributes() {
  const attributes = ["Path=/", "HttpOnly", "SameSite=Lax"];

  if (env.nodeEnv === "production") {
    attributes.push("Secure");
  }

  return attributes;
}

export function buildSessionCookie(token: string): string {
  return [`${SESSION_COOKIE_NAME}=${token}`, ...cookieBaseAttributes(), "Max-Age=604800"].join(
    "; ",
  );
}

export function buildClearedSessionCookie(): string {
  return [`${SESSION_COOKIE_NAME}=`, ...cookieBaseAttributes(), "Max-Age=0"].join("; ");
}

export function readCookieValue(cookieHeader: string | undefined, name: string): string {
  if (!cookieHeader) {
    return "";
  }

  const pairs = cookieHeader.split(";").map((item) => item.trim());
  const match = pairs.find((pair) => pair.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export { SESSION_COOKIE_NAME };

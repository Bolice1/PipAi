import { AppError } from "../utils/errors";
import {
  createAuthToken,
  decryptSecret,
  encryptSecret,
  hashPassword,
  verifyPassword,
} from "../utils/crypto";
import { UserModel } from "../models/userModel";
import { isDatabaseConfigured } from "../config/database";

export type ProviderName = "openai" | "gemini" | "claude";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  providers: Record<ProviderName, { connected: boolean; updatedAt: string | null }>;
};

export type UserSecrets = Record<ProviderName, string>;

function ensureDatabase() {
  if (!isDatabaseConfigured()) {
    throw new AppError("Database is not configured. Set MONGODB_URI to enable accounts.", 503);
  }
}

function sanitizeUser(user: any): UserProfile {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    providers: {
      openai: {
        connected: Boolean(user.providerKeys?.openai?.encryptedKey),
        updatedAt: user.providerKeys?.openai?.updatedAt?.toISOString?.() || null,
      },
      gemini: {
        connected: Boolean(user.providerKeys?.gemini?.encryptedKey),
        updatedAt: user.providerKeys?.gemini?.updatedAt?.toISOString?.() || null,
      },
      claude: {
        connected: Boolean(user.providerKeys?.claude?.encryptedKey),
        updatedAt: user.providerKeys?.claude?.updatedAt?.toISOString?.() || null,
      },
    },
  };
}

export class UserService {
  async register(input: { name: string; email: string; password: string }) {
    ensureDatabase();

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!name || !email || !password) {
      throw new AppError("Name, email, and password are required.", 400);
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      throw new AppError("An account already exists for that email.", 409);
    }

    const user = await UserModel.create({
      name,
      email,
      passwordHash: hashPassword(password),
    });

    return {
      token: createAuthToken(String(user._id)),
      user: sanitizeUser(user),
    };
  }

  async login(input: { email: string; password: string }) {
    ensureDatabase();

    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!email || !password) {
      throw new AppError("Email and password are required.", 400);
    }

    const user = await UserModel.findOne({ email });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AppError("Invalid email or password.", 401);
    }

    return {
      token: createAuthToken(String(user._id)),
      user: sanitizeUser(user),
    };
  }

  async getProfile(userId: string) {
    ensureDatabase();

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return sanitizeUser(user);
  }

  async saveProviderKeys(userId: string, providerKeys: Partial<UserSecrets>) {
    ensureDatabase();

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    (["openai", "gemini", "claude"] as ProviderName[]).forEach((provider) => {
      const key = providerKeys[provider];

      if (typeof key === "string" && key.trim()) {
        user.providerKeys[provider] = {
          encryptedKey: encryptSecret(key.trim()),
          updatedAt: new Date(),
        };
      }
    });

    await user.save();

    return sanitizeUser(user);
  }

  async getDecryptedProviderKeys(userId: string): Promise<UserSecrets> {
    ensureDatabase();

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const providerKeys = {
      openai: user.providerKeys?.openai?.encryptedKey
        ? decryptSecret(user.providerKeys.openai.encryptedKey)
        : "",
      gemini: user.providerKeys?.gemini?.encryptedKey
        ? decryptSecret(user.providerKeys.gemini.encryptedKey)
        : "",
      claude: user.providerKeys?.claude?.encryptedKey
        ? decryptSecret(user.providerKeys.claude.encryptedKey)
        : "",
    };

    if (!providerKeys.openai || !providerKeys.gemini || !providerKeys.claude) {
      throw new AppError(
        "Please save OpenAI, Gemini, and Claude keys in your dashboard before running the private workspace.",
        400,
      );
    }

    return providerKeys;
  }
}

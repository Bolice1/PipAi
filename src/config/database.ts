const mongoose = require("mongoose");

import { env } from "./env";

let connectionPromise: Promise<void> | null = null;

export function connectDatabase(): Promise<void> {
  if (!env.mongoUri) {
    return Promise.resolve();
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri).then(() => undefined);
  }

  return connectionPromise || Promise.resolve();
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.mongoUri);
}

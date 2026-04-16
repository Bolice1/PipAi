import { createApp } from "./app";
import { connectDatabase, isDatabaseConfigured } from "./config/database";
import { env } from "./config/env";

const app = createApp();

connectDatabase()
  .then(() => {
    if (isDatabaseConfigured()) {
      console.log("MongoDB connected for PipAI accounts.");
    } else {
      console.log("MongoDB not configured. Landing page and demo mode are available.");
    }

    app.listen(env.port, () => {
      console.log(`PipAI server running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  })
  .catch((error: { message?: string }) => {
    console.log(`Failed to start PipAI: ${error.message || "database connection failed"}`);
    process.exit(1);
  });

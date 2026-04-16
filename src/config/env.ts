export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number.parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGODB_URI || "",
  appSecret: process.env.APP_SECRET || "pipai-dev-secret-change-me",
};

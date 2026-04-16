import express from "express";
import { createPipelineRouter } from "./routes/pipelineRoutes";
import { PipAIService } from "./services/pipaiService";
import { AppError } from "./utils/errors";

type RequestLike = {
  method: string;
  originalUrl: string;
};

type ResponseLike = {
  json: (payload: unknown) => void;
  status: (code: number) => ResponseLike;
  sendFile: (path: string, options?: { root?: string }) => void;
};

type NextFunctionLike = (error?: unknown) => void;

type ErrorLike = {
  message?: string;
  statusCode?: number;
  details?: unknown;
};

export function createApp() {
  const app = express();
  const pipaiService = new PipAIService();

  app.use(express.json());
  app.use(express.static("public"));

  app.get("/", (_req: RequestLike, res: ResponseLike) => {
    res.sendFile("index.html", { root: "public" });
  });

  app.use("/api", createPipelineRouter(pipaiService));

  app.use((req: RequestLike, _res: ResponseLike, next: NextFunctionLike) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
  });

  app.use(
    (error: ErrorLike, _req: RequestLike, res: ResponseLike, _next: NextFunctionLike) => {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: error.message || "Internal Server Error",
        details: error.details || null,
      });
    },
  );

  return app;
}

const mongoose = require("mongoose");

const pipelineRunSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    input: { type: String, required: true },
    providerMapping: {
      agentA: { type: String, required: true },
      agentB: { type: String, required: true },
      agentC: { type: String, required: true },
    },
    finalOutput: { type: String, required: true },
    summary: { type: [String], default: [] },
    status: { type: String, enum: ["success", "failed"], required: true },
    errorMessage: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

export const PipelineRunModel =
  mongoose.models.PipelineRun || mongoose.model("PipelineRun", pipelineRunSchema);

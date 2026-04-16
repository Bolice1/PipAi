require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp } = require("../src/app.ts");
const { PipAIService } = require("../src/services/pipaiService.ts");

test("PipAIService exposes health metadata", () => {
  const service = new PipAIService();
  const health = service.getHealth();

  assert.equal(health.status, "ok");
  assert.equal(health.service, "pipai");
  assert.equal(health.agents.length, 3);
});

test("PipAIService runs the three-agent pipeline", async () => {
  const service = new PipAIService();
  const result = await service.process(
    "Design a launch plan for a campus AI club and present it clearly.",
  );

  assert.equal(result.pipeline.research.agent, "Agent A");
  assert.equal(result.pipeline.plan.agent, "Agent B");
  assert.equal(result.pipeline.execution.agent, "Agent C");
  assert.match(result.final_output, /# Design a launch plan/i);
  assert.equal(result.pipeline.research.sources[1].reference, "PipAI Express API");
});

test("PipAIService validates missing input", async () => {
  const service = new PipAIService();

  await assert.rejects(
    () => service.process(""),
    /non-empty string/i,
  );
});

test("createApp registers the expected routes", () => {
  const app = createApp();
  const routeStack = app.router.stack;
  const routePaths = routeStack.map((layer) => layer.route?.path).filter(Boolean);
  const layerNames = routeStack.map((layer) => layer.name);

  assert.ok(routePaths.includes("/"));
  assert.ok(layerNames.includes("router"));
});

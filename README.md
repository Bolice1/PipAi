# PipAI

**PipAI** is a lightweight multi-agent AI system where three specialized agents collaborate in a pipeline to produce accurate, structured, and efficient outputs.

---

## 🚀 Overview

PipAI is designed around a simple but powerful idea:

```
Agent A → Agent B → Agent C
```

Each agent has a clearly defined responsibility, ensuring modularity, scalability, and better performance compared to single-agent systems.

---

## 🧠 Architecture

### 🔎 Agent A — Research & Context Builder

**Role:** Collect and structure relevant information

**Responsibilities:**

* Perform research (APIs, web, databases)
* Extract key insights
* Clean and organize data
* Output structured JSON

**Output Example:**

```json
{
  "topic": "Example Topic",
  "key_points": [],
  "sources": []
}
```

---

### Agent B — Task Planner

**Role:** Convert structured data into an actionable plan

**Responsibilities:**

* Analyze data from Agent A
* Define the task clearly
* Generate structured instructions
* Specify output format and constraints

**Output Example:**

```json
{
  "task": "generate_output",
  "instructions": [],
  "format": "markdown"
}
```

---

### Agent C — Executor

**Role:** Execute the task and produce final output

**Responsibilities:**

* Interpret instructions from Agent B
* Generate the final result
* Follow formatting rules strictly

---

## 🔄 Workflow

```javascript
const result = await agentC(
  agentB(
    agentA(userInput)
  )
);
```
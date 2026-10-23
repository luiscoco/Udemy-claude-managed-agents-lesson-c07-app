# C07 · Session Outcomes and Stop Reasons

Runs a real session and classifies its observed stop reason. The sample displays pauses; it does not implement approvals, resume or remote interrupt cleanup.

## Concepts students will learn

- Idle is not always completed
- Classify pauses, termination and incomplete streams
- Keep event evidence alongside an answer

## Configure and run

Use Node.js 24 or later. In PowerShell, from this repository's folder:

```powershell
node --version
npm ci
Copy-Item .env.example .env
notepad .env
```

Use your own Anthropic API key and an existing agent ID and environment ID.

For the optional live path, set your API key, then run npm run setup if you do not already have resource IDs. The script creates the environment before a text-only agent, saves each ID immediately, and reuses IDs already configured. It uses CLAUDE_MODEL or the source default; choose a model available to your account. An uncertain network failure may have created a resource: inspect your account before retrying.

```powershell
npm start
```

Open `http://127.0.0.1:3007`. Navigation leads to `/guide.html#learning`, `/guide.html#run-guide`, `/architecture.html`, and the application lab. If you change `PORT`, use the configured port. Keep the terminal running; stop with Ctrl+C. `npm run dev` also starts the web application.

Open the lab, read the stated resource operation, and press the main Run button once. Inspect the returned IDs, configuration or events. Each live run can create a remote resource.

## Create your .env file

Copy `.env.example` to `.env` and enter your own values. Do not commit the real file. Restart the server after editing it. The example contains safe placeholders; optional settings may be left blank to use source defaults. Resource IDs and keys stay on the server.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MANAGED_AGENT_ID=your_agent_id
CLAUDE_MANAGED_ENVIRONMENT_ID=your_environment_id
PORT=3007
```

## How the app was build

### 1. Classify lifecycle and stop reason together

Terminated, incomplete, requires-action, budget pause and ordinary end_turn have different outcomes. The interrupted flag is an input to the classifier; the current web path passes false and does not implement a cancellation workflow.

Source: [src/outcome.ts](src/outcome.ts#L2)

```typescript
export function classify(
  status: string,
  reason: string | undefined,
  interrupted: boolean,
): Outcome {
  if (status === "terminated") return "terminated";
  if (status !== "idle") return "incomplete";
  if (reason === "requires_action") return "requires-action";
  if (reason === "budget_reached") return "paused-budget";
  if (reason === "end_turn") return interrupted ? "interrupted" : "completed";
  return "error";
}
```

### 2. Apply the classifier to observed idle state

The stream handler sends both the stop reason and classified outcome to the browser. A pause does not become completed merely because some answer text was received.

Source: [src/server.ts](src/server.ts#L27)

```typescript
if (event.type === "session.status_idle") {
  outcome = classify("idle", event.stop_reason.type, false);
  send("reason", event.stop_reason.type);
  break;
}
```

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.

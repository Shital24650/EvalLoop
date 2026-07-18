# ⚡ EvalLoop
### Autonomous Agent Reliability Engine

EvalLoop autonomously tests and improves AI agent 
prompts through an intelligent evaluation loop 
powered by GPT-5.6.

## What it does
- Generates 20 adversarial edge case tests
- Runs your agent against all tests
- Categorizes failures across 5 dimensions
- Rewrites weak prompt sections automatically
- Iterates until reliability threshold reached
- Shows complete before/after analysis

## Tech Stack
- React frontend
- Node.js + Express backend
- GPT-5.6 (OpenAI)
- Built with Codex during OpenAI Build Week 2026

## Setup
1. Clone this repo
2. Add your OpenAI API key:
   cd backend
   echo "OPENAI_API_KEY=your-key-here" > .env
3. Install and run:
   cd backend && npm install && npm start
   cd frontend && npm install && npm start
4. Open http://localhost:3000

## Failure Categories
Powered by AgentTrust benchmark:
1. Hallucination
2. Prompt Misread  
3. Bad Tool Call
4. Context Overflow
5. Reasoning Loop


## Vercel Deployment
Set the Vercel root directory to `evalloop`.

- Install Command: `npm install && npm --prefix frontend install`
- Build Command: `npm --prefix frontend run build`
- Output Directory: `frontend/dist`

Environment variables:
- `OPENAI_API_KEY` — required for backend API routes
- `FRONTEND_ORIGIN` — optional comma-separated allowed frontend origins
- `VITE_API_URL` — optional; use `/api` for same-origin Vercel deployments

## CI/CD Integration
Export your EvalLoop test suite as JSON and 
drop it into any CI/CD pipeline:
- GitHub Actions
- Jenkins
- CircleCI
- Any custom pipeline

The exported JSON contains all failed test cases,
expected behaviors, failure evidence, and the 
reliability threshold to enforce on every deployment.

## Built by
Shital Parab
github.com/shitalparab/agenttrust
OpenAI Build Week 2026

## Developer Tooling
- CLI: `node cli/evalloop.js evaluate "your prompt"`
- CI gate: `EVALLOOP_THRESHOLD=90 node cli/evalloop.js ci "your prompt"`
- API docs: `/api/openapi.json` and `/api/docs`
- Architecture: `docs/ARCHITECTURE.md`
- Developer guide: `docs/DEVELOPER_GUIDE.md`
- Contribution guide: `docs/CONTRIBUTING.md`

## Deployment Targets
EvalLoop includes deploy-ready configuration for:
- Vercel (`vercel.json`)
- Docker (`Dockerfile`)
- Render (`render.yaml`)
- Railway (`railway.json`)

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

## Built by
Shital Parab
github.com/shitalparab/agenttrust
OpenAI Build Week 2026

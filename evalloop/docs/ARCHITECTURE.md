# EvalLoop Architecture

```mermaid
flowchart LR
  UI[React UI] --> API[Express API]
  API --> OpenAI[GPT-5.6]
  UI --> Reports[JSON/MD/PDF/HTML/SARIF/JUnit]
  CLI[evalloop-cli] --> API
  CI[GitHub Actions] --> CLI
```

EvalLoop uses a batched evaluation path for core test runs, dedicated security and chain-testing endpoints for advanced analysis, and export formats that fit CI/CD systems.

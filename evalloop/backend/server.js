import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { rateLimit, requestLogger, securityHeaders } from './middleware.js';
import { openApiDocument } from './openapi.js';

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);
app.use(securityHeaders);
app.use(requestLogger);
app.use(rateLimit);
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'evalloop-api' }));
app.get('/api/openapi.json', (_req, res) => res.status(200).json(openApiDocument));
app.get('/api/docs', (_req, res) => res.type('html').send('<!doctype html><title>EvalLoop API</title><pre>' + JSON.stringify(openApiDocument, null, 2) + '</pre>'));
app.use('/api', apiRoutes);
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((err, _req, res, _next) => {
  const status = Number(err.status || err.statusCode || 500);
  console.error(err);
  res.status(status).json({ error: err.message || 'Unexpected server error' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`EvalLoop API listening on ${PORT}`));
}

export default app;

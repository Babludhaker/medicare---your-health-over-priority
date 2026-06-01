"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");

const env = require("./config/env");
const logger = require("./config/logger");
const apiRouter = require("./routes");
const { generalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

/**
 * Build and configure the Express application.
 * Kept separate from server.js so it can be imported by tests.
 */
function createApp() {
  const app = express();

  // Trust the proxy (Render / Railway / nginx) so req.ip is correct.
  app.set("trust proxy", 1);

  // --- Security & platform middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(compression());

  // --- Body parsing ---
  // The Razorpay webhook needs the raw body for signature verification;
  // capture it here while still JSON-parsing for normal use.
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // --- Request logging ---
  app.use(pinoHttp({ logger, autoLogging: !env.isDev }));

  // --- Rate limiting (global baseline) ---
  app.use(generalLimiter);

  // --- Root ---
  app.get("/", (req, res) => {
    res.json({
      success: true,
      data: {
        name: "MediCare Connect API",
        version: "1.0.0",
        docs: `${env.API_PREFIX}/health`,
      },
    });
  });

  // --- API routes ---
  app.use(env.API_PREFIX, apiRouter);

  // --- 404 + error handling (must be last) ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

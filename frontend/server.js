import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3013;

const PAYU_DOMAINS = ["https://secure.payu.in", "https://sandboxsecure.payu.in"];

async function createServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(compression());

  // Cheap DoS guard: each request here does a data fetch + full SSR render,
  // far more expensive than serving a static asset.
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString("base64");
    res.locals.cspNonce = nonce;
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", `'nonce-${nonce}'`, "https://www.googletagmanager.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
          imgSrc: [
            "'self'",
            "data:",
            "https://api.shop99.co.in",
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
          ],
          connectSrc: [
            "'self'",
            "https://api.shop99.co.in",
            "https://www.google-analytics.com",
            "https://www.googletagmanager.com",
          ],
          // Checkout submits a real <form> POST to PayU — without this,
          // form-action falls back to default-src 'self' and silently breaks it.
          formAction: ["'self'", ...PAYU_DOMAINS],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })(req, res, next);
  });

  let vite;
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      "/assets",
      express.static(path.resolve(__dirname, "dist/client/assets"), {
        immutable: true,
        maxAge: "1y",
      }),
    );
    app.use(express.static(path.resolve(__dirname, "dist/client"), { index: false }));
  }

  app.use(async (req, res) => {
    const url = req.originalUrl;

    try {
      let template;
      let render;

      if (!isProd) {
        template = await fs.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/entry-server.jsx")).render;
      } else {
        template = await fs.readFile(path.resolve(__dirname, "dist/client/index.html"), "utf-8");
        render = (await import("./dist/server/entry-server.js")).render;
      }

      const { html: appHtml, helmet: helmetTags, initialData } = await render(url);

      const headTags = helmetTags
        ? `${helmetTags.title.toString()}${helmetTags.meta.toString()}${helmetTags.link.toString()}`
        : "";

      // Escape "<" so an attacker-influenced value in initialData can't break
      // out of the inline <script> and inject markup/script of its own.
      const serializedData = JSON.stringify(initialData || {}).replace(/</g, "\\u003c");

      const finalHtml = template
        .replace("<!--app-head-->", headTags)
        .replace("<!--app-html-->", appHtml)
        .replace(
          "</body>",
          `<script nonce="${res.locals.cspNonce}">window.__SSR_DATA__=${serializedData}</script></body>`,
        )
        .replace(/__CSP_NONCE__/g, res.locals.cspNonce);

      res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
    } catch (err) {
      if (!isProd && vite) vite.ssrFixStacktrace(err);
      console.error("SSR render failed for", url, err);

      // Degrade to the plain client-only shell rather than 500ing — the app
      // still works, it just hydrates and fetches client-side like before SSR.
      try {
        const fallbackPath = path.resolve(
          __dirname,
          isProd ? "dist/client/index.html" : "index.html",
        );
        let fallback = await fs.readFile(fallbackPath, "utf-8");
        fallback = fallback.replace(/__CSP_NONCE__/g, res.locals.cspNonce || "");
        res.status(200).set({ "Content-Type": "text/html" }).end(fallback);
      } catch {
        res.status(500).end("Internal Server Error");
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`SSR server running at http://localhost:${PORT} (${isProd ? "production" : "development"})`);
  });
}

createServer();

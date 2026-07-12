import { Router, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { load as yamlLoad } from "js-yaml";

const router = Router();

// Resolve the spec from the monorepo root — works in both dev and prod
// since the server always runs from /home/runner/workspace
const SPEC_PATH = resolve(process.cwd(), "lib/api-spec/openapi.yaml");

let spec: Record<string, unknown>;
try {
  spec = yamlLoad(readFileSync(SPEC_PATH, "utf8")) as Record<string, unknown>;
} catch (err) {
  console.error("[docs] Could not load OpenAPI spec:", err);
  spec = { openapi: "3.1.0", info: { title: "TransitOps API", version: "0.1.0" }, paths: {} };
}

const swaggerOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: "TransitOps API Docs",
  customCss: `
    .swagger-ui .topbar { background-color: #111111; border-bottom: 1px solid #1f1f1f; }
    .swagger-ui .topbar-wrapper .link { display: none; }
    .swagger-ui .topbar-wrapper::before {
      content: "TransitOps API";
      color: #f59e0b;
      font-size: 1.2rem;
      font-weight: 700;
      font-family: monospace;
      letter-spacing: 0.05em;
      padding-left: 1rem;
    }
    .swagger-ui { background: #0a0a0a; }
    .swagger-ui .scheme-container { background: #111111; box-shadow: none; border-bottom: 1px solid #1f1f1f; }
    body { background: #0a0a0a; }
  `,
  swaggerOptions: {
    persistAuthorization: true,        // keep the Bearer token between page reloads
    displayRequestDuration: true,      // show response time on each request
    filter: true,                      // enable endpoint search/filter
    tryItOutEnabled: false,            // don't auto-enable "Try it out"
    docExpansion: "list",              // start collapsed to list view
    defaultModelsExpandDepth: 2,
  },
};

// GET /api/docs  — Swagger UI
router.use("/docs", swaggerUi.serve);
router.get("/docs", swaggerUi.setup(spec, swaggerOptions));

// GET /api/docs.json  — raw JSON spec (useful for importing into Postman / Insomnia)
router.get("/docs.json", (_req: Request, res: Response) => {
  res.json(spec);
});

export default router;

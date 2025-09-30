import express, { type Request, Response, NextFunction } from "express";
import net from "net";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seed } from "./seed";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed the database if the RESET_DB environment variable is set
  if (process.env.RESET_DB) {
    await seed();
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the port specified in the environment variable PORT.
  // In development, if the preferred port is taken, automatically fall back
  // to the next available port. In production, we strictly use the provided port.

  async function isPortAvailable(portToCheck: number): Promise<boolean> {
    return await new Promise((resolve) => {
      const tester = net
        .createServer()
        .once("error", () => resolve(false))
        .once("listening", () => {
          tester.close(() => resolve(true));
        })
        .listen(portToCheck, "0.0.0.0");
    });
  }

  async function findAvailablePort(
    startPort: number,
    maxAttempts = 32
  ): Promise<number> {
    for (
      let candidate = startPort;
      candidate < startPort + maxAttempts;
      candidate++
    ) {
      // eslint-disable-next-line no-await-in-loop
      if (await isPortAvailable(candidate)) return candidate;
    }
    // As a last resort, ask the OS for a random free port
    return await new Promise<number>((resolve) => {
      const tempServer = net.createServer();
      tempServer.listen(0, "0.0.0.0", () => {
        const address = tempServer.address();
        const resolved =
          typeof address === "object" && address ? address.port : startPort;
        tempServer.close(() => resolve(resolved));
      });
    });
  }

  const preferredPort = parseInt(process.env.PORT || "5000", 10);
  const isDevelopment = app.get("env") === "development";
  const chosenPort = isDevelopment
    ? await findAvailablePort(preferredPort)
    : preferredPort;

  if (isDevelopment && chosenPort !== preferredPort) {
    log(
      `preferred port ${preferredPort} in use, falling back to ${chosenPort}`
    );
  }

  server.listen(chosenPort, "0.0.0.0", () => {
    log(`serving on port ${chosenPort}`);
  });
})();

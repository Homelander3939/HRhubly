import { createLogger } from "vite";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  stacks?: string[];
  extra?: any;
}

interface ClientLogRequest {
  logs: LogEntry[];
}

export interface ConsoleForwardOptions {
  /**
   * Whether to enable console forwarding (default: true in dev mode)
   */
  enabled?: boolean;
  /**
   * API endpoint path (default: '/api/debug/client-logs')
   */
  endpoint?: string;
  /**
   * Console levels to forward (default: ['log', 'warn', 'error', 'info', 'debug'])
   */
  levels?: ("log" | "warn" | "error" | "info" | "debug")[];
}

const logger = createLogger("info", {
  prefix: "[browser]",
});

export function consoleForwardPlugin(
  options: ConsoleForwardOptions = {},
): Plugin {
  const {
    enabled = true,
    endpoint = "/api/debug/client-logs",
    levels = ["log", "warn", "error", "info", "debug"],
  } = options;

  const virtualModuleId = "virtual:console-forward";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "console-forward",

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!enabled) {
          return html;
        }

        // Check if the virtual module is already imported
        if (html.includes("virtual:console-forward")) {
          return html;
        }

        // Inject the import script in the head section
        return html.replace(
          /<head[^>]*>/i,
          (match) =>
            `${match}\n    <script type="module">import "virtual:console-forward";</script>`,
        );
      },
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!enabled) {
          return "export default {};";
        }

        // Create the console forwarding code with improved error handling
        return `
// Console forwarding module with improved error handling
const originalMethods = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

const logBuffer = [];
let flushTimeout = null;
const FLUSH_DELAY = 500; // Increased delay to reduce request frequency
const MAX_BUFFER_SIZE = 25; // Reduced buffer size
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function createLogEntry(level, args) {
  const stacks = [];
  const extra = [];

  try {
    const message = args.map((arg) => {
      if (arg === undefined) return "undefined";
      if (typeof arg === "string") return arg;
      if (arg instanceof Error || typeof arg.stack === "string") {
        let stringifiedError = arg.toString();
        if (arg.stack) {
          let stack = arg.stack.toString();
          if (stack.startsWith(stringifiedError)) {
            stack = stack.slice(stringifiedError.length).trimStart();
          }
          if (stack) {
            stacks.push(stack);
          }
        }
        return stringifiedError;
      }
      if (typeof arg === "object" && arg !== null) {
        try {
          const serialized = JSON.parse(JSON.stringify(arg));
          extra.push(serialized);
          return "[extra#" + extra.length + "]";
        } catch {
          extra.push(String(arg));
          return "[extra#" + extra.length + "]";
        }
      }
      return String(arg);
    }).join(" ");

    return {
      level,
      message: message.slice(0, 1000), // Limit message length
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stacks: stacks.slice(0, 3), // Limit stack traces
      extra: extra.slice(0, 3), // Limit extra data
    };
  } catch (error) {
    // Fallback for any serialization errors
    return {
      level,
      message: "Error creating log entry: " + String(error),
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stacks: [],
      extra: [],
    };
  }
}

async function sendLogsWithRetry(logs, retries = 0) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch("${endpoint}", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify({ logs }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    return await response.json();
  } catch (error) {
    if (retries < MAX_RETRIES && !error.name === 'AbortError') {
      console.warn(\`Console forwarding failed (attempt \${retries + 1}/\${MAX_RETRIES + 1}): \${error.message}\`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return sendLogsWithRetry(logs, retries + 1);
    } else {
      // Fail silently after max retries to prevent infinite loops
      console.warn('Console forwarding failed after max retries:', error.message);
    }
  }
}

function flushLogs() {
  if (logBuffer.length === 0) return;
  
  const logsToSend = [...logBuffer];
  logBuffer.length = 0;
  
  // Don't await this to prevent blocking
  sendLogsWithRetry(logsToSend).catch(() => {
    // Already handled in sendLogsWithRetry
  });
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
}

function addToBuffer(entry) {
  // Skip if we're getting too many logs to prevent overwhelming the server
  if (logBuffer.length >= MAX_BUFFER_SIZE * 2) {
    return;
  }
  
  logBuffer.push(entry);
  
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs();
    return;
  }
  
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushLogs, FLUSH_DELAY);
  }
}

// Patch console methods
${levels
  .map(
    (level) => `
console.${level} = function(...args) {
  originalMethods.${level}(...args);
  try {
    const entry = createLogEntry("${level}", args);
    addToBuffer(entry);
  } catch (error) {
    // Silently ignore errors in log forwarding to prevent infinite loops
  }
};`,
  )
  .join("")}

// Cleanup handlers
window.addEventListener("beforeunload", () => {
  try {
    flushLogs();
  } catch (error) {
    // Ignore errors during cleanup
  }
});

// Periodic flush with error handling
setInterval(() => {
  try {
    flushLogs();
  } catch (error) {
    // Ignore errors during periodic flush
  }
}, 10000);

export default { flushLogs };
        `;
      }
    },

    configureServer(server) {
      // Add API endpoint to handle forwarded console logs
      server.middlewares.use(endpoint, (req, res, next) => {
        const request = req as IncomingMessage & { method?: string };
        if (request.method !== "POST") {
          return next();
        }

        let body = "";
        request.setEncoding("utf8");

        // Add timeout handling
        const timeout = setTimeout(() => {
          if (!res.headersSent) {
            res.writeHead(408, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Request timeout" }));
          }
        }, 10000);

        request.on("data", (chunk: string) => {
          body += chunk;
          
          // Prevent overly large payloads
          if (body.length > 50000) { // 50KB limit
            clearTimeout(timeout);
            if (!res.headersSent) {
              res.writeHead(413, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Payload too large" }));
            }
            return;
          }
        });

        request.on("end", () => {
          clearTimeout(timeout);
          
          try {
            if (res.headersSent) return;
            
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { logs }: ClientLogRequest = JSON.parse(body);

            if (!Array.isArray(logs)) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid logs format" }));
              return;
            }

            // Forward each log to the Vite dev server console using Vite's logger
            logs.slice(0, 50).forEach((log) => { // Limit to 50 logs per batch
              try {
                const location = log.url ? ` (${log.url})` : "";
                let message = `[${log.level}] ${log.message}${location}`;

                // Add stack traces if available
                if (log.stacks && log.stacks.length > 0) {
                  message +=
                    "\n" +
                    log.stacks
                      .map((stack) =>
                        stack
                          .split("\n")
                          .slice(0, 10) // Limit stack trace lines
                          .map((line) => `    ${line}`)
                          .join("\n"),
                      )
                      .join("\n");
                }

                // Add extra data if available
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (log.extra && log.extra.length > 0) {
                  const extraStr = JSON.stringify(log.extra.slice(0, 3), null, 2); // Limit extra data
                  message +=
                    "\n    Extra data: " +
                    extraStr
                      .split("\n")
                      .slice(0, 20) // Limit extra data lines
                      .map((line) => `    ${line}`)
                      .join("\n");
                }

                // Use Vite's logger for consistent formatting
                const logOptions = { timestamp: true };
                switch (log.level) {
                  case "error": {
                    const error =
                      log.stacks && log.stacks.length > 0
                        ? new Error(log.stacks.join("\n"))
                        : null;
                    logger.error(message, { ...logOptions, error });
                    break;
                  }
                  case "warn":
                    logger.warn(message, logOptions);
                    break;
                  case "info":
                    logger.info(message, logOptions);
                    break;
                  case "debug":
                    logger.info(message, logOptions);
                    break;
                  default:
                    logger.info(message, logOptions);
                }
              } catch (logError) {
                console.error('Error processing individual log:', logError);
              }
            });

            res.writeHead(200, { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            });
            res.end(JSON.stringify({ success: true, processed: logs.length }));
          } catch (error) {
            server.config.logger.error("Error processing client logs:", {
              timestamp: true,
              error: error as Error,
            });
            
            if (!res.headersSent) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid JSON or processing error" }));
            }
          }
        });

        request.on("error", (error) => {
          clearTimeout(timeout);
          console.error("Request error in console forwarding:", error);
          
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Request error" }));
          }
        });
      });
    },
  };
}

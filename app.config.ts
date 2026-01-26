import { createApp } from "vinxi";
import reactRefresh from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { config } from "vinxi/plugins/config";
import { env } from "./src/server/env";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { consoleForwardPlugin } from "./vite-console-forward-plugin";

// Extract allowed hosts from BASE_URL
function getAllowedHosts() {
  const hosts = [];
  
  if (env.BASE_URL) {
    try {
      const url = new URL(env.BASE_URL);
      hosts.push(url.hostname);
      
      // Also allow subdomains for business-specific URLs
      if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        hosts.push(`*.${url.hostname}`);
      }
    } catch (error) {
      console.warn('Invalid BASE_URL format:', env.BASE_URL);
    }
  }
  
  // Always allow localhost and 127.0.0.1 for development
  hosts.push('localhost', '127.0.0.1', '0.0.0.0');
  
  // Allow preview environments
  if (process.env.NODE_ENV === 'development') {
    hosts.push('*.codapt.app', '*.preview.codapt.app');
  }
  
  return hosts;
}

const allowedHosts = getAllowedHosts();
console.log('Configured allowed hosts:', allowedHosts);

export default createApp({
  server: {
    preset: "node-server",
    experimental: {
      asyncContext: true,
    },
    // Improve error handling
    errorHandler: (error, event) => {
      console.error('Server error:', error);
      return { statusCode: 500, statusMessage: 'Internal Server Error' };
    },
  },
  routers: [
    {
      type: "static",
      name: "public",
      dir: "./public",
    },
    {
      type: "http",
      name: "trpc",
      base: "/trpc",
      handler: "./src/server/trpc/handler.ts",
      target: "server",
      plugins: () => [
        config("allowedHosts", {
          server: {
            allowedHosts,
            host: '0.0.0.0', // Allow external connections in Docker
          },
        }),
        tsConfigPaths({
          projects: ["./tsconfig.json"],
        }),
      ],
    },
    {
      type: "http",
      name: "debug",
      base: "/api/debug/client-logs",
      handler: "./src/server/debug/client-logs-handler.ts",
      target: "server",
      plugins: () => [
        config("allowedHosts", {
          server: {
            allowedHosts,
            host: '0.0.0.0',
          },
        }),
        tsConfigPaths({
          projects: ["./tsconfig.json"],
        }),
      ],
    },
    {
      type: "spa",
      name: "client",
      handler: "./index.html",
      target: "browser",
      plugins: () => [
        config("allowedHosts", {
          server: {
            allowedHosts,
            host: '0.0.0.0',
          },
        }),
        tsConfigPaths({
          projects: ["./tsconfig.json"],
        }),
        TanStackRouterVite({
          target: "react",
          autoCodeSplitting: true,
          routesDirectory: "./src/routes",
          generatedRouteTree: "./src/generated/routeTree.gen.ts",
        }),
        reactRefresh(),
        nodePolyfills(),
        consoleForwardPlugin({
          enabled: true,
          endpoint: "/api/debug/client-logs",
          levels: ["log", "warn", "error", "info", "debug"],
        }),
      ],
    },
  ],
});

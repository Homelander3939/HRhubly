import assert from "assert";
import { env } from "../env";

export function getBaseUrl({ port, businessName }: { port?: number; businessName?: string } = {}): string {
  const baseUrl = env.BASE_URL ?? "http://localhost:8000";
  
  if (port === undefined || port === 8000) {
    // it's the primary port
    if (businessName) {
      // Return business-specific subdomain URL
      if (baseUrl.startsWith("http://")) {
        const urlParts = baseUrl.split("://");
        return `${urlParts[0]}://${businessName}.${urlParts[1]}`;
      } else if (baseUrl.startsWith("https://")) {
        const urlParts = baseUrl.split("://");
        return `${urlParts[0]}://${businessName}.${urlParts[1]}`;
      }
    }
    return baseUrl;
  }

  // it's a secondary port
  if (env.BASE_URL_OTHER_PORT) {
    let portUrl = env.BASE_URL_OTHER_PORT.replace("[PORT]", port.toString());
    if (businessName) {
      // Add business subdomain to port URL
      if (portUrl.startsWith("http://")) {
        const urlParts = portUrl.split("://");
        portUrl = `${urlParts[0]}://${businessName}.${urlParts[1]}`;
      } else if (portUrl.startsWith("https://")) {
        const urlParts = portUrl.split("://");
        portUrl = `${urlParts[0]}://${businessName}.${urlParts[1]}`;
      }
    }
    return portUrl;
  }

  const primaryBaseUrl = getBaseUrl({ businessName });
  if (primaryBaseUrl.startsWith("http://")) {
    // it's an http url, so replace the port
    const urlParts = primaryBaseUrl.split("://");
    const hostPart = urlParts[1]!.split(":")[0];
    return `${urlParts[0]}://${hostPart}:${port}`;
  }

  // it's an https url, so replace the subdomain with subdomain--port
  assert(primaryBaseUrl.startsWith("https://"));
  const primaryBaseUrlParts = primaryBaseUrl.split(".");
  return `${primaryBaseUrlParts[0]}--${port}.${primaryBaseUrlParts.slice(1).join(".")}`;
}

// Helper function to extract business name from hostname
export function extractBusinessNameFromHostname(hostname: string): string | null {
  const parts = hostname.split('.');
  
  // Check if we're on a business subdomain (businessname.hr.com or businessname.domain.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
  }
  
  return null;
}

// Helper function to construct business-specific URLs for emails
export function getBusinessSpecificUrl(businessName: string, path: string = ""): string {
  const baseUrl = getBaseUrl({ businessName });
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

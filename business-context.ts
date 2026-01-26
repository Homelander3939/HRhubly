import { db } from "~/server/db";

export interface BusinessContext {
  businessId: number;
  business: {
    id: number;
    name: string;
    displayName: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Consolidated business context resolution utility
 * This ensures consistent business context resolution across all tRPC procedures
 */
export async function getBusinessContext(
  businessId?: number,
  hostname?: string,
  referrerUrl?: string,
  businessName?: string
): Promise<BusinessContext> {
  console.log(`getBusinessContext called with:`, {
    businessId,
    hostname,
    referrerUrl,
    businessName,
    nodeEnv: process.env.NODE_ENV,
  });

  // Direct businessId provided - highest priority
  if (businessId) {
    console.log(`Using direct businessId: ${businessId}`);
    const business = await db.business.findUnique({
      where: { id: businessId },
    });
    
    if (!business) {
      throw new Error("Business not found");
    }
    
    console.log(`Found business by ID: ${business.name} (id: ${business.id})`);
    return { businessId: business.id, business };
  }
  
  // Business name provided - second priority (most common in our routes)
  if (businessName) {
    console.log(`Looking up business by name: ${businessName}`);
    
    // First try to find exact business by name
    let business = await db.business.findUnique({
      where: { name: businessName.toLowerCase() },
    });
    
    if (business) {
      console.log(`Found business by exact name match: ${business.name} (id: ${business.id})`);
      return { businessId: business.id, business };
    }
    
    // If not found and this is a development/preview environment, create the business
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    const isPreviewEnvironment = hostname && (hostname.includes('preview-') || hostname.includes('codapt.app'));
    const isLocalhost = hostname && (hostname.includes('localhost') || hostname.includes('127.0.0.1'));
    
    if (isDevEnvironment || isPreviewEnvironment || isLocalhost) {
      console.log(`Business '${businessName}' not found in development/preview environment, creating it`);
      
      try {
        business = await db.business.create({
          data: {
            name: businessName.toLowerCase(),
            displayName: businessName.charAt(0).toUpperCase() + businessName.slice(1) + ' Company',
            email: `admin@${businessName.toLowerCase()}.com`,
          },
        });
        console.log(`Created new business: ${business.name} (id: ${business.id})`);
        return { businessId: business.id, business };
      } catch (error) {
        console.log(`Failed to create business '${businessName}':`, error);
        // Fall through to fallback logic only if creation fails
      }
    }
    
    // Production: business must exist
    console.log(`Business not found by name: ${businessName}`);
    throw new Error(`Business not found: ${businessName}`);
  }
  
  // Fallback to hostname-based detection
  if (hostname) {
    console.log(`Extracting business context from hostname: ${hostname}`);
    const parts = hostname.split('.');
    console.log(`Hostname parts: [${parts.join(', ')}]`);
    
    // Handle preview URLs like preview-1gxznsg5gonwic4qe19ibb.codapt.app or localhost
    const isPreviewEnvironment = hostname.includes('preview-') || hostname.includes('codapt.app');
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    
    if (isPreviewEnvironment || isLocalhost) {
      console.log('Detected preview/localhost environment');
      
      // For development/preview, try to maintain consistency by using a default business
      // but don't create if it doesn't exist (let it fail to surface the real issue)
      let business = await db.business.findFirst({
        orderBy: { id: 'asc' },
      });
      
      if (!business) {
        throw new Error("No businesses found in preview environment - please create a business first");
      }
      
      console.log(`Using first available business for preview/localhost: ${business.name} (id: ${business.id})`);
      return { businessId: business.id, business };
    }
    
    // Handle production subdomains like businessname.hr.com
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'api' && !subdomain.startsWith('preview-')) {
        console.log(`Extracting business name from subdomain: ${subdomain}`);
        const business = await db.business.findUnique({
          where: { name: subdomain.toLowerCase() },
        });
        
        if (!business) {
          throw new Error(`Business not found: ${subdomain}`);
        }
        
        console.log(`Found business from subdomain: ${business.name} (id: ${business.id})`);
        return { businessId: business.id, business };
      }
    }
  }
  
  console.error(`Could not determine business context - businessId: ${businessId}, businessName: ${businessName}, hostname: ${hostname}`);
  throw new Error("Business context required - please provide businessName or access via business subdomain");
}

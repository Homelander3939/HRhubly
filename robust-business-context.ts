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

interface BusinessResolutionAttempt {
  method: string;
  input: any;
  result: 'success' | 'failed' | 'skipped';
  error?: string;
  businessFound?: any;
}

/**
 * Robust business context resolution utility with comprehensive fallback logic
 * This addresses the "test not found" errors by ensuring business context is always resolved correctly
 */
export async function getRobustBusinessContext(
  businessId?: number,
  hostname?: string,
  referrerUrl?: string,
  businessName?: string
): Promise<BusinessContext> {
  const attempts: BusinessResolutionAttempt[] = [];
  
  console.log(`🔍 getRobustBusinessContext called with:`, {
    businessId,
    hostname,
    referrerUrl,
    businessName,
    nodeEnv: process.env.NODE_ENV,
  });

  // Method 1: Direct businessId (highest priority)
  if (businessId) {
    attempts.push({ method: 'direct-id', input: businessId, result: 'skipped' });
    try {
      const business = await db.business.findUnique({
        where: { id: businessId },
      });
      
      if (business) {
        attempts[attempts.length - 1].result = 'success';
        attempts[attempts.length - 1].businessFound = business;
        console.log(`✅ Method 1 (direct-id): Found business ${business.name} (id: ${business.id})`);
        return { businessId: business.id, business };
      } else {
        attempts[attempts.length - 1].result = 'failed';
        attempts[attempts.length - 1].error = 'Business not found by ID';
        console.log(`❌ Method 1 (direct-id): Business not found for ID ${businessId}`);
      }
    } catch (error) {
      attempts[attempts.length - 1].result = 'failed';
      attempts[attempts.length - 1].error = error.message;
      console.log(`❌ Method 1 (direct-id): Database error: ${error.message}`);
    }
  }

  // Method 2: Business name (most common in routes)
  if (businessName) {
    attempts.push({ method: 'business-name', input: businessName, result: 'skipped' });
    try {
      const normalizedName = businessName.toLowerCase().trim();
      console.log(`🔍 Method 2 (business-name): Looking up business by name: "${normalizedName}"`);
      
      const business = await db.business.findUnique({
        where: { name: normalizedName },
      });
      
      if (business) {
        attempts[attempts.length - 1].result = 'success';
        attempts[attempts.length - 1].businessFound = business;
        console.log(`✅ Method 2 (business-name): Found business ${business.name} (id: ${business.id})`);
        return { businessId: business.id, business };
      } else {
        attempts[attempts.length - 1].result = 'failed';
        attempts[attempts.length - 1].error = 'Business not found by name';
        console.log(`❌ Method 2 (business-name): Business not found for name "${normalizedName}"`);
      }
    } catch (error) {
      attempts[attempts.length - 1].result = 'failed';
      attempts[attempts.length - 1].error = error.message;
      console.log(`❌ Method 2 (business-name): Database error: ${error.message}`);
    }
  }

  // Method 3: Hostname-based extraction (for subdomains)
  if (hostname) {
    attempts.push({ method: 'hostname-subdomain', input: hostname, result: 'skipped' });
    try {
      const extractedBusinessName = extractBusinessNameFromHostname(hostname);
      if (extractedBusinessName) {
        console.log(`🔍 Method 3 (hostname-subdomain): Extracted business name "${extractedBusinessName}" from hostname "${hostname}"`);
        
        const business = await db.business.findUnique({
          where: { name: extractedBusinessName.toLowerCase() },
        });
        
        if (business) {
          attempts[attempts.length - 1].result = 'success';
          attempts[attempts.length - 1].businessFound = business;
          console.log(`✅ Method 3 (hostname-subdomain): Found business ${business.name} (id: ${business.id})`);
          return { businessId: business.id, business };
        } else {
          attempts[attempts.length - 1].result = 'failed';
          attempts[attempts.length - 1].error = `Business not found for extracted name: ${extractedBusinessName}`;
          console.log(`❌ Method 3 (hostname-subdomain): Business not found for extracted name "${extractedBusinessName}"`);
        }
      } else {
        attempts[attempts.length - 1].result = 'failed';
        attempts[attempts.length - 1].error = 'Could not extract business name from hostname';
        console.log(`❌ Method 3 (hostname-subdomain): Could not extract business name from hostname "${hostname}"`);
      }
    } catch (error) {
      attempts[attempts.length - 1].result = 'failed';
      attempts[attempts.length - 1].error = error.message;
      console.log(`❌ Method 3 (hostname-subdomain): Error: ${error.message}`);
    }
  }

  // Method 4: Referrer URL extraction
  if (referrerUrl) {
    attempts.push({ method: 'referrer-url', input: referrerUrl, result: 'skipped' });
    try {
      const extractedBusinessName = extractBusinessNameFromReferrer(referrerUrl);
      if (extractedBusinessName) {
        console.log(`🔍 Method 4 (referrer-url): Extracted business name "${extractedBusinessName}" from referrer "${referrerUrl}"`);
        
        const business = await db.business.findUnique({
          where: { name: extractedBusinessName.toLowerCase() },
        });
        
        if (business) {
          attempts[attempts.length - 1].result = 'success';
          attempts[attempts.length - 1].businessFound = business;
          console.log(`✅ Method 4 (referrer-url): Found business ${business.name} (id: ${business.id})`);
          return { businessId: business.id, business };
        } else {
          attempts[attempts.length - 1].result = 'failed';
          attempts[attempts.length - 1].error = `Business not found for extracted name: ${extractedBusinessName}`;
          console.log(`❌ Method 4 (referrer-url): Business not found for extracted name "${extractedBusinessName}"`);
        }
      } else {
        attempts[attempts.length - 1].result = 'failed';
        attempts[attempts.length - 1].error = 'Could not extract business name from referrer URL';
        console.log(`❌ Method 4 (referrer-url): Could not extract business name from referrer URL "${referrerUrl}"`);
      }
    } catch (error) {
      attempts[attempts.length - 1].result = 'failed';
      attempts[attempts.length - 1].error = error.message;
      console.log(`❌ Method 4 (referrer-url): Error: ${error.message}`);
    }
  }

  // Method 5: Development environment fallback with business creation
  const isDevEnvironment = process.env.NODE_ENV === 'development';
  const isPreviewEnvironment = hostname && (hostname.includes('preview-') || hostname.includes('codapt.app'));
  const isLocalhost = hostname && (hostname.includes('localhost') || hostname.includes('127.0.0.1'));
  
  if ((isDevEnvironment || isPreviewEnvironment || isLocalhost) && businessName) {
    attempts.push({ method: 'dev-create-business', input: businessName, result: 'skipped' });
    try {
      console.log(`🔍 Method 5 (dev-create-business): Creating business "${businessName}" in development environment`);
      
      const normalizedName = businessName.toLowerCase().trim();
      const business = await db.business.create({
        data: {
          name: normalizedName,
          displayName: businessName.charAt(0).toUpperCase() + businessName.slice(1) + ' Company',
          email: `admin@${normalizedName}.com`,
        },
      });
      
      attempts[attempts.length - 1].result = 'success';
      attempts[attempts.length - 1].businessFound = business;
      console.log(`✅ Method 5 (dev-create-business): Created business ${business.name} (id: ${business.id})`);
      return { businessId: business.id, business };
    } catch (error) {
      attempts[attempts.length - 1].result = 'failed';
      attempts[attempts.length - 1].error = error.message;
      console.log(`❌ Method 5 (dev-create-business): Failed to create business: ${error.message}`);
    }
  }

  // Method 6: Last resort - use first available business (development only)
  if (isDevEnvironment || isPreviewEnvironment || isLocalhost) {
    attempts.push({ method: 'dev-first-available', input: 'any', result: 'skipped' });
    try {
      console.log(`🔍 Method 6 (dev-first-available): Using first available business in development environment`);
      
      const business = await db.business.findFirst({
        orderBy: { id: 'asc' },
      });
      
      if (business) {
        attempts[attempts.length - 1].result = 'success';
        attempts[attempts.length - 1].businessFound = business;
        console.log(`✅ Method 6 (dev-first-available): Using business ${business.name} (id: ${business.id})`);
        return { businessId: business.id, business };
      } else {
        attempts[attempts.length - 1].result = 'failed';
        attempts[attempts.length - 1].error = 'No businesses found in database';
        console.log(`❌ Method 6 (dev-first-available): No businesses found in database`);
      }
    } catch (error) {
      attempts[attempts.length - 1].result = 'failed';
      attempts[attempts.length - 1].error = error.message;
      console.log(`❌ Method 6 (dev-first-available): Database error: ${error.message}`);
    }
  }

  // All methods failed - generate comprehensive error message
  console.error(`🚨 All business context resolution methods failed!`);
  console.error(`📋 Resolution attempts summary:`, attempts);
  
  const errorDetails = {
    attempts,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isDevEnvironment,
      isPreviewEnvironment,
      isLocalhost,
    },
    inputs: {
      businessId,
      hostname,
      referrerUrl,
      businessName,
    },
  };
  
  const errorMessage = generateDetailedErrorMessage(errorDetails);
  throw new Error(errorMessage);
}

/**
 * Extract business name from hostname (subdomain-based)
 */
function extractBusinessNameFromHostname(hostname: string): string | null {
  try {
    const parts = hostname.split('.');
    console.log(`🔍 extractBusinessNameFromHostname: hostname parts: [${parts.join(', ')}]`);
    
    // Handle preview URLs like preview-1gxznsg5gonwic4qe19ibb.codapt.app
    if (hostname.includes('preview-') || hostname.includes('codapt.app')) {
      console.log(`🔍 extractBusinessNameFromHostname: Detected preview environment, skipping subdomain extraction`);
      return null;
    }
    
    // Handle localhost and development
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      console.log(`🔍 extractBusinessNameFromHostname: Detected localhost, skipping subdomain extraction`);
      return null;
    }
    
    // Handle production subdomains like businessname.hr.com
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'api' && !subdomain.startsWith('preview-')) {
        console.log(`🔍 extractBusinessNameFromHostname: Extracted subdomain: "${subdomain}"`);
        return subdomain;
      }
    }
    
    console.log(`🔍 extractBusinessNameFromHostname: No valid subdomain found`);
    return null;
  } catch (error) {
    console.log(`🔍 extractBusinessNameFromHostname: Error parsing hostname: ${error.message}`);
    return null;
  }
}

/**
 * Extract business name from referrer URL
 */
function extractBusinessNameFromReferrer(referrerUrl: string): string | null {
  try {
    const url = new URL(referrerUrl);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    
    console.log(`🔍 extractBusinessNameFromReferrer: referrer path parts: [${pathParts.join(', ')}]`);
    
    // Look for business name in path structure
    if (pathParts.length > 0 && pathParts[0] !== 'test' && pathParts[0] !== 'admin') {
      const potentialBusinessName = pathParts[0];
      if (potentialBusinessName.length > 1 && !['api', 'login', 'signup'].includes(potentialBusinessName)) {
        console.log(`🔍 extractBusinessNameFromReferrer: Extracted business name from path: "${potentialBusinessName}"`);
        return potentialBusinessName;
      }
    }
    
    // Try hostname extraction as fallback
    return extractBusinessNameFromHostname(url.hostname);
  } catch (error) {
    console.log(`🔍 extractBusinessNameFromReferrer: Error parsing referrer URL: ${error.message}`);
    return null;
  }
}

/**
 * Generate detailed error message for debugging
 */
function generateDetailedErrorMessage(errorDetails: any): string {
  const { attempts, environment, inputs } = errorDetails;
  
  let message = "Business context resolution failed. ";
  
  // Add specific guidance based on what was tried
  if (inputs.businessName) {
    message += `Could not find business "${inputs.businessName}". `;
  }
  
  if (inputs.hostname) {
    message += `Hostname "${inputs.hostname}" did not resolve to a valid business. `;
  }
  
  // Add environment-specific guidance
  if (environment.isDevEnvironment || environment.isPreviewEnvironment || environment.isLocalhost) {
    message += "In development environment, ensure at least one business exists in the database or provide a valid businessName parameter. ";
  } else {
    message += "In production environment, ensure the business exists and is accessible via the correct subdomain or business name. ";
  }
  
  // Add debugging information
  const failedAttempts = attempts.filter(a => a.result === 'failed');
  if (failedAttempts.length > 0) {
    message += `Failed attempts: ${failedAttempts.map(a => `${a.method} (${a.error})`).join(', ')}. `;
  }
  
  message += "Please check the server logs for detailed debugging information.";
  
  return message;
}

import { env } from "~/server/env";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

type QueuedRequest<T> = {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
  priority: number;
};

type AIRequestOptions = {
  maxRetries?: number;
  priority?: number; // Higher priority = executed first
  timeoutMs?: number;
};

class AIQueueManager {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private maxConcurrentRequests = 2; // Limit concurrent requests to prevent rate limiting
  private minRequestInterval = 1000; // Minimum 1 second between requests
  private lastRequestTime = 0;
  private isProcessing = false;

  constructor() {
    console.log("[AI Queue] Manager initialized");
    console.log(`[AI Queue] Max concurrent requests: ${this.maxConcurrentRequests}`);
    console.log(`[AI Queue] Min request interval: ${this.minRequestInterval}ms`);
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(
    execute: () => Promise<T>,
    options: AIRequestOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      priority = 0,
      timeoutMs = 60000, // 60 second timeout
    } = options;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[AI Queue] Enqueueing request ${requestId} (priority: ${priority})`);

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: requestId,
        execute,
        resolve,
        reject,
        retryCount: 0,
        maxRetries,
        priority,
      };

      // Add to queue (sorted by priority)
      this.queue.push(request);
      this.queue.sort((a, b) => b.priority - a.priority);

      console.log(`[AI Queue] Queue size: ${this.queue.length}, Active: ${this.activeRequests}`);

      // Start processing if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      // Set timeout
      setTimeout(() => {
        const index = this.queue.findIndex(r => r.id === requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error(`Request ${requestId} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
    });
  }

  /**
   * Process the queue
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log("[AI Queue] Starting queue processing");

    while (this.queue.length > 0 || this.activeRequests > 0) {
      // Wait if we've hit the concurrent request limit
      if (this.activeRequests >= this.maxConcurrentRequests) {
        console.log(`[AI Queue] Max concurrent requests reached (${this.activeRequests}/${this.maxConcurrentRequests}), waiting...`);
        await this.sleep(500);
        continue;
      }

      // Wait if we need to respect the minimum interval
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        console.log(`[AI Queue] Waiting ${waitTime}ms to respect rate limit...`);
        await this.sleep(waitTime);
      }

      // Get next request
      const request = this.queue.shift();
      if (!request) {
        await this.sleep(100);
        continue;
      }

      console.log(`[AI Queue] Processing request ${request.id} (retry: ${request.retryCount}/${request.maxRetries})`);

      // Execute request
      this.activeRequests++;
      this.lastRequestTime = Date.now();

      this.executeRequest(request).finally(() => {
        this.activeRequests--;
        console.log(`[AI Queue] Request ${request.id} completed. Active: ${this.activeRequests}, Queue: ${this.queue.length}`);
      });
    }

    this.isProcessing = false;
    console.log("[AI Queue] Queue processing finished");
  }

  /**
   * Execute a single request with retry logic
   */
  private async executeRequest<T>(request: QueuedRequest<T>) {
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error: any) {
      console.error(`[AI Queue] Request ${request.id} failed:`, error.message);

      // Check if it's a rate limit error
      const isRateLimitError = 
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('too many requests') ||
        error.statusCode === 429 ||
        error.code === 'rate_limit_exceeded';

      // Check if we should retry
      if (request.retryCount < request.maxRetries && isRateLimitError) {
        request.retryCount++;
        
        // Exponential backoff: 2^retryCount seconds
        const backoffMs = Math.min(30000, Math.pow(2, request.retryCount) * 1000);
        console.log(`[AI Queue] Rate limit hit. Retrying request ${request.id} in ${backoffMs}ms (attempt ${request.retryCount + 1}/${request.maxRetries + 1})`);

        await this.sleep(backoffMs);

        // Re-add to queue with higher priority
        request.priority += 10;
        this.queue.unshift(request);
        this.queue.sort((a, b) => b.priority - a.priority);
      } else {
        // Max retries reached or non-retryable error
        console.error(`[AI Queue] Request ${request.id} failed permanently after ${request.retryCount} retries`);
        request.reject(error);
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      isProcessing: this.isProcessing,
    };
  }
}

// Singleton instance
export const aiQueueManager = new AIQueueManager();

/**
 * Initialize AI model with fallback options
 * Uses correct OpenRouter model names with fallback logic
 */
export function initializeAIModel(options?: { needsToolCalling?: boolean }) {
  console.log("[AI Model] Initializing model...");
  console.log("[AI Model] OPENROUTER_API_KEY present:", !!env.OPENROUTER_API_KEY);
  console.log("[AI Model] OPENROUTER_API_KEY length:", env.OPENROUTER_API_KEY?.length || 0);
  console.log("[AI Model] Needs tool calling:", options?.needsToolCalling || false);
  
  if (!env.OPENROUTER_API_KEY) {
    const error = new Error("OPENROUTER_API_KEY is not configured. Please set it in your .env file.");
    console.error("[AI Model] ✗ API key missing");
    throw error;
  }
  
  try {
    const openrouter = createOpenRouter({ 
      apiKey: env.OPENROUTER_API_KEY 
    });
    
    // Choose model based on requirements
    // Using CORRECT model names that actually exist on OpenRouter
    let modelNames: string[];
    
    if (options?.needsToolCalling) {
      // Models that support tool calling (function calling)
      // Note: Free models have limited tool calling support
      modelNames = [
        "google/gemini-flash-1.5",           // Primary: Free, supports tools
        "google/gemini-2.0-flash-exp:free",  // Fallback 1: Newer free model
        "meta-llama/llama-3.1-8b-instruct:free", // Fallback 2: Free Llama
      ];
      console.log("[AI Model] Using tool-calling models:", modelNames);
    } else {
      // For simple tasks, use free models
      modelNames = [
        "google/gemini-flash-1.5",           // Primary: Free, fast, reliable
        "google/gemini-2.0-flash-exp:free",  // Fallback 1: Newer experimental
        "meta-llama/llama-3.2-3b-instruct:free", // Fallback 2: Smaller, faster
        "qwen/qwen-2-7b-instruct:free",      // Fallback 3: Alternative free model
      ];
      console.log("[AI Model] Using conversational models:", modelNames);
    }
    
    // Try primary model first
    const primaryModelName = modelNames[0];
    const model = openrouter(primaryModelName);
    
    console.log("[AI Model] ✓ Model initialized successfully:", primaryModelName);
    console.log("[AI Model] Fallback models available:", modelNames.slice(1).join(", "));
    
    return model;
  } catch (error: any) {
    console.error("[AI Model] ✗ Failed to initialize model:", error);
    console.error("[AI Model] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    throw new Error(`Failed to initialize AI model: ${error.message}`);
  }
}

/**
 * Get a working AI model with automatic fallback
 * Tries multiple models until one works
 */
export async function getWorkingAIModel(options?: { needsToolCalling?: boolean }): Promise<any> {
  console.log("[AI Model] Getting working model with fallback...");
  
  const openrouter = createOpenRouter({ 
    apiKey: env.OPENROUTER_API_KEY 
  });
  
  const modelNames = options?.needsToolCalling
    ? [
        "google/gemini-flash-1.5",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.1-8b-instruct:free",
      ]
    : [
        "google/gemini-flash-1.5",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "qwen/qwen-2-7b-instruct:free",
      ];
  
  // Try each model until one works
  for (const modelName of modelNames) {
    try {
      console.log(`[AI Model] Trying model: ${modelName}...`);
      const model = openrouter(modelName);
      
      // Test the model with a simple generation
      const { generateText } = await import("ai");
      const { text } = await generateText({
        model,
        prompt: "Say 'OK' and nothing else.",
        maxTokens: 10,
      });
      
      console.log(`[AI Model] ✓ Model ${modelName} works! Response: "${text}"`);
      return model;
    } catch (error: any) {
      console.warn(`[AI Model] ✗ Model ${modelName} failed:`, error.message);
      // Continue to next model
    }
  }
  
  // If we get here, all models failed
  const error = new Error(
    `All AI models failed. Tried: ${modelNames.join(", ")}. ` +
    `Please check your OPENROUTER_API_KEY and internet connection.`
  );
  console.error("[AI Model] ✗ All models failed");
  throw error;
}

/**
 * Wrap AI SDK calls with queue management and retry logic
 */
export async function queuedAIRequest<T>(
  execute: () => Promise<T>,
  options?: AIRequestOptions
): Promise<T> {
  return aiQueueManager.enqueue(execute, options);
}

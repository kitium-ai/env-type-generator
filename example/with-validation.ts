/**
 * Example: Using env-type-generator with Zod validation
 */

// After running: npx env-type-gen --validation-lib zod --parse-types
// Import the validated env object

// import { env } from './config/env.validator';

// ✅ Type-safe and runtime-validated
// const port: number = env.PORT;
// const enableAnalytics: boolean = env.ENABLE_ANALYTICS;

// console.log(`Server starting on port ${port}`);
// console.log(`Analytics enabled: ${enableAnalytics}`);

// If any required env var is missing, Zod will throw an error at startup
// This prevents runtime errors in production

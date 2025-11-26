/**
 * Example: Basic usage of env-type-generator
 */

// After running: npx env-type-gen
// The generated types will be available

// ✅ Type-safe access to environment variables
const databaseUrl: string = process.env.DATABASE_URL!;
const apiKey: string = process.env.STRIPE_SECRET_KEY!;

console.log('Database URL:', databaseUrl);
console.log('API Key:', apiKey.substring(0, 10) + '...');

// ❌ TypeScript will catch typos
// const invalid = process.env.DATABSE_URL; // Error!

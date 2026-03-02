/**
 * Validate that required environment variables are present at startup.
 * Call this once in main.tsx before rendering the app.
 */
const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key],
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Check your .env file or hosting environment.",
    );
  }
}

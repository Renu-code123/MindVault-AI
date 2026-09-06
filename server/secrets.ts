import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

let cachedKey: string | null = null;
let secretSource: "Secret Manager" | "Environment Secret" | "Not Configured" = "Not Configured";

/**
 * Resolves the Gemini API credential using Google Cloud Secret Manager if configured,
 * or falls back safely to server-side process.env.GEMINI_API_KEY.
 * The secret is never logged, exposed to the client, or leaked in error messages.
 */
export async function getGeminiApiKey(): Promise<{ apiKey: string; source: string }> {
  if (cachedKey) {
    return { apiKey: cachedKey, source: secretSource };
  }

  const projectId = process.env.GCP_PROJECT_ID;
  const secretName = process.env.GEMINI_SECRET_NAME || "gemini-api-key";

  // Attempt Google Cloud Secret Manager if project ID is provided
  if (projectId) {
    try {
      const client = new SecretManagerServiceClient();
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload && payload.trim().length > 0) {
        cachedKey = payload.trim();
        secretSource = "Secret Manager";
        return { apiKey: cachedKey, source: secretSource };
      }
    } catch (err) {
      // Safe non-leaking fallback log
      console.warn("Secret Manager lookup not accessible, falling back to environment secret.");
    }
  }

  // Fallback to process.env.GEMINI_API_KEY or process.env.API_KEY injected securely by AI Studio / Cloud Run
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (envKey && envKey.trim().length > 0) {
    cachedKey = envKey.trim();
    secretSource = "Environment Secret";
    return { apiKey: cachedKey, source: secretSource };
  }

  throw new Error("Gemini API key is not configured on the server. Please verify Secret Manager or GEMINI_API_KEY environment variable.");
}

export function getSecretSource(): string {
  return secretSource;
}

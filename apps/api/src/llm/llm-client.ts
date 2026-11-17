import { z } from 'zod';

/**
 * The single entry point for AI calls. Everything that knows about a specific provider lives behind this interface.
 * This gives: swapping providers without rewriting logic, substituting a Fake in tests, and unified cost accounting.
 */

export const LlmUsageSchema = z.object({
  model: z.string().min(1),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costUsd: z.number().finite().nonnegative(),
});

export type LlmUsage = z.infer<typeof LlmUsageSchema>;

export interface StructuredRequest<T> {
  userId: string;
  /** Feature name for accounting: parse_job, tailor_resume, ... */
  feature: string;
  /** Model tier: cheap for parsing, stronger for rewriting. */
  tier: 'fast' | 'strong';
  system: string;
  /** Untrusted data (job text, resume) is always passed here, never in system. */
  userContent: string;
  schema: z.ZodType<T>;
  /** Optional: images for vision requests (screenshots). */
  images?: { mediaType: 'image/png' | 'image/jpeg' | 'image/webp'; base64: string }[];
  maxRetries?: number;
}

export interface StructuredResult<T> {
  data: T;
  usage: LlmUsage;
}

export interface LlmClient {
  generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');

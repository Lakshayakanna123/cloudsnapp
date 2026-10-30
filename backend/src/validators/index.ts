import { z } from 'zod';
import { ValidationError } from '../utils/response';
import { config } from '../utils/clients';

export const uploadUrlSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[^/\\:*?"<>|]+$/, 'Filename contains invalid characters'),
  contentType: z
    .string()
    .refine(
      (ct) => (config.allowedContentTypes as readonly string[]).includes(ct),
      `Unsupported content type. Allowed: ${config.allowedContentTypes.join(', ')}`
    ),
  fileSize: z
    .number()
    .int()
    .positive('File size must be positive')
    .max(config.maxFileSizeBytes, `File size exceeds maximum allowed size`),
});

export const confirmUploadSchema = z.object({
  photoId: z
    .string()
    .uuid('Invalid photo ID')
    .min(1, 'Photo ID is required'),
});

export const listPhotosSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  nextToken: z.string().optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'name', 'size'])
    .optional()
    .default('newest'),
  search: z.string().max(100).optional(),
  contentType: z.string().optional(),
  favorite: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  collectionId: z.string().optional(),
});

export const updatePhotoSchema = z.object({
  displayName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[^/\\:*?"<>|]+$/, 'Display name contains invalid characters')
    .optional(),
  favorite: z.boolean().optional(),
  collectionIds: z.array(z.string().uuid()).max(50).optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: string | null): T {
  if (!body) throw new ValidationError('Request body is required');
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new ValidationError(messages);
  }
  return result.data;
}

export function parseQueryParams<T>(schema: z.ZodSchema<T>, params: Record<string, string> | null): T {
  const result = schema.safeParse(params || {});
  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new ValidationError(messages);
  }
  return result.data;
}

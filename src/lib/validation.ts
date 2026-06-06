import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema, ZodError } from 'zod'

/**
 * Centralized API validation helper using zod.
 *
 * Usage:
 *   const body = await validateBody(req, MySchema)
 *   if (body instanceof NextResponse) return body
 *   // body is now typed and validated
 */

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

/**
 * Format zod errors into a stable, human-readable shape.
 */
function formatZodError(error: ZodError) {
  return {
    error: 'Validation failed',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  }
}

/**
 * Validate a JSON body against a zod schema.
 * Returns either the validated data or a 400 NextResponse.
 */
export async function validateBody<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      response: NextResponse.json(formatZodError(result.error), { status: 400 }),
    }
  }

  return { data: result.data }
}

/**
 * Validate URL search params against a zod schema.
 * Use for query strings like ?limit=10&offset=0.
 */
export function validateSearchParams<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): { data: z.infer<T> } | { response: NextResponse } {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const result = schema.safeParse(params)
  if (!result.success) {
    return {
      response: NextResponse.json(formatZodError(result.error), { status: 400 }),
    }
  }
  return { data: result.data }
}

// ─── Reusable primitives ──────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')

export const nonEmptyString = (max = 500, field = 'Field') =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} is too long`)

// ─── Route-specific schemas ───────────────────────────────────────────────

export const registerSchema = z.object({
  name: nonEmptyString(80, 'Name'),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const agoraTokenSchema = z.object({
  channel: nonEmptyString(120, 'Channel').regex(/^[A-Za-z0-9_\-]+$/, 'Invalid channel name'),
  uid: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  role: z.enum(['publisher', 'subscriber']).optional(),
})

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: nonEmptyString(8000, 'Message'),
})

export const aiChatSchema = z.object({
  messages: z
    .array(aiChatMessageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Too many messages'),
  system: z.string().max(4000).optional(),
})

export const profileUpdateSchema = z
  .object({
    name: nonEmptyString(80, 'Name').optional(),
    image: z
      .string()
      .url('Image must be a valid URL')
      .max(2048, 'Image URL is too long')
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.image !== undefined, {
    message: 'At least one field must be provided',
  })

export const noteCreateSchema = z.object({
  text: nonEmptyString(2000, 'Note text'),
})

export const noteDeleteSchema = z.object({
  noteId: nonEmptyString(60, 'Note ID'),
})

export const searchHistoryAddSchema = z.object({
  term: nonEmptyString(120, 'Search term'),
})

export const savedWordToggleSchema = z.object({
  wordId: nonEmptyString(60, 'Word ID'),
})

export const matchFindSchema = z.object({
  userId: nonEmptyString(60, 'User ID'),
  userName: nonEmptyString(80, 'User name').optional(),
})

export const matchCancelSchema = z.object({
  userId: nonEmptyString(60, 'User ID'),
})

export const matchEndSchema = z.object({
  matchId: nonEmptyString(80, 'Match ID'),
  userId: nonEmptyString(60, 'User ID'),
})

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint'),
  keys: z.object({
    p256dh: nonEmptyString(200, 'p256dh key'),
    auth: nonEmptyString(60, 'auth key'),
  }),
})

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint'),
})

export const pushSendSchema = z.object({
  userId: nonEmptyString(60, 'User ID'),
  notification: z.object({
    title: nonEmptyString(120, 'Title'),
    body: nonEmptyString(500, 'Body'),
    tag: z.string().max(80).optional(),
    requireInteraction: z.boolean().optional(),
    data: z.record(z.string(), z.any()).optional(),
  }),
})

export const callCreateSchema = z.object({
  channelName: nonEmptyString(120, 'Channel name').optional(),
  receiverId: nonEmptyString(60, 'Receiver ID').optional(),
})

export const callRoomActionSchema = z.object({
  roomId: nonEmptyString(80, 'Room ID'),
})

export const streakUpdateSchema = z.object({
  xp: z.number().int().min(0).max(10000).default(10),
})

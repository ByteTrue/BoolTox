import { z } from 'zod';
import { RoleSlug } from '@booltox/shared';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().default(false),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(32),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().min(32),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  displayName: z.string().min(2).max(60).optional(),
  roles: z.array(z.nativeEnum(RoleSlug)).nonempty(),
});

export const UpdateUserRolesSchema = z.object({
  roles: z.array(z.nativeEnum(RoleSlug)).nonempty(),
});

export const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(3).max(64),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export const RotateApiKeySchema = z.object({
  apiKeyId: z.string().cuid(),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export const UserIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserRolesInput = z.infer<typeof UpdateUserRolesSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type RotateApiKeyInput = z.infer<typeof RotateApiKeySchema>;
export type UserIdParam = z.infer<typeof UserIdParamSchema>;

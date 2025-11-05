import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.service';
import { createError } from '../../common/error.handler';
import { logger } from '../../common/logger.service';
import { securityConfig } from '../../config/server.config';
import {
  PERMISSION_METADATA,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  SYSTEM_ROLE_SLUGS,
} from './auth.constants';
import type {
  CreateApiKeyInput,
  CreateUserInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RotateApiKeyInput,
  UpdateUserRolesInput,
  UpdateUserStatusInput,
} from './auth.schema';
import type { AuthContextMetadata, AuthResponse, AuthTokens, AuthenticatedUser } from './auth.types';
import {
  ALL_PERMISSION_CODES,
  PermissionCode,
  RoleSlug,
  type RolePermissionsMatrix,
} from '@booltox/shared';

const TOKEN_ISSUER = 'booltox-admin';
const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_LENGTH = 64;
const API_KEY_SECRET_BYTES = 32;
const API_KEY_PREFIX_BYTES = 6;

type PrismaUserWithRoles = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

/**
 * 认证服务
 */
class AuthService {
  /**
   * 初始化权限与角色
   */
  async initialize(): Promise<void> {
    logger.info('Initializing authentication system (roles & permissions)');

    const permissionMetadata = PERMISSION_METADATA as Record<
      PermissionCode,
      { description: string; category: string }
    >;

    await prisma.$transaction(async (tx) => {
      // 确保权限存在
      for (const code of ALL_PERMISSION_CODES) {
        await tx.permission.upsert({
          where: { code },
          create: {
            code,
            description: permissionMetadata[code]?.description,
            category: permissionMetadata[code]?.category,
          },
          update: {
            description: permissionMetadata[code]?.description,
            category: permissionMetadata[code]?.category,
          },
        });
      }

      // 确保角色存在
      for (const roleSlug of SYSTEM_ROLE_SLUGS) {
        await tx.role.upsert({
          where: { name: roleSlug },
          create: {
            name: roleSlug,
            description: ROLE_DESCRIPTIONS[roleSlug],
            isSystem: true,
          },
          update: {
            description: ROLE_DESCRIPTIONS[roleSlug],
            isSystem: true,
          },
        });
      }
    });

    // 同步角色权限关系
    const permissions = await prisma.permission.findMany({
      select: { id: true, code: true },
    });
    const permissionIdByCode = new Map<PermissionCode, string>();
    for (const item of permissions) {
      permissionIdByCode.set(item.code as PermissionCode, item.id);
    }

    await prisma.$transaction(async (tx) => {
      for (const roleSlug of SYSTEM_ROLE_SLUGS) {
        const role = await tx.role.findUnique({
          where: { name: roleSlug },
          select: { id: true },
        });

        if (!role) {
          continue;
        }

        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        const desiredPermissions = ROLE_PERMISSIONS[roleSlug as keyof RolePermissionsMatrix] || [];

        if (desiredPermissions.length === 0) {
          continue;
        }

        await tx.rolePermission.createMany({
          data: desiredPermissions
            .map((code) => {
              const permissionId = permissionIdByCode.get(code);
              if (!permissionId) {
                logger.warn({ code }, 'Permission not found when syncing role');
                return null;
              }

              return {
                roleId: role.id,
                permissionId,
              };
            })
            .filter((item): item is { roleId: string; permissionId: string } => Boolean(item)),
          skipDuplicates: true,
        });
      }
    });

    logger.info('Authentication system initialized');
  }

  /**
   * 用户登录
   */
  async login(input: LoginInput, metadata: AuthContextMetadata = {}): Promise<AuthResponse> {
    const { email, password, remember } = input;

    const userRecord = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userRecord) {
      throw createError.unauthorized('账户或密码错误');
    }

    if (!userRecord.isActive) {
      throw createError.forbidden('账户已被禁用，请联系管理员');
    }

    const passwordValid = await argon2.verify(userRecord.passwordHash, password);

    if (!passwordValid) {
      await prisma.user.update({
        where: { id: userRecord.id },
        data: {
          failedLogins: { increment: 1 },
        },
      });

      throw createError.unauthorized('账户或密码错误');
    }

    const authUser = this.mapUserRecord(userRecord);

    const refreshTtlSeconds = remember
      ? Math.min(securityConfig.refreshTokenTtl * 2, 60 * 24 * 60 * 60)
      : securityConfig.refreshTokenTtl;

    const tokens = await this.issueTokens(authUser, metadata, refreshTtlSeconds);

    await prisma.user.update({
      where: { id: userRecord.id },
      data: {
        lastLoginAt: new Date(),
        failedLogins: 0,
      },
    });

    return {
      user: authUser,
      tokens,
    };
  }

  /**
   * 刷新令牌
   */
  async refreshToken(
    input: RefreshTokenInput,
    metadata: AuthContextMetadata = {}
  ): Promise<AuthResponse> {
    const { refreshToken } = input;
    const tokenHash = this.hashToken(refreshToken);

    const existing = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw createError.unauthorized('刷新令牌无效或已失效');
    }

    if (existing.revokedAt) {
      throw createError.unauthorized('刷新令牌已被撤销');
    }

    if (existing.expiresAt < new Date()) {
      throw createError.unauthorized('刷新令牌已过期');
    }

    if (!existing.user.isActive) {
      throw createError.forbidden('账户已被禁用，请联系管理员');
    }

    const authUser = this.mapUserRecord(existing.user);

    const tokens = await this.issueTokens(authUser, metadata);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      user: authUser,
      tokens,
    };
  }

  /**
   * 登出并吊销刷新令牌
   */
  async logout(input: LogoutInput): Promise<void> {
    const { refreshToken } = input;
    const tokenHash = this.hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * 创建后台账户
   */
  async createUser(input: CreateUserInput, operatorId?: string): Promise<AuthenticatedUser> {
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      timeCost: Math.max(2, Math.min(6, securityConfig.passwordHashRounds)),
    });

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          displayName: input.displayName,
        },
      });

      const roles = await tx.role.findMany({
        where: {
          name: {
            in: input.roles,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (roles.length !== input.roles.length) {
        throw createError.validation('存在未定义的角色');
      }

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId: created.id,
          roleId: role.id,
          assignedBy: operatorId ?? created.id,
        })),
        skipDuplicates: true,
      });

      return created;
    });

    const withRelations = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    return this.mapUserRecord(withRelations);
  }

  /**
   * 更新用户角色
   */
  async updateUserRoles(
    userId: string,
    input: UpdateUserRolesInput,
    operatorId?: string
  ): Promise<AuthenticatedUser> {
    return prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });

      const roles = await tx.role.findMany({
        where: {
          name: {
            in: input.roles,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (roles.length !== input.roles.length) {
        throw createError.validation('存在未定义的角色');
      }

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id,
          assignedBy: operatorId ?? null,
        })),
        skipDuplicates: true,
      });

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!updatedUser) {
        throw createError.notFound('用户不存在');
      }

      return this.mapUserRecord(updatedUser);
    });
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: string, input: UpdateUserStatusInput): Promise<AuthenticatedUser> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: input.isActive,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    return this.mapUserRecord(updated);
  }

  /**
   * 创建或旋转 API Key
   */
  async createApiKey(
    userId: string,
    input: CreateApiKeyInput
  ): Promise<{ apiKey: string; keyId: string; expiresAt: Date | null }> {
    const prefix = this.generateApiKeyPrefix();
    const secret = this.generateTokenString(API_KEY_SECRET_BYTES);
    const rawKey = `${prefix}.${secret}`;
    const hashed = this.hashToken(rawKey);

    const ttlDays = input.expiresInDays ?? securityConfig.apiKeyTtlDays;
    const expiresAt = ttlDays > 0 ? new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000) : null;

    const created = await prisma.apiKey.create({
      data: {
        userId,
        name: input.name,
        prefix,
        hashedKey: hashed,
        expiresAt,
      },
    });

    return {
      apiKey: rawKey,
      keyId: created.id,
      expiresAt,
    };
  }

  /**
   * 轮换 API Key
   */
  async rotateApiKey(
    userId: string,
    input: RotateApiKeyInput
  ): Promise<{ apiKey: string; keyId: string; expiresAt: Date | null }> {
    const existing = await prisma.apiKey.findFirst({
      where: {
        id: input.apiKeyId,
        userId,
        revokedAt: null,
      },
    });

    if (!existing) {
      throw createError.notFound('API Key 不存在或已被撤销');
    }

    await prisma.apiKey.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.createApiKey(userId, {
      name: existing.name,
      expiresInDays: input.expiresInDays,
    });
  }

  /**
   * 获取用户 API Key 列表
   */
  async listApiKeys(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * 撤销 API Key
   */
  async revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
    await prisma.apiKey.updateMany({
      where: {
        id: apiKeyId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * 验证并解析 AccessToken
   */
  async verifyAccessToken(token: string): Promise<{
    user: AuthenticatedUser;
    tokenId: string;
  }> {
    try {
      const payload = jwt.verify(token, securityConfig.jwtSecret, {
        issuer: TOKEN_ISSUER,
      }) as jwt.JwtPayload & {
        sub: string;
        email: string;
        tokenType: string;
        roles: RoleSlug[];
        permissions: PermissionCode[];
        jti: string;
      };

      if (payload.tokenType !== ACCESS_TOKEN_TYPE) {
        throw createError.unauthorized('令牌类型无效');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw createError.unauthorized('用户不存在或已被删除');
      }

      if (!user.isActive) {
        throw createError.forbidden('账户已被禁用，请联系管理员');
      }

      const authUser = this.mapUserRecord(user);

      return {
        user: authUser,
        tokenId: payload.jti,
      };
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw createError.unauthorized('访问令牌无效或已过期');
      }
      throw error;
    }
  }

  /**
   * 工具方法：从数据库记录映射为认证用户
   */
  private mapUserRecord(user: PrismaUserWithRoles): AuthenticatedUser {
    const roles = user.roles.map((item) => item.role.name as RoleSlug);
    const permissionSet = new Set<PermissionCode>();

    for (const roleEntry of user.roles) {
      for (const permission of roleEntry.role.permissions) {
        permissionSet.add(permission.permission.code as PermissionCode);
      }
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      roles,
      permissions: Array.from(permissionSet),
    };
  }

  private async issueTokens(
    user: AuthenticatedUser,
    metadata: AuthContextMetadata,
    refreshTtlSeconds = securityConfig.refreshTokenTtl
  ): Promise<AuthTokens> {
    const accessTokenExpiresAt = new Date(Date.now() + securityConfig.accessTokenTtl * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);
    const jwtid = randomUUID();

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tokenType: ACCESS_TOKEN_TYPE,
        roles: user.roles,
        permissions: user.permissions,
      },
      securityConfig.jwtSecret,
      {
        expiresIn: securityConfig.accessTokenTtl,
        issuer: TOKEN_ISSUER,
        jwtid,
      }
    );

    const refreshToken = this.generateTokenString(REFRESH_TOKEN_LENGTH);
    const refreshTokenHash = this.hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        ipAddress: metadata.ip ?? null,
        userAgent: metadata.userAgent ?? null,
      },
    });

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private generateTokenString(bytes: number): string {
    return randomBytes(bytes).toString('base64url');
  }

  private generateApiKeyPrefix(): string {
    return randomBytes(API_KEY_PREFIX_BYTES).toString('hex').slice(0, API_KEY_PREFIX_BYTES * 2);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

export const authService = new AuthService();

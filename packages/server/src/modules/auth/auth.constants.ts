import { ALL_PERMISSION_CODES, PermissionCode, RolePermissionsMatrix, RoleSlug } from '@booltox/shared';

export const ROLE_PERMISSIONS: RolePermissionsMatrix = {
  [RoleSlug.SUPER_ADMIN]: [...ALL_PERMISSION_CODES],
  [RoleSlug.ADMIN]: [
    PermissionCode.RELEASE_READ,
    PermissionCode.RELEASE_WRITE,
    PermissionCode.MODULE_READ,
    PermissionCode.MODULE_WRITE,
    PermissionCode.ANNOUNCEMENT_READ,
    PermissionCode.ANNOUNCEMENT_WRITE,
    PermissionCode.LOG_READ,
    PermissionCode.LOG_WRITE,
    PermissionCode.GITHUB_SYNC,
    PermissionCode.API_KEY_MANAGE,
  ],
  [RoleSlug.EDITOR]: [
    PermissionCode.RELEASE_READ,
    PermissionCode.MODULE_READ,
    PermissionCode.MODULE_WRITE,
    PermissionCode.ANNOUNCEMENT_READ,
    PermissionCode.ANNOUNCEMENT_WRITE,
  ],
  [RoleSlug.SUPPORT]: [
    PermissionCode.RELEASE_READ,
    PermissionCode.MODULE_READ,
    PermissionCode.ANNOUNCEMENT_READ,
    PermissionCode.LOG_READ,
  ],
  [RoleSlug.VIEWER]: [
    PermissionCode.RELEASE_READ,
    PermissionCode.MODULE_READ,
    PermissionCode.ANNOUNCEMENT_READ,
    PermissionCode.LOG_READ,
  ],
};

export const ROLE_DESCRIPTIONS: Record<RoleSlug, string> = {
  [RoleSlug.SUPER_ADMIN]: '拥有系统内全部管理权限的超级管理员',
  [RoleSlug.ADMIN]: '负责日常运营管理的大管理员，具备大部分写权限',
  [RoleSlug.EDITOR]: '内容与模块运营人员，可管理模块与公告',
  [RoleSlug.SUPPORT]: '客服与支持人员，可查看日志与基础信息',
  [RoleSlug.VIEWER]: '只读角色，用于审计或参观',
};

export const SYSTEM_ROLE_SLUGS = Object.values(RoleSlug);

export const PERMISSION_METADATA: Record<PermissionCode, { description: string; category: string }> = {
  [PermissionCode.RELEASE_READ]: { description: '读取发布版本信息', category: 'releases' },
  [PermissionCode.RELEASE_WRITE]: { description: '创建或更新发布版本', category: 'releases' },
  [PermissionCode.MODULE_READ]: { description: '查看模块内容和统计', category: 'modules' },
  [PermissionCode.MODULE_WRITE]: { description: '管理模块及其版本', category: 'modules' },
  [PermissionCode.ANNOUNCEMENT_READ]: { description: '查看公告列表与详情', category: 'announcements' },
  [PermissionCode.ANNOUNCEMENT_WRITE]: { description: '创建、更新或下线公告', category: 'announcements' },
  [PermissionCode.LOG_READ]: { description: '查看客户端上报的日志', category: 'logs' },
  [PermissionCode.LOG_WRITE]: { description: '执行日志清理与归档操作', category: 'logs' },
  [PermissionCode.GITHUB_SYNC]: { description: '触发 GitHub Release 同步', category: 'releases' },
  [PermissionCode.USER_MANAGE]: { description: '管理后台用户与权限', category: 'security' },
  [PermissionCode.ROLE_MANAGE]: { description: '维护系统角色及其权限', category: 'security' },
  [PermissionCode.API_KEY_MANAGE]: { description: '创建和吊销 API Key', category: 'security' },
};

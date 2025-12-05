/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Module status enum
 */
export enum ModuleStatus {
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Module version
 */
export interface ModuleVersion {
  id: string;
  moduleId: string;
  version: string;
  changelog: string | null;
  bundleUrl: string;
  checksum: string;
  sizeBytes: bigint | number;
  minAppVersion: string | null;
  publishedAt: string;
}

/**
 * Module
 */
export interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  author: string;
  category: string;
  keywords: string[];
  currentVersion: string;
  downloads: number;
  rating: number | null;
  featured: boolean;
  status: ModuleStatus;
  createdAt: string;
  updatedAt: string;
  versions?: ModuleVersion[];
}

/**
 * Module list query params
 */
export interface ModuleListParams {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Module download params
 */
export interface ModuleDownloadParams {
  version?: string;
}

/**
 * Create module request
 */
export interface CreateModuleRequest {
  name: string;
  displayName: string;
  description: string;
  author: string;
  category: string;
  keywords: string[];
  currentVersion: string;
  featured?: boolean;
}

/**
 * Create module version request
 */
export interface CreateModuleVersionRequest {
  moduleId: string;
  version: string;
  changelog?: string;
  bundleUrl: string;
  checksum: string;
  sizeBytes: number;
  minAppVersion?: string;
}
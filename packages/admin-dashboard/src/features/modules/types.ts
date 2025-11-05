import type { Module } from '@booltox/shared';

export interface ModuleListResponse {
  items: Module[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Announcement type enum
 */
export enum AnnouncementType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  UPDATE = 'UPDATE',
  NOTICE = 'NOTICE',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * Announcement status enum
 */
export enum AnnouncementStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
}

/**
 * Announcement
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number;
  status: AnnouncementStatus;
  publishAt: string | null;
  expireAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Announcement list params
 */
export interface AnnouncementListParams {
  limit?: number;
  type?: AnnouncementType;
}

/**
 * Create announcement request
 */
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  priority?: number;
  publishAt?: string;
  expireAt?: string;
}
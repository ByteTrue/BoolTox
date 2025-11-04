import { apiFetch } from "@/lib/backend-client";

export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: "ANNOUNCEMENT" | "UPDATE" | "NOTICE";
  status: string;
  publishAt: string | null;
  createdAt: string;
};

type AnnouncementResponse = {
  data: Announcement[];
};

export async function fetchAnnouncements(limit = 5) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await apiFetch<AnnouncementResponse>(`/api/public/announcements?${params}`);
  return response.data;
}

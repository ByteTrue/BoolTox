import dayjs from 'dayjs';
import { ReleaseChannel } from '@booltox/shared';

export const RELEASE_CHANNEL_META: Record<ReleaseChannel, { label: string; color: string }> = {
  [ReleaseChannel.STABLE]: { label: 'Stable', color: 'green' },
  [ReleaseChannel.BETA]: { label: 'Beta', color: 'blue' },
  [ReleaseChannel.ALPHA]: { label: 'Alpha', color: 'orange' },
};

export function formatReleaseDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

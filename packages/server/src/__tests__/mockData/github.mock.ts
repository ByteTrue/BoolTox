import type { GitHubRelease, GitHubAsset } from '../../modules/github/github.types';

export const mockGitHubAsset: GitHubAsset = {
  id: 123456,
  name: 'booltox-windows-x64.exe',
  browser_download_url: 'https://github.com/TestOwner/test-repo/releases/download/v1.0.0/booltox-windows-x64.exe',
  size: 52428800, // 50MB
  content_type: 'application/octet-stream',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockGitHubAssetMacOS: GitHubAsset = {
  id: 123457,
  name: 'booltox-macos-arm64.dmg',
  browser_download_url: 'https://github.com/TestOwner/test-repo/releases/download/v1.0.0/booltox-macos-arm64.dmg',
  size: 62914560, // 60MB
  content_type: 'application/octet-stream',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockGitHubRelease: GitHubRelease = {
  id: 789012,
  tag_name: 'v1.0.0',
  name: 'Release 1.0.0',
  body: '## Changes\n- Initial release\n- Bug fixes',
  draft: false,
  prerelease: false,
  created_at: '2024-01-01T00:00:00Z',
  published_at: '2024-01-01T00:00:00Z',
  assets: [mockGitHubAsset, mockGitHubAssetMacOS],
};

export const mockGitHubReleaseBeta: GitHubRelease = {
  id: 789013,
  tag_name: 'v1.1.0-beta.1',
  name: 'Release 1.1.0 Beta 1',
  body: '## Beta Release\n- New features\n- Bug fixes',
  draft: false,
  prerelease: true,
  created_at: '2024-01-15T00:00:00Z',
  published_at: '2024-01-15T00:00:00Z',
  assets: [
    {
      ...mockGitHubAsset,
      id: 123458,
      browser_download_url: 'https://github.com/TestOwner/test-repo/releases/download/v1.1.0-beta.1/booltox-windows-x64.exe',
    },
  ],
};

export const mockGitHubReleaseDraft: GitHubRelease = {
  id: 789014,
  tag_name: 'v2.0.0',
  name: 'Release 2.0.0 (Draft)',
  body: '## Draft\n- Major version',
  draft: true,
  prerelease: false,
  created_at: '2024-02-01T00:00:00Z',
  published_at: '2024-02-01T00:00:00Z',
  assets: [],
};

export const mockGitHubReleases: GitHubRelease[] = [
  mockGitHubRelease,
  mockGitHubReleaseBeta,
];

// Mock download buffer
export const mockAssetBuffer = Buffer.from('mock file content for testing checksum calculation');

// Mock checksums (pre-calculated for the mock buffer)
export const mockChecksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
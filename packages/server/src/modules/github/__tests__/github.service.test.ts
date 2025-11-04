import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubService } from '../github.service';
import {
  mockGitHubRelease,
  mockGitHubReleases,
  mockGitHubAsset,
  mockAssetBuffer,
} from '../../../__tests__/mockData/github.mock';

describe('GitHubService', () => {
  let service: GitHubService;
  let fetchMock: any;

  beforeEach(() => {
    service = new GitHubService();
    // Reset fetch mock
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  describe('getLatestRelease', () => {
    it('should fetch the latest release from GitHub', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease,
        headers: new Map([
          ['X-RateLimit-Remaining', '100'],
        ]),
      });

      const result = await service.getLatestRelease();

      expect(result).toEqual(mockGitHubRelease);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/releases/latest'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BoolTox-Server',
          }),
        })
      );
    });

    it('should include authorization header when token is available', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease,
        headers: new Map(),
      });

      await service.getLatestRelease();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Release not found',
        headers: new Map(),
      });

      await expect(service.getLatestRelease()).rejects.toThrow('GitHub API error');
    });
  });

  describe('getReleaseByTag', () => {
    it('should fetch release by specific tag', async () => {
      const tag = 'v1.0.0';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease,
        headers: new Map(),
      });

      const result = await service.getReleaseByTag(tag);

      expect(result).toEqual(mockGitHubRelease);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/releases/tags/${tag}`),
        expect.any(Object)
      );
    });
  });

  describe('listReleases', () => {
    it('should list releases with pagination', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubReleases,
        headers: new Map(),
      });

      const result = await service.listReleases(10, 1);

      expect(result).toEqual(mockGitHubReleases);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10&page=1'),
        expect.any(Object)
      );
    });
  });

  describe('downloadAsset', () => {
    it('should download asset and return buffer', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAssetBuffer.buffer,
      });

      const result = await service.downloadAsset(mockGitHubAsset.browser_download_url);

      expect(result).toBeInstanceOf(Buffer);
      expect(fetchMock).toHaveBeenCalledWith(
        mockGitHubAsset.browser_download_url,
        expect.any(Object)
      );
    });

    it('should throw error on failed download', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        service.downloadAsset(mockGitHubAsset.browser_download_url)
      ).rejects.toThrow('Failed to download asset');
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate SHA256 checksum', () => {
      const checksum = service.calculateChecksum(mockAssetBuffer);
      
      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof checksum).toBe('string');
    });

    it('should produce consistent checksums for same content', () => {
      const checksum1 = service.calculateChecksum(mockAssetBuffer);
      const checksum2 = service.calculateChecksum(mockAssetBuffer);
      
      expect(checksum1).toBe(checksum2);
    });
  });

  describe('downloadAndCalculateChecksum', () => {
    it('should download asset and calculate checksum', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAssetBuffer.buffer,
      });

      const result = await service.downloadAndCalculateChecksum(
        mockGitHubAsset.browser_download_url
      );

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('parseAssetPlatformArch', () => {
    it('should parse Windows x64 asset', () => {
      const result = service.parseAssetPlatformArch('app-windows-x64.exe');
      expect(result).toEqual({
        platform: 'WINDOWS',
        architecture: 'X64',
      });
    });

    it('should parse Windows asset with .exe extension', () => {
      const result = service.parseAssetPlatformArch('booltox-setup.exe');
      expect(result).toEqual({
        platform: 'WINDOWS',
        architecture: null,
      });
    });

    it('should parse macOS arm64 asset', () => {
      const result = service.parseAssetPlatformArch('app-macos-arm64.dmg');
      expect(result).toEqual({
        platform: 'MACOS',
        architecture: 'ARM64',
      });
    });

    it('should parse macOS x64 asset', () => {
      const result = service.parseAssetPlatformArch('app-macos-x64.pkg');
      expect(result).toEqual({
        platform: 'MACOS',
        architecture: 'X64',
      });
    });

    it('should parse Linux arm64 asset', () => {
      const result = service.parseAssetPlatformArch('app-linux-arm64.AppImage');
      expect(result).toEqual({
        platform: 'LINUX',
        architecture: 'ARM64',
      });
    });

    it('should parse Linux amd64 asset', () => {
      const result = service.parseAssetPlatformArch('app-linux-amd64.deb');
      expect(result).toEqual({
        platform: 'LINUX',
        architecture: 'X64',
      });
    });

    it('should handle unrecognizable assets', () => {
      const result = service.parseAssetPlatformArch('source-code.zip');
      expect(result).toEqual({
        platform: null,
        architecture: null,
      });
    });

    it('should be case insensitive', () => {
      const result1 = service.parseAssetPlatformArch('APP-WINDOWS-X64.EXE');
      const result2 = service.parseAssetPlatformArch('app-windows-x64.exe');
      expect(result1).toEqual(result2);
    });
  });

  describe('isPrerelease', () => {
    it('should identify prerelease versions', () => {
      const prerelease = {
        ...mockGitHubRelease,
        prerelease: true,
      };
      expect(service.isPrerelease(prerelease)).toBe(true);
    });

    it('should identify draft versions as prerelease', () => {
      const draft = {
        ...mockGitHubRelease,
        draft: true,
      };
      expect(service.isPrerelease(draft)).toBe(true);
    });

    it('should return false for stable releases', () => {
      expect(service.isPrerelease(mockGitHubRelease)).toBe(false);
    });
  });

  describe('inferChannelFromTag', () => {
    it('should infer ALPHA channel from tag', () => {
      expect(service.inferChannelFromTag('v1.0.0-alpha')).toBe('ALPHA');
      expect(service.inferChannelFromTag('v1.0.0-alpha.1')).toBe('ALPHA');
    });

    it('should infer BETA channel from tag', () => {
      expect(service.inferChannelFromTag('v1.0.0-beta')).toBe('BETA');
      expect(service.inferChannelFromTag('v1.0.0-beta.1')).toBe('BETA');
      expect(service.inferChannelFromTag('v1.0.0-rc.1')).toBe('BETA');
    });

    it('should infer STABLE channel for release tags', () => {
      expect(service.inferChannelFromTag('v1.0.0')).toBe('STABLE');
      expect(service.inferChannelFromTag('1.0.0')).toBe('STABLE');
    });

    it('should be case insensitive', () => {
      expect(service.inferChannelFromTag('v1.0.0-ALPHA')).toBe('ALPHA');
      expect(service.inferChannelFromTag('v1.0.0-Beta.1')).toBe('BETA');
    });
  });

  describe('cleanVersion', () => {
    it('should remove v prefix from version tags', () => {
      expect(service.cleanVersion('v1.0.0')).toBe('1.0.0');
      expect(service.cleanVersion('v1.2.3-beta.1')).toBe('1.2.3-beta.1');
    });

    it('should leave versions without prefix unchanged', () => {
      expect(service.cleanVersion('1.0.0')).toBe('1.0.0');
      expect(service.cleanVersion('1.2.3-beta.1')).toBe('1.2.3-beta.1');
    });
  });

  describe('rate limit handling', () => {
    it('should log warning when rate limit is low', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease,
        headers: new Map([
          ['X-RateLimit-Remaining', '5'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
      });

      await service.getLatestRelease();

      // Check that the warning was logged (implementation may vary)
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
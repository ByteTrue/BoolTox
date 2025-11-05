import { describe, it, expect } from 'vitest';
import {
  compareVersions,
  isNewer,
  isEqual,
  getLatestVersion,
  isValidVersion,
} from '../version.util';

describe('version.util', () => {
  describe('compareVersions', () => {
    it('should correctly compare major versions', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should correctly compare minor versions', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
      expect(compareVersions('1.1.0', '1.1.0')).toBe(0);
    });

    it('should correctly compare patch versions', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
      expect(compareVersions('1.0.1', '1.0.1')).toBe(0);
    });

    it('should handle versions with "v" prefix', () => {
      expect(compareVersions('v1.2.0', 'v1.1.0')).toBe(1);
      expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
    });

    it('should correctly compare prerelease versions', () => {
      // Release versions are greater than prerelease
      expect(compareVersions('1.0.0', '1.0.0-beta.1')).toBe(1);
      expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBe(-1);

      // Compare between prereleases
      expect(compareVersions('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);
      expect(compareVersions('1.0.0-alpha.1', '1.0.0-beta.1')).toBe(-1);
    });

    it('should handle complex prerelease versions', () => {
      expect(compareVersions('1.0.0-rc.2', '1.0.0-rc.1')).toBe(1);
      expect(compareVersions('1.0.0-beta.10', '1.0.0-beta.2')).toBe(1);
    });
  });

  describe('isNewer', () => {
    it('should return true when new version is greater', () => {
      expect(isNewer('1.0.0', '1.1.0')).toBe(true);
      expect(isNewer('1.0.0', '2.0.0')).toBe(true);
    });

    it('should return false when new version is not greater', () => {
      expect(isNewer('1.1.0', '1.0.0')).toBe(false);
      expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    });

    it('should handle prerelease versions', () => {
      expect(isNewer('1.0.0-beta.1', '1.0.0')).toBe(true);
      expect(isNewer('1.0.0', '1.0.0-beta.1')).toBe(false);
    });
  });

  describe('isEqual', () => {
    it('should return true for equal versions', () => {
      expect(isEqual('1.0.0', '1.0.0')).toBe(true);
      expect(isEqual('v1.0.0', '1.0.0')).toBe(true);
      expect(isEqual('1.0.0-beta.1', '1.0.0-beta.1')).toBe(true);
    });

    it('should return false for different versions', () => {
      expect(isEqual('1.0.0', '1.0.1')).toBe(false);
      expect(isEqual('1.0.0', '1.0.0-beta.1')).toBe(false);
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version from array', () => {
      const versions = ['1.0.0', '1.2.0', '1.1.0', '2.0.0'];
      expect(getLatestVersion(versions)).toBe('2.0.0');
    });

    it('should handle versions with prefixes', () => {
      const versions = ['v1.0.0', 'v1.2.0', 'v1.1.0'];
      expect(getLatestVersion(versions)).toBe('v1.2.0');
    });

    it('should return null for empty array', () => {
      expect(getLatestVersion([])).toBe(null);
    });

    it('should handle prerelease versions', () => {
      const versions = ['1.0.0-beta.1', '1.0.0-beta.2', '1.0.0'];
      expect(getLatestVersion(versions)).toBe('1.0.0');
    });

    it('should return the only version in single-item array', () => {
      expect(getLatestVersion(['1.0.0'])).toBe('1.0.0');
    });
  });

  describe('isValidVersion', () => {
    it('should return true for valid semver versions', () => {
      expect(isValidVersion('1.0.0')).toBe(true);
      expect(isValidVersion('v1.0.0')).toBe(true);
      expect(isValidVersion('1.0.0-beta.1')).toBe(true);
      expect(isValidVersion('0.0.1')).toBe(true);
      expect(isValidVersion('10.20.30')).toBe(true);
    });

    it('should return false for invalid versions', () => {
      expect(isValidVersion('1.0')).toBe(false);
      expect(isValidVersion('1')).toBe(false);
      expect(isValidVersion('1.0.0.0')).toBe(false);
      expect(isValidVersion('invalid')).toBe(false);
      expect(isValidVersion('')).toBe(false);
      expect(isValidVersion('v1.0')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero versions', () => {
      expect(compareVersions('0.0.0', '0.0.1')).toBe(-1);
      expect(compareVersions('0.1.0', '0.0.1')).toBe(1);
    });

    it('should handle large version numbers', () => {
      expect(compareVersions('999.999.999', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '999.999.999')).toBe(-1);
    });

    it('should handle complex prerelease identifiers', () => {
      expect(compareVersions('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
      expect(compareVersions('1.0.0-alpha.beta', '1.0.0-beta')).toBe(-1);
    });
  });
});
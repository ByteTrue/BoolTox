/**
 * 版本号比较工具
 * 支持 semver 格式（1.0.0、1.0.0-beta.1 等）
 */

interface SemVerParts {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

/**
 * 解析 semver 版本号
 */
function parseSemVer(version: string): SemVerParts | null {
  // 移除 'v' 前缀
  const cleanVersion = version.startsWith('v') ? version.substring(1) : version;
  
  // 匹配 semver 格式: major.minor.patch[-prerelease]
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  
  if (!match) {
    return null;
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

/**
 * 比较两个版本号
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parsed1 = parseSemVer(v1);
  const parsed2 = parseSemVer(v2);
  
  // 如果无法解析，回退到字符串比较
  if (!parsed1 || !parsed2) {
    if (v1 === v2) return 0;
    return v1 > v2 ? 1 : -1;
  }
  
  // 比较主版本号
  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  
  // 比较次版本号
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  
  // 比较修订号
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }
  
  // 比较预发布版本
  // 有预发布标识的版本 < 没有预发布标识的版本
  if (parsed1.prerelease.length === 0 && parsed2.prerelease.length > 0) {
    return 1;
  }
  if (parsed1.prerelease.length > 0 && parsed2.prerelease.length === 0) {
    return -1;
  }
  
  // 都有预发布标识，逐个比较
  const minLength = Math.min(parsed1.prerelease.length, parsed2.prerelease.length);
  for (let i = 0; i < minLength; i++) {
    const part1 = parsed1.prerelease[i];
    const part2 = parsed2.prerelease[i];
    
    // 尝试转换为数字
    const num1 = parseInt(part1, 10);
    const num2 = parseInt(part2, 10);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      // 都是数字，按数字比较
      if (num1 !== num2) {
        return num1 > num2 ? 1 : -1;
      }
    } else {
      // 按字符串比较
      if (part1 !== part2) {
        return part1 > part2 ? 1 : -1;
      }
    }
  }
  
  // 如果前面的部分都相同，长度长的版本更大
  if (parsed1.prerelease.length !== parsed2.prerelease.length) {
    return parsed1.prerelease.length > parsed2.prerelease.length ? 1 : -1;
  }
  
  return 0;
}

/**
 * 判断是否有更新（v2 > v1）
 */
export function isNewer(currentVersion: string, newVersion: string): boolean {
  return compareVersions(newVersion, currentVersion) > 0;
}

/**
 * 判断版本是否相等
 */
export function isEqual(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) === 0;
}

/**
 * 获取多个版本中的最新版本
 */
export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) {
    return null;
  }
  
  return versions.reduce((latest, current) => {
    return compareVersions(current, latest) > 0 ? current : latest;
  });
}

/**
 * 验证版本号格式是否有效
 */
export function isValidVersion(version: string): boolean {
  return parseSemVer(version) !== null;
}
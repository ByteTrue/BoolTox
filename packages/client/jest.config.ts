import type { Config } from 'jest';

const config: Config = {
  // 测试环境配置 (遵循 SOLID 原则：依赖倒置)
  testEnvironment: 'jsdom',
  preset: 'ts-jest/presets/default-esm',
  
  // 扩展名解析
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // 全局设置文件
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/index.ts',
  ],
  
  // 覆盖率阈值 (严格的质量标准)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 转换配置 (更新的 ts-jest 配置方式)
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  
  // 模块映射 (修正配置键名)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/renderer/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/test/__mocks__/fileMock.ts',
  },
  
  // 忽略特定模块
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  
  // 测试超时
  testTimeout: 10000,
};

export default config;
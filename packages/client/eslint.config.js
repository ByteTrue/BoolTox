import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/.turbo/**',
      '**/.next/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/node_modules/**',
      '**/*.d.ts',
      'docs/**/*',
      'logs/**/*',
      'public/**/*',
      'release/**/*',
      'plugins/**/dist/**/*',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: 'readonly',
      },
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['error', { allow: ['warn', 'error', 'time', 'timeEnd', 'group', 'groupEnd'] }],
      'no-undef': 'off',
      'no-control-regex': 'error',
      'no-dupe-class-members': 'error',
      'no-useless-escape': 'error',
      'no-redeclare': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },
  // 测试文件特殊配置 (遵循单一职责原则，分离测试环境配置)
  {
    files: ['scripts/**/*.{js,ts,mjs,cjs}', 'examples/**/*.{js,ts,tsx,jsx,mjs,cjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/src/test/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        NodeJS: 'readonly',
        // Jest 全局函数显式声明 (确保类型安全)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['error', { allow: ['warn', 'error', 'time', 'timeEnd', 'group', 'groupEnd'] }],
      'no-undef': 'off',
      'no-control-regex': 'error',
      'no-dupe-class-members': 'error',
      'no-useless-escape': 'error',
      'no-redeclare': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react-refresh/only-export-components': 'off',
    },
  },
];

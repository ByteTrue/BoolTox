import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/booltox_test';
process.env.GITHUB_OWNER = 'TestOwner';
process.env.GITHUB_REPO = 'test-repo';
process.env.GITHUB_TOKEN = 'test_token_12345678901234567890123456789012';
process.env.CLIENT_API_TOKEN = 'test_client_token_12345678901234567890';
process.env.INGEST_SHARED_SECRET = 'test_ingest_secret_12345678901234567890';
process.env.JWT_SECRET = 'test_jwt_secret_1234567890123456789012345678';

// Mock logger to reduce noise during tests
vi.mock('../common/logger.service', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

beforeAll(() => {
  // Setup before all tests
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup after all tests
});
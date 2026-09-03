import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup for all tests
beforeAll(() => {
  // Set up environment variables for tests
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Cleanup
});

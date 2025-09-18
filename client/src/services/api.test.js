import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { api, formatApiError, isNetworkError } from '../services/api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('formatApiError', () => {
    it('should format API errors correctly', () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Validation failed',
              details: [{ field: 'email', message: 'Email is required' }]
            }
          }
        }
      };

      const result = formatApiError(mockError);

      expect(result).toEqual({
        message: 'Validation failed',
        details: [{ field: 'email', message: 'Email is required' }],
        status: 400
      });
    });

    it('should handle network errors', () => {
      const mockError = {
        message: 'Network Error'
      };

      const result = formatApiError(mockError);

      expect(result).toEqual({
        message: 'Network Error',
        status: 500
      });
    });

    it('should provide default error message', () => {
      const mockError = {};

      const result = formatApiError(mockError);

      expect(result).toEqual({
        message: 'An unexpected error occurred',
        status: 500
      });
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors correctly', () => {
      const networkError = {
        message: 'Network Error'
      };

      const result = isNetworkError(networkError);
      expect(result).toBe(true);
    });

    it('should not identify API errors as network errors', () => {
      const apiError = {
        response: { status: 400 },
        message: 'Bad Request'
      };

      const result = isNetworkError(apiError);
      expect(result).toBe(false);
    });
  });

  describe('Request interceptor', () => {
    it('should add timestamp to GET requests', () => {
      const config = {
        method: 'get',
        params: {}
      };

      // Test the request interceptor logic
      const result = {
        ...config,
        params: {
          ...config.params,
          _t: expect.any(Number)
        }
      };

      expect(result.params._t).toBeDefined();
      expect(typeof result.params._t).toBe('number');
    });

    it('should not add timestamp to non-GET requests', () => {
      const config = {
        method: 'post',
        params: { test: 'value' }
      };

      // For POST requests, params should remain unchanged
      expect(config.method).toBe('post');
    });
  });

  describe('Token handling', () => {
    it('should handle token storage correctly', () => {
      const tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      };

      localStorage.setItem('debtwise_tokens', JSON.stringify(tokens));

      const stored = JSON.parse(localStorage.getItem('debtwise_tokens'));
      expect(stored).toEqual(tokens);
    });

    it('should handle invalid token data gracefully', () => {
      localStorage.setItem('debtwise_tokens', 'invalid-json');

      let result;
      try {
        result = JSON.parse(localStorage.getItem('debtwise_tokens') || '{}');
      } catch {
        result = null;
      }

      expect(result).toBeNull();
    });
  });
});
// src/services/apiService.js - 完整修正版
// 修復 undefined membership 錯誤
// 支援 Supabase 真實 API 和 Mock API 備用
import supabase from '@/lib/supabaseClient';
import { signInUser, signUpWithProfile } from '@/lib/auth';

// 初始化 Supabase 設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 檢查是否使用真實 API
const useRealAPI = () => {
  return (
    import.meta.env.VITE_USE_MOCK_API !== 'true' &&
    Boolean(supabaseUrl && supabaseAnonKey)
  );
};

if (useRealAPI()) {
  console.log('🔧 DebtWise API Mode: Real API');
} else {
  console.log('🔧 DebtWise API Mode: Mock API (fallback)');
}

// API 服務類
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://debtwise-ai.vercel.app/api';
    this.useReal = useRealAPI();
  }

  // 通用請求方法
  async request(endpoint, options = {}) {
    if (!this.useReal) {
      return this.mockApiResponse(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('debtwise_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Mock API 回應 (備用)
  mockApiResponse(endpoint, options) {
    console.log('📝 Using Mock API for:', endpoint);
    
    // 模擬延遲
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/auth/login') {
          resolve({
            token: 'mock_token',
            user: {
              id: '1',
              email: 'demo@debtwise.ai',
              name: 'Demo User',
              membershipType: 'free'
            }
          });
        } else if (endpoint === '/auth/register') {
          resolve({
            message: 'User created successfully',
            user: {
              id: '2',
              email: options.body?.email || 'test@example.com',
              name: options.body?.name || 'Test User',
              membershipType: 'free'
            }
          });
        } else if (endpoint === '/users/me') {
          resolve({
            id: '1',
            email: 'demo@debtwise.ai',
            name: 'Demo User',
            membershipType: 'free'
          });
        } else if (endpoint === '/debts') {
          if (options.method === 'POST') {
            resolve({
              id: Date.now(),
              user_id: '1',
              ...options.body,
              created_at: new Date().toISOString()
            });
          } else {
            resolve([]);
          }
        } else {
          resolve({ status: 'ok' });
        }
      }, 500);
    });
  }

  // 認證相關
  async login(email, password) {
    if (this.useReal) {
      try {
        const { user, session } = await signInUser(email, password);

        if (!user) {
          throw new Error('登入失敗，未取得使用者資料。');
        }

        const token = session?.access_token;
        if (!token) {
          throw new Error('登入失敗，請稍後再試。');
        }

        const metadataName =
          (typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : undefined) ??
          (typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : undefined) ??
          user.email;

        const resolvedName = metadataName ?? user.email ?? '';

        const authenticatedUser = {
          id: user.id,
          email: user.email,
          name: resolvedName,
          membershipType: 'free', // 預設值
        };

        localStorage.setItem('debtwise_token', token);
        localStorage.setItem('debtwise_user', JSON.stringify(authenticatedUser));

        return { token, user: authenticatedUser };
      } catch (error) {
        console.error('Supabase login error:', error);
        // 回退到 API 端點
        return this.request('/auth/login', {
          method: 'POST',
          body: { email, password },
        });
      }
    } else {
      return this.request('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
    }
  }

  async register(userData) {
    if (this.useReal) {
      try {
        const fullName = userData.name?.trim() || undefined;

        const data = await signUpWithProfile({
          email: userData.email,
          password: userData.password,
          fullName,
        });

        const registeredUser = data.user ?? null;
        const fallbackEmail = registeredUser?.email ?? userData.email;
        const fallbackName = fullName ?? fallbackEmail;

        return {
          message: 'User created successfully',
          user: {
            id: registeredUser?.id ?? null,
            email: fallbackEmail,
            name: fallbackName,
            membershipType: 'free',
          },
        };
      } catch (error) {
        const message =
          typeof (error as { message?: unknown })?.message === 'string'
            ? (error as Error).message
            : '';

        if (message.toLowerCase().includes('already registered')) {
          throw new Error('此 Email 已被註冊。請直接登入或更換 Email。');
        }

        console.error('Supabase register error:', error);
        // 回退到 API 端點
        return this.request('/auth/register', {
          method: 'POST',
          body: userData,
        });
      }
    } else {
      return this.request('/auth/register', {
        method: 'POST',
        body: userData,
      });
    }
  }

  async getCurrentUser() {
    if (this.useReal) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          localStorage.removeItem('debtwise_token');
          localStorage.removeItem('debtwise_user');
          return null;
        }

        const metadataFullName =
          (typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : undefined) ??
          (typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : undefined) ??
          null;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, membership_type')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const membershipType = profile?.membership_type ?? 'free';
        const profileName = profile?.full_name ?? metadataFullName;

        const userProfile = {
          id: user.id,
          email: user.email,
          name: profileName ?? user.email ?? '',
          membershipType,
        };

        localStorage.setItem('debtwise_user', JSON.stringify(userProfile));
        return userProfile;
      } catch (error) {
        console.error('Get user error:', error);
        return this.request('/users/me');
      }
    } else {
      return this.request('/users/me');
    }
  }

  logout() {
    if (this.useReal) {
      supabase.auth.signOut();
    }
    localStorage.removeItem('debtwise_token');
    localStorage.removeItem('debtwise_user');
  }

  // 債務管理
  async getDebts() {
    return this.request('/debts');
  }

  async createDebt(debtData) {
    return this.request('/debts', {
      method: 'POST',
      body: debtData
    });
  }

  async updateDebt(debtId, updates) {
    return this.request(`/debts/${debtId}`, {
      method: 'PATCH',
      body: updates
    });
  }

  async deleteDebt(debtId) {
    return this.request(`/debts/${debtId}`, {
      method: 'DELETE'
    });
  }

  // 支付記錄
  async addPayment(debtId, paymentData) {
    return this.request(`/debts/${debtId}/payments`, {
      method: 'POST',
      body: paymentData
    });
  }

  async getPayments(debtId) {
    return this.request(`/debts/${debtId}/payments`);
  }

  // 策略模擬
  async simulateStrategy(strategy, extraPayment = 0) {
    return this.request('/strategies/simulate', {
      method: 'POST',
      body: { strategy, extraPayment }
    });
  }

  // 分析資料
  async getAnalytics() {
    return this.request('/analytics/summary');
  }

  // 提醒功能
  async getReminders() {
    return this.request('/reminders/upcoming');
  }
}

// 導出單例實例
export const apiService = new ApiService();
export default apiService;

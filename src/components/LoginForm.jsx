// src/components/LoginForm.jsx - 使用安全輸入框的版本
import React, { useState, useCallback } from 'react';
import { LoginInput } from './SafeInput';

const LoginForm = ({ onLogin, onSwitchToRegister, loading = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field) => (event) => {
    const value = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除對應的錯誤信息
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子信箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子信箱';
    }
    
    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要6個字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onLogin(formData.email.trim(), formData.password);
    } catch (error) {
      setErrors({
        general: error.message || '登入失敗，請檢查您的電子信箱和密碼'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, validateForm, onLogin]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }, [handleSubmit]);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          登入 DebtWise AI
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          歡迎回來！請登入您的帳戶
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* 使用安全輸入框 - 電子信箱 */}
        <LoginInput
          label="電子信箱"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          onKeyDown={handleKeyDown}
          placeholder="請輸入您的電子信箱"
          disabled={isSubmitting || loading}
          error={errors.email}
          autoComplete="username"
        />

        {/* 使用安全輸入框 - 密碼 */}
        <LoginInput
          label="密碼"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          onKeyDown={handleKeyDown}
          placeholder="請輸入您的密碼"
          disabled={isSubmitting || loading}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* 提交按鈕 */}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent 
            rounded-md shadow-sm text-sm font-medium text-white mt-4
            ${isSubmitting || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }
            transition-colors duration-200
          `}
        >
          {isSubmitting || loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登入中...
            </span>
          ) : (
            '登入'
          )}
        </button>
      </form>

      {/* 切換到註冊 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          還沒有帳戶？{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            disabled={isSubmitting || loading}
            className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
          >
            立即註冊
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

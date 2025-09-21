// src/components/SafeInput.jsx - 防擴展干擾的輸入框
import React, { useState, useEffect, useRef, useCallback } from 'react';

const SafeInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  className, 
  disabled,
  autoComplete = 'off',
  ...props 
}) => {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  // 同步外部 value 變化
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // 防止擴展干擾的屬性設置
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // 設置防止密碼管理器干擾的屬性
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-form-type', 'other');
    input.setAttribute('autocomplete', 'new-password');
    input.setAttribute('readonly', 'readonly');
    
    // 延遲移除 readonly，避免自動填充
    const timer = setTimeout(() => {
      input.removeAttribute('readonly');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    
    // 確保輸入框可編輯
    const input = e.target;
    input.removeAttribute('readonly');
    input.style.pointerEvents = 'auto';
    
    // 觸發外部 onFocus
    if (props.onFocus) {
      props.onFocus(e);
    }
  }, [props.onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    // 觸發外部 onBlur
    if (props.onBlur) {
      props.onBlur(e);
    }
  }, [props.onBlur]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // 觸發外部 onChange
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    // 防止擴展攔截按鍵事件
    e.stopPropagation();
    
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  }, [props.onKeyDown]);

  // 防止擴展修改輸入框
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          // 如果擴展修改了屬性，恢復我們的設定
          if (mutation.attributeName === 'readonly' && input.hasAttribute('readonly') && isFocused) {
            input.removeAttribute('readonly');
          }
        }
      });
    });

    observer.observe(input, {
      attributes: true,
      attributeFilter: ['readonly', 'disabled', 'autocomplete']
    });

    return () => observer.disconnect();
  }, [isFocused]);

  return (
    <input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoComplete="new-password" // 防止自動填充
      data-lpignore="true" // LastPass 忽略
      data-1p-ignore="true" // 1Password 忽略
      data-form-type="other" // 通用擴展忽略
      spellCheck="false" // 禁用拼寫檢查避免干擾
      {...props}
      // 強制覆蓋可能有問題的 props
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};

// 專門的登入表單輸入框
export const LoginInput = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <SafeInput
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 text-red-900 placeholder-red-300' 
            : 'border-gray-300 dark:border-gray-600'
          }
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SafeInput;

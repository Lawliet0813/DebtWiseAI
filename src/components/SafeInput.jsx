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
  onFocus,
  onBlur,
  onKeyDown,
  ...rest
}) => {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value ?? '');

  // 同步外部 value 變化
  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleFocus = useCallback(
    (event) => {
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (event) => {
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      onChange?.(event);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event) => {
      onKeyDown?.(event);
    },
    [onKeyDown],
  );

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
      autoComplete={autoComplete}
      data-lpignore="true" // LastPass 忽略
      data-1p-ignore="true" // 1Password 忽略
      data-form-type="other" // 通用擴展忽略
      spellCheck="false" // 禁用拼寫檢查避免干擾
      {...rest}
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

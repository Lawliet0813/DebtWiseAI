import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Percent, CreditCard, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';

const EditDebtForm = ({ debt, onClose, onEditDebt, debtTypes }) => {
  const [formData, setFormData] = useState({
    name: '',
    principal: '',
    interestRate: '',
    minimumPayment: '',
    totalPeriods: '',
    monthlyDueDay: '15',
    type: '信用卡',
    subType: '循環信用'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表單數據
  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name || '',
        principal: debt.principal?.toString() || '',
        interestRate: debt.interestRate?.toString() || '',
        minimumPayment: debt.minimumPayment?.toString() || '',
        totalPeriods: debt.totalPeriods?.toString() || '',
        monthlyDueDay: debt.monthlyDueDay?.toString() || '15',
        type: debt.type || '信用卡',
        subType: debt.subType || '循環信用'
      });
    }
  }, [debt]);

  // 需要期數的債務類型
  const needsPeriods = (type) => {
    return !['信用卡', '其他'].includes(type);
  };

  // 表單驗證
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入債務名稱';
    }

    if (!formData.principal || parseFloat(formData.principal) <= 0) {
      newErrors.principal = '請輸入有效的本金金額';
    }

    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      newErrors.interestRate = '請輸入有效的年利率';
    }

    if (!formData.minimumPayment || parseFloat(formData.minimumPayment) <= 0) {
      newErrors.minimumPayment = '請輸入有效的最低還款額';
    }

    if (needsPeriods(formData.type) && (!formData.totalPeriods || parseInt(formData.totalPeriods) <= 0)) {
      newErrors.totalPeriods = '請輸入有效的貸款期數';
    }

    const dueDay = parseInt(formData.monthlyDueDay);
    if (dueDay < 1 || dueDay > 31) {
      newErrors.monthlyDueDay = '繳款日必須在1-31之間';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理債務類型變更
  const handleTypeChange = (type) => {
    const subTypes = debtTypes[type]?.subTypes || [];
    setFormData({
      ...formData,
      type,
      subType: subTypes[0] || '',
      totalPeriods: needsPeriods(type) ? formData.totalPeriods : ''
    });
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const monthlyDueDay = parseInt(formData.monthlyDueDay, 10);
      await onEditDebt({
        id: debt.id,
        name: formData.name.trim(),
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: parseFloat(formData.minimumPayment),
        totalPeriods: needsPeriods(formData.type) ? parseInt(formData.totalPeriods, 10) : 0,
        monthlyDueDay,
        type: formData.type,
        subType: formData.subType,
        dueDate: getNextDueDate(monthlyDueDay),
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error?.message || '更新債務時發生錯誤，請稍後再試' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 獲取下次繳款日期
  const getNextDueDate = (dueDay) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let nextDueDate = new Date(currentYear, currentMonth, dueDay);
    if (nextDueDate <= today) {
      nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    return nextDueDate.toISOString().split('T')[0];
  };

  // 輸入框組件
  const InputField = ({ label, name, type = 'text', placeholder, required = false, unit, step, children }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children || (
        <div className="relative">
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
            placeholder={placeholder}
            step={step}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } ${unit ? 'pr-12' : ''}`}
            disabled={isSubmitting}
          />
          {unit && (
            <span className="absolute right-3 top-3 text-gray-500 text-sm">
              {unit}
            </span>
          )}
        </div>
      )}
      {errors[name] && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle size={14} className="mr-1" />
          {errors[name]}
        </div>
      )}
    </div>
  );

  if (!debt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Edit2 className="mr-3 text-blue-600" size={28} />
            編輯債務
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 債務資訊預覽 */}
        <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <span className="mr-2">{debtTypes[debt.type]?.icon}</span>
            正在編輯：{debt.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-600">原始本金</p>
              <p className="font-bold text-blue-800">
                ${debt.originalPrincipal?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-blue-600">目前餘額</p>
              <p className="font-bold text-blue-800">
                ${debt.principal?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-blue-600">還款進度</p>
              <p className="font-bold text-blue-800">
                {Math.round(((debt.originalPrincipal - debt.principal) / debt.originalPrincipal) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-blue-600">建立時間</p>
              <p className="font-bold text-blue-800">
                {new Date(debt.createdAt || Date.now()).toLocaleDateString('zh-TW')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <DollarSign className="mr-2 text-blue-600" size={20} />
              基本資訊
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="債務名稱"
                name="name"
                placeholder="例如：中信信用卡"
                required
              />

              <InputField
                label="目前餘額"
                name="principal"
                type="number"
                placeholder="50000"
                unit="元"
                required
              />

              <InputField
                label="年利率"
                name="interestRate"
                type="number"
                step="0.01"
                placeholder="18.5"
                unit="%"
                required
              />

              <InputField
                label="最低還款額"
                name="minimumPayment"
                type="number"
                placeholder="2000"
                unit="元"
                required
              />
            </div>
          </div>

          {/* 債務類型 */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <CreditCard className="mr-2 text-green-600" size={20} />
              債務類型
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="主要類型" name="type" required>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                >
                  {Object.keys(debtTypes).map(type => (
                    <option key={type} value={type}>
                      {debtTypes[type].icon} {type}
                    </option>
                  ))}
                </select>
              </InputField>

              <InputField label="細分類型" name="subType">
                <select
                  name="subType"
                  value={formData.subType}
                  onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                >
                  {debtTypes[formData.type]?.subTypes.map(subType => (
                    <option key={subType} value={subType}>
                      {subType}
                    </option>
                  ))}
                </select>
              </InputField>
            </div>
          </div>

          {/* 期限設定 */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2 text-orange-600" size={20} />
              期限設定
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {needsPeriods(formData.type) && (
                <InputField
                  label="貸款期數"
                  name="totalPeriods"
                  type="number"
                  placeholder="60"
                  unit="個月"
                  required={needsPeriods(formData.type)}
                />
              )}

              <InputField
                label="每月繳款日"
                name="monthlyDueDay"
                required
              >
                <select
                  name="monthlyDueDay"
                  value={formData.monthlyDueDay}
                  onChange={(e) => setFormData({ ...formData, monthlyDueDay: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day.toString()}>
                      每月 {day} 號
                    </option>
                  ))}
                </select>
              </InputField>
            </div>

            {/* 變更提醒 */}
            {(parseFloat(formData.principal) !== debt.principal) && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 flex items-center">
                  <AlertCircle className="mr-2" size={16} />
                  <strong>餘額變更：</strong>
                  從 ${debt.principal?.toLocaleString()} 調整為 ${parseFloat(formData.principal || 0).toLocaleString()}
                </p>
              </div>
            )}

            {needsPeriods(formData.type) && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center">
                  <CheckCircle className="mr-2" size={16} />
                  目前剩餘期數：{debt.remainingPeriods || 0} 個月
                </p>
              </div>
            )}
          </div>

          {/* 錯誤訊息 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center text-red-600">
                <AlertCircle className="mr-2" size={20} />
                <span>{errors.submit}</span>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  更新中...
                </div>
              ) : (
                <>
                  <Edit2 className="inline mr-2" size={20} />
                  更新債務
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDebtForm;
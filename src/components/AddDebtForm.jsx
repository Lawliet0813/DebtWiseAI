import React, { useState } from 'react';
import { X, DollarSign, Calendar, Percent, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const AddDebtForm = ({ onClose, onAddDebt, debtTypes }) => {
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
      const newDebt = {
        id: Date.now(),
        ...formData,
        principal: parseFloat(formData.principal),
        originalPrincipal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: parseFloat(formData.minimumPayment),
        totalPeriods: needsPeriods(formData.type) ? parseInt(formData.totalPeriods) : 0,
        remainingPeriods: needsPeriods(formData.type) ? parseInt(formData.totalPeriods) : 0,
        monthlyDueDay: parseInt(formData.monthlyDueDay),
        dueDate: getNextDueDate(parseInt(formData.monthlyDueDay)),
        color: getDebtColor(formData.type),
        createdAt: new Date().toISOString()
      };

      await onAddDebt(newDebt);
      onClose();
    } catch (error) {
      setErrors({ submit: '新增債務時發生錯誤，請稍後再試' });
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

  // 獲取債務顏色
  const getDebtColor = (type) => {
    const colorMap = {
      '信用卡': 'red',
      '房貸': 'blue',
      '車貸': 'green',
      '學貸': 'yellow',
      '個人信貸': 'purple',
      '投資': 'pink',
      '企業經營': 'indigo',
      '其他': 'gray'
    };
    return colorMap[type] || 'gray';
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <CreditCard className="mr-3 text-purple-600" size={28} />
            新增債務
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
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
                label="本金金額"
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

            {needsPeriods(formData.type) && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center">
                  <CheckCircle className="mr-2" size={16} />
                  常見期數參考：車貸 36-72月、房貸 240-360月、學貸 60-120月
                </p>
              </div>
            )}

            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 flex items-center">
                <CheckCircle className="mr-2" size={16} />
                💡 建議選擇發薪日後的日期，確保帳戶有足夠餘額
              </p>
            </div>
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
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  新增中...
                </div>
              ) : (
                <>
                  <CreditCard className="inline mr-2" size={20} />
                  新增債務
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

export default AddDebtForm;
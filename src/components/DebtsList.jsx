import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Calendar, TrendingUp, DollarSign, 
  Filter, Search, BarChart3, AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';

const DebtsList = ({
  debts,
  onDeleteDebt,
  debtTypes,
  onShowAddForm,
  onShowEditForm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('principal'); // principal, interestRate, dueDate, progress
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // 篩選和排序債務
  const filteredAndSortedDebts = debts
    .filter(debt => {
      const matchesSearch = debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           debt.type.includes(searchTerm) ||
                           debt.subType.includes(searchTerm);
      const matchesFilter = filterType === 'all' || debt.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'principal':
          aValue = a.principal;
          bValue = b.principal;
          break;
        case 'interestRate':
          aValue = a.interestRate;
          bValue = b.interestRate;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'progress':
          aValue = getPaymentProgress(a);
          bValue = getPaymentProgress(b);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 計算還款進度
  const getPaymentProgress = (debt) => {
    const paid = debt.originalPrincipal - debt.principal;
    return Math.round((paid / debt.originalPrincipal) * 100);
  };

  // 格式化貨幣
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 獲取利率顏色
  const getInterestRateColor = (rate) => {
    if (rate >= 15) return 'text-red-600';
    if (rate >= 8) return 'text-orange-600';
    if (rate >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  // 獲取到期狀態
  const getDueStatus = (debt) => {
    const today = new Date();
    const dueDate = new Date(debt.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', days: Math.abs(diffDays), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    } else if (diffDays <= 3) {
      return { status: 'due_soon', days: diffDays, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    } else {
      return { status: 'normal', days: diffDays, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }
  };

  // 刪除確認對話框
  const DeleteConfirmDialog = ({ debt, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-600 mr-3" size={28} />
          <h3 className="text-xl font-bold text-gray-800">確認刪除</h3>
        </div>
        
        <p className="text-gray-600 mb-2">
          您確定要刪除以下債務嗎？此操作無法復原。
        </p>
        
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{debtTypes[debt.type]?.icon}</span>
            <div>
              <h4 className="font-medium text-gray-800">{debt.name}</h4>
              <p className="text-sm text-gray-600">
                {debt.type} • 餘額 {formatCurrency(debt.principal)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            確定刪除
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );

  // 債務卡片組件
  const DebtCard = ({ debt }) => {
    const progress = getPaymentProgress(debt);
    const dueStatus = getDueStatus(debt);

    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        {/* 頭部資訊 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-1 h-16 bg-${debt.color}-500 rounded-full mr-4`} />
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="mr-2 text-2xl">{debtTypes[debt.type]?.icon}</span>
                {debt.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {debt.type}
                </span>
                {debt.subType && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {debt.subType}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onShowEditForm(debt)}
              className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors"
              title="編輯債務"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(debt)}
              className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              title="刪除債務"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* 詳細資訊網格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-red-50 p-3 rounded-xl border border-red-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-red-600 font-medium">本金餘額</p>
              <DollarSign size={14} className="text-red-500" />
            </div>
            <p className="font-bold text-red-700">{formatCurrency(debt.principal)}</p>
            <p className="text-xs text-red-600">
              原始: {formatCurrency(debt.originalPrincipal)}
            </p>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-orange-600 font-medium">年利率</p>
              <TrendingUp size={14} className="text-orange-500" />
            </div>
            <p className={`font-bold ${getInterestRateColor(debt.interestRate)}`}>
              {debt.interestRate}%
            </p>
            <p className="text-xs text-orange-600">
              {debt.interestRate >= 10 ? '高利率' : debt.interestRate >= 5 ? '中等' : '低利率'}
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-blue-600 font-medium">月還款</p>
              <Calendar size={14} className="text-blue-500" />
            </div>
            <p className="font-bold text-blue-700">{formatCurrency(debt.minimumPayment)}</p>
            <p className="text-xs text-blue-600">每月 {debt.monthlyDueDay} 號</p>
          </div>
          
          <div className={`p-3 rounded-xl border ${dueStatus.bg} ${dueStatus.border}`}>
            <div className="flex items-center justify-between mb-1">
              <p className={`text-xs font-medium ${dueStatus.color}`}>
                {dueStatus.status === 'overdue' ? '已逾期' : 
                 dueStatus.status === 'due_soon' ? '即將到期' : '到期日'}
              </p>
              <Calendar size={14} className={dueStatus.color.replace('text-', 'text-')} />
            </div>
            <p className={`font-bold ${dueStatus.color}`}>
              {dueStatus.status === 'overdue' ? `逾期 ${dueStatus.days} 天` : 
               dueStatus.status === 'due_soon' ? `${dueStatus.days} 天後` : 
               new Date(debt.dueDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
            </p>
            <p className={`text-xs ${dueStatus.color}`}>
              {debt.dueDate}
            </p>
          </div>
        </div>

        {/* 還款進度條 */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600 font-medium">還款進度</span>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-green-600">{progress}%</span>
              <span className="text-gray-500">
                已還 {formatCurrency(debt.originalPrincipal - debt.principal)}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 relative">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500 relative"
              style={{ width: `${progress}%` }}
            >
              {progress > 20 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {progress}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 底部狀態提示 */}
        {progress > 0 && (
          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
            <p className="text-sm text-green-700 flex items-center">
              <CheckCircle className="mr-2" size={16} />
              <span className="font-medium">太棒了！</span> 
              您已經償還了 {formatCurrency(debt.originalPrincipal - debt.principal)}，
              距離清償目標還有 {formatCurrency(debt.principal)}
            </p>
          </div>
        )}

        {/* 警告提示 */}
        {(dueStatus.status === 'overdue' || dueStatus.status === 'due_soon') && (
          <div className={`p-3 rounded-xl border mt-3 ${dueStatus.bg} ${dueStatus.border}`}>
            <p className={`text-sm font-medium ${dueStatus.color} flex items-center`}>
              {dueStatus.status === 'overdue' ? (
                <>
                  <AlertTriangle className="mr-2" size={16} />
                  ⚠️ 還款已逾期，請盡快處理避免影響信用
                </>
              ) : (
                <>
                  <Clock className="mr-2" size={16} />
                  ⏰ 還款即將到期，請準備資金
                </>
              )}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">我的債務</h2>
          <p className="text-gray-600">管理和追蹤您的所有債務項目</p>
        </div>
        <button
          onClick={onShowAddForm}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center"
        >
          <Plus className="mr-2" size={16} />
          新增債務
        </button>
      </div>

      {/* 篩選和搜尋 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜尋框 */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜尋債務名稱、類型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 類型篩選 */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">所有類型</option>
              {Object.keys(debtTypes).map(type => (
                <option key={type} value={type}>
                  {debtTypes[type].icon} {type}
                </option>
              ))}
            </select>
          </div>

          {/* 排序 */}
          <div className="flex items-center space-x-2">
            <BarChart3 size={20} className="text-gray-600" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="principal-desc">餘額 (高到低)</option>
              <option value="principal-asc">餘額 (低到高)</option>
              <option value="interestRate-desc">利率 (高到低)</option>
              <option value="interestRate-asc">利率 (低到高)</option>
              <option value="dueDate-asc">到期日 (近到遠)</option>
              <option value="progress-desc">進度 (高到低)</option>
              <option value="progress-asc">進度 (低到高)</option>
            </select>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              共 <strong className="text-gray-800">{filteredAndSortedDebts.length}</strong> 項債務
              {searchTerm && ` • 搜尋「${searchTerm}」`}
              {filterType !== 'all' && ` • 類型：${filterType}`}
            </span>
            <span>
              總餘額：<strong className="text-red-600">
                {formatCurrency(filteredAndSortedDebts.reduce((sum, debt) => sum + debt.principal, 0))}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 債務列表 */}
      {filteredAndSortedDebts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {debts.length === 0 ? '尚未新增任何債務' : '找不到符合條件的債務'}
          </h3>
          <p className="text-gray-600 mb-6">
            {debts.length === 0 
              ? '開始新增您的第一筆債務，讓 AI 幫助您制定最佳還款策略'
              : '試試調整搜尋條件或篩選設定'
            }
          </p>
          {debts.length === 0 && (
            <button
              onClick={onShowAddForm}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              <Plus className="inline mr-2" size={16} />
              新增第一筆債務
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedDebts.map(debt => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          debt={showDeleteConfirm}
          onConfirm={() => {
            onDeleteDebt(showDeleteConfirm.id);
            setShowDeleteConfirm(null);
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default DebtsList;
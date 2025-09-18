import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, formatApiError } from '../services/api';
import { 
  CreditCard, 
  Target, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  PieChart
} from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    recentActivity: [],
    financialHealth: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API calls (since we don't have real data yet)
      const mockSummary = {
        totalDebts: 3,
        totalBalance: 15420.50,
        monthlyPayments: 1247.00,
        projectedPayoffDate: '2027-03-15',
        totalInterestSavings: 3420.75,
        activeStrategy: 'Debt Avalanche'
      };

      const mockActivity = [
        {
          id: 1,
          type: 'payment',
          description: '信用卡 - 台新銀行 付款',
          amount: 500.00,
          date: new Date().toISOString(),
          status: 'completed'
        },
        {
          id: 2,
          type: 'goal',
          description: '緊急基金目標達成 50%',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'milestone'
        }
      ];

      const mockFinancialHealth = {
        score: 72,
        factors: {
          debtToIncome: 0.35,
          paymentHistory: 0.95,
          creditUtilization: 0.28,
          emergencyFund: 0.60
        },
        recommendations: [
          '考慮增加緊急基金至 6 個月的支出',
          '優先還清高利率信用卡債務',
          '建立自動還款以改善信用記錄'
        ]
      };

      setDashboardData({
        summary: mockSummary,
        recentActivity: mockActivity,
        financialHealth: mockFinancialHealth
      });

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={loadDashboardData}>重試</Button>
      </div>
    );
  }

  const { summary, recentActivity, financialHealth } = dashboardData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-success-600 bg-success-100';
    if (score >= 60) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          歡迎回來，{user?.firstName || user?.username || '用戶'}！
        </h1>
        <p className="text-primary-100">
          讓我們繼續您的債務管理旅程，朝向財務自由邁進。
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總債務</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalBalance || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-error-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">月付款額</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.monthlyPayments || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">預計還清</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.projectedPayoffDate ? formatDate(summary.projectedPayoffDate) : '未設定'}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">財務健康</p>
              <p className={`text-2xl font-bold ${getHealthColor(financialHealth?.score || 0).split(' ')[0]}`}>
                {financialHealth?.score || 0}/100
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getHealthColor(financialHealth?.score || 0).split(' ')[1]}`}>
              <TrendingUp className={`w-6 h-6 ${getHealthColor(financialHealth?.score || 0).split(' ')[0]}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">最近活動</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'payment' ? 'bg-success-100' : 'bg-primary-100'
                      }`}>
                        {activity.type === 'payment' ? (
                          <DollarSign className={`w-4 h-4 ${
                            activity.type === 'payment' ? 'text-success-600' : 'text-primary-600'
                          }`} />
                        ) : (
                          <Target className={`w-4 h-4 ${
                            activity.type === 'payment' ? 'text-success-600' : 'text-primary-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.date)}
                          {activity.amount && (
                            <span className="ml-2 font-medium text-success-600">
                              -{formatCurrency(activity.amount)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暫無活動記錄</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Health & Recommendations */}
        <div className="space-y-6">
          {/* Financial Health Score */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">財務健康評分</h3>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                getHealthColor(financialHealth?.score || 0)
              }`}>
                <span className="text-2xl font-bold">
                  {financialHealth?.score || 0}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {financialHealth?.factors && Object.entries(financialHealth.factors).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {key === 'debtToIncome' && '負債收入比'}
                    {key === 'paymentHistory' && '還款記錄'}
                    {key === 'creditUtilization' && '信用使用率'}
                    {key === 'emergencyFund' && '緊急基金'}
                  </span>
                  <span className={`font-medium ${
                    value >= 0.8 ? 'text-success-600' : 
                    value >= 0.6 ? 'text-warning-600' : 'text-error-600'
                  }`}>
                    {Math.round(value * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">個人建議</h3>
            <div className="space-y-3">
              {financialHealth?.recommendations?.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              )) || (
                <p className="text-gray-500 text-sm">暫無建議</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <Button fullWidth variant="primary" size="sm">
                記錄付款
              </Button>
              <Button fullWidth variant="outline" size="sm">
                新增債務
              </Button>
              <Button fullWidth variant="ghost" size="sm">
                查看報表
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
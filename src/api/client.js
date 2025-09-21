const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const message = isJson && data?.error?.message ? data.error.message : response.statusText || 'Request failed';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

function login(credentials, options = {}) {
  return apiRequest('/auth/login', { method: 'POST', body: credentials, ...options });
}

function register(payload, options = {}) {
  return apiRequest('/auth/register', { method: 'POST', body: payload, ...options });
}

function fetchCurrentUser(token, options = {}) {
  return apiRequest('/users/me', { method: 'GET', token, ...options });
}

function updateProfile(token, payload, options = {}) {
  return apiRequest('/users/me', { method: 'PATCH', body: payload, token, ...options });
}

function updateMembership(token, membership, options = {}) {
  return apiRequest('/users/membership', { method: 'PATCH', body: { membership }, token, ...options });
}

function fetchDebts(token, options = {}) {
  return apiRequest('/debts', { method: 'GET', token, ...options });
}

function createDebt(token, payload, options = {}) {
  return apiRequest('/debts', { method: 'POST', body: payload, token, ...options });
}

function updateDebt(token, debtId, payload, options = {}) {
  return apiRequest(`/debts/${debtId}`, { method: 'PATCH', body: payload, token, ...options });
}

function deleteDebt(token, debtId, options = {}) {
  return apiRequest(`/debts/${debtId}`, { method: 'DELETE', token, ...options });
}

function fetchPayments(token, debtId, options = {}) {
  return apiRequest(`/debts/${debtId}/payments`, { method: 'GET', token, ...options });
}

function recordPayment(token, debtId, payload, options = {}) {
  return apiRequest(`/debts/${debtId}/payments`, { method: 'POST', body: payload, token, ...options });
}

export {
  ApiError,
  apiRequest,
  login,
  register,
  fetchCurrentUser,
  updateProfile,
  updateMembership,
  fetchDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  fetchPayments,
  recordPayment,
};

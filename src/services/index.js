import createAuthService from './authService.js';
import createUserService from './userService.js';
import createDebtService from './debtService.js';
import createStrategyService from './strategyService.js';
import createAnalyticsService from './analyticsService.js';
import createReminderService from './reminderService.js';

function createServices(context) {
  const userService = createUserService(context);
  const services = {
    auth: null,
    user: userService,
    debt: null,
    strategy: null,
    analytics: null,
    reminder: null,
  };
  services.auth = createAuthService({ ...context, services });
  services.debt = createDebtService({ ...context, services });
  services.strategy = createStrategyService({ ...context, services });
  services.analytics = createAnalyticsService({ ...context, services });
  services.reminder = createReminderService({ ...context, services });
  return services;
}

export default createServices;

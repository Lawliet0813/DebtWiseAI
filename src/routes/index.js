import registerAuthRoutes from './authRoutes.js';
import registerUserRoutes from './userRoutes.js';
import registerDebtRoutes from './debtRoutes.js';
import registerStrategyRoutes from './strategyRoutes.js';
import registerAnalyticsRoutes from './analyticsRoutes.js';
import registerReminderRoutes from './reminderRoutes.js';

function registerRoutes(router, context) {
  registerAuthRoutes(router, context);
  registerUserRoutes(router, context);
  registerDebtRoutes(router, context);
  registerStrategyRoutes(router, context);
  registerAnalyticsRoutes(router, context);
  registerReminderRoutes(router, context);
}

export default registerRoutes;

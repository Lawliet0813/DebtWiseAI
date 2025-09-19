function registerAnalyticsRoutes(router, context) {
  const { services } = context;

  router.get('/analytics/summary', async ({ user }) => {
    const summary = services.analytics.getSummary(user.id);
    return { status: 200, body: summary };
  });

  router.get('/analytics/distribution', async ({ user }) => {
    const distribution = services.analytics.getDistribution(user.id);
    return { status: 200, body: { distribution } };
  });

  router.get('/analytics/trends', async ({ user }) => {
    const trends = services.analytics.getTrends(user.id);
    return { status: 200, body: trends };
  });
}

export default registerAnalyticsRoutes;

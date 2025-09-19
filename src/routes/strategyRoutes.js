function registerStrategyRoutes(router, context) {
  const { services } = context;

  router.post('/strategies/simulate', async ({ user, body }) => {
    const result = services.strategy.simulate(user.id, body || {});
    return { status: 200, body: result };
  });

  router.post('/strategies/compare', async ({ user, body }) => {
    const result = services.strategy.compare(user.id, body || {});
    return { status: 200, body: result };
  });
}

export default registerStrategyRoutes;

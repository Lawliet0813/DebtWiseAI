function registerAuthRoutes(router, context) {
  const { services } = context;

  router.post('/auth/register', { auth: false }, async ({ body }) => {
    const result = services.auth.register(body || {});
    return { status: 201, body: result };
  });

  router.post('/auth/login', { auth: false }, async ({ body }) => {
    const result = services.auth.login(body || {});
    return { status: 200, body: result };
  });

  router.post('/auth/forgot-password', { auth: false }, async ({ body }) => {
    const result = services.auth.requestPasswordReset(body || {});
    return { status: 200, body: result };
  });
}

export default registerAuthRoutes;

function registerUserRoutes(router, context) {
  const { services } = context;

  router.get('/users/me', async ({ user }) => {
    const profile = await services.user.getProfile(user.id);
    return { status: 200, body: { user: profile } };
  });

  router.patch('/users/me', async ({ user, body }) => {
    const updated = await services.user.updateProfile(user.id, body || {});
    return { status: 200, body: { user: updated } };
  });

  router.patch('/users/membership', async ({ user, body }) => {
    const membership = (body && body.membership) || 'free';
    const updated = await services.user.updateMembership(user.id, membership);
    return { status: 200, body: { user: updated } };
  });
}

export default registerUserRoutes;

function registerDebtRoutes(router, context) {
  const { services } = context;

  router.post('/debts', async ({ user, body }) => {
    const debt = await services.debt.createDebt(user, body || {});
    return { status: 201, body: { debt } };
  });

  router.get('/debts', async ({ user, query }) => {
    const debts = await services.debt.listDebts(user.id, query || {});
    return { status: 200, body: { debts } };
  });

  router.get('/debts/:id', async ({ user, params }) => {
    const debt = await services.debt.getDebt(user.id, params.id);
    return { status: 200, body: { debt } };
  });

  router.patch('/debts/:id', async ({ user, params, body }) => {
    const debt = await services.debt.updateDebt(user.id, params.id, body || {});
    return { status: 200, body: { debt } };
  });

  router.delete('/debts/:id', async ({ user, params }) => {
    const result = await services.debt.deleteDebt(user.id, params.id);
    return { status: 200, body: result };
  });

  router.post('/debts/:id/payments', async ({ user, params, body }) => {
    const result = await services.debt.recordPayment(user.id, params.id, body || {});
    return { status: 201, body: result };
  });

  router.get('/debts/:id/payments', async ({ user, params }) => {
    const payments = await services.debt.listPayments(user.id, params.id);
    return { status: 200, body: { payments } };
  });
}

export default registerDebtRoutes;

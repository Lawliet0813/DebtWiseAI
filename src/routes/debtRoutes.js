function registerDebtRoutes(router, context) {
  const { services } = context;

  router.post('/debts', async ({ user, body }) => {
    const debt = services.debt.createDebt(user, body || {});
    return { status: 201, body: { debt } };
  });

  router.get('/debts', async ({ user, query }) => {
    const debts = services.debt.listDebts(user.id, query || {});
    return { status: 200, body: { debts } };
  });

  router.get('/debts/:id', async ({ user, params }) => {
    const debt = services.debt.getDebt(user.id, params.id);
    return { status: 200, body: { debt } };
  });

  router.patch('/debts/:id', async ({ user, params, body }) => {
    const debt = services.debt.updateDebt(user.id, params.id, body || {});
    return { status: 200, body: { debt } };
  });

  router.delete('/debts/:id', async ({ user, params }) => {
    const result = services.debt.deleteDebt(user.id, params.id);
    return { status: 200, body: result };
  });

  router.post('/debts/:id/payments', async ({ user, params, body }) => {
    const result = services.debt.recordPayment(user.id, params.id, body || {});
    return { status: 201, body: result };
  });

  router.get('/debts/:id/payments', async ({ user, params }) => {
    const payments = services.debt.listPayments(user.id, params.id);
    return { status: 200, body: { payments } };
  });
}

export default registerDebtRoutes;

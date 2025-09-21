function registerReminderRoutes(router, context) {
  const { services } = context;

  router.get('/reminders/upcoming', async ({ user }) => {
    const reminders = await services.reminder.getUpcomingReminders(user);
    return { status: 200, body: { reminders } };
  });

  router.get('/reminders', async ({ user }) => {
    const reminders = await services.reminder.listCustomReminders(user.id);
    return { status: 200, body: { reminders } };
  });

  router.post('/reminders', async ({ user, body }) => {
    const reminder = await services.reminder.createCustomReminder(user.id, body || {});
    return { status: 201, body: { reminder } };
  });
}

export default registerReminderRoutes;

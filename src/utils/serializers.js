function sanitizeUser(user) {
  const { passwordHash, role, ...publicUser } = user;
  return { ...publicUser, role: role || 'user' };
}

export {
  sanitizeUser,
};

function sanitizeUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export {
  sanitizeUser,
};

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

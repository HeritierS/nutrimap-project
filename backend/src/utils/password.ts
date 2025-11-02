import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = (pw: string) => bcrypt.hash(pw, SALT_ROUNDS);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

import jwt, { SignOptions } from 'jsonwebtoken';

const generateToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  };
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback', options);
};

export default generateToken;

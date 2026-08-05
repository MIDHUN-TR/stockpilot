// creating production ready helper function for generating JWT token 

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

//defining the environment variable structure safety



const secretKey = process.env.JWT_SECRET_KEY

// ensuring that the secret key is defined
if (!secretKey) {
    throw new Error('JWT_SECRET_KEY is not defined in environment variables');
}

const JWT_SECRET_KEY: string = secretKey;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; //Defining the expiry time if not set

//Defining the roles that can be assigned to users
export type UserRole = 'admin' | 'staff' | 'user' | 'superadmin' | 'manager' | 'guest';

// Defining the exact shape of Token Payload
export interface UserTokenPayload extends JwtPayload {
    userId: number;
    email: string;
    role: UserRole;
}


export const generateToken = (
    payload: Omit<UserTokenPayload, 'iat' | 'exp'>,
    options?: SignOptions
): string => {
    return jwt.sign(payload, JWT_SECRET_KEY, {
        ...options,
        expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],

    })
}
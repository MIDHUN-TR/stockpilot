// Production-ready helper functions for generating and verifying JWT tokens

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtVerify } from "jose";
import { Role } from "@prisma/client";

// Ensure the secret key is defined at module load
const secretKey = process.env.JWT_SECRET_KEY;
if (!secretKey) {
    throw new Error("JWT_SECRET_KEY is not defined in environment variables");
}

const JWT_SECRET_KEY: string = secretKey;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Single source of truth for the token payload shape
export interface UserTokenPayload extends JwtPayload {
    userId: number;
    email: string;
    role: Role;
}

export const generateToken = (
    payload: Omit<UserTokenPayload, "iat" | "exp">,
    options?: SignOptions
): string => {
    return jwt.sign(payload, JWT_SECRET_KEY, {
        ...options,
        expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });
};

export const verifyToken = async (token: string): Promise<UserTokenPayload> => {
    try {
        const secret = process.env.JWT_SECRET_KEY;
        if (!secret) throw new Error("JWT_SECRET_KEY is missing");

        const encodedSecret = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, encodedSecret);

        return payload as unknown as UserTokenPayload;
    } catch (e) {
        console.error("Error verifying token:", e);
        throw new Error("Invalid Token");
    }
};
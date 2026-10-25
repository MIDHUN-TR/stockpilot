import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import bcrypt from "bcrypt"; // Fixed typo from 'becrypt'
import { generateToken } from "@/lib/auth/jwt";
import { Prisma } from "@prisma/client";


type Data = {
        email?: string;
        password?: string;
};

// Timeout helper function
const timeout = (ms: number) => new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
);

export async function POST(request: Request) {
        try {
                // 1. Enforce a timeout wrapper for the entire core execution logic
                return await Promise.race([
                        handleLogin(request),
                        timeout(8000) // 8-second execution limit
                ]);
        } catch (e: unknown) {
                // 1. Handle the request timeout explicitly
                if (e instanceof Error && e.message === "Timeout") {
                        return NextResponse.json({ error: "Request timeout. Please try again." }, { status: 504 });
                }

                // 2. Handle known Prisma Database errors
                if (e instanceof Prisma.PrismaClientKnownRequestError) {
                        console.error(`Prisma Error [${e.code}]:`, e.message);

                        // P2024: Database connection timeout
                        if (e.code === 'P2024') {
                                return NextResponse.json({ error: "Database connection timeout" }, { status: 503 });
                        }

                        // General safe error message for other database restrictions
                        return NextResponse.json({ error: "A database error occurred" }, { status: 500 });
                }

                // 3. Fallback for all other unknown exceptions (Secure: No raw error leakage)
                console.error("Login route error:", e);
                return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
}

async function handleLogin(request: Request) {
        // Edge case: Catch malformed or missing JSON payloads
        let body: Data;
        try {
                body = await request.json() as Data;
        } catch {
                return NextResponse.json({ error: "Invalid JSON body provided" }, { status: 400 });
        }

        const { email, password } = body;

        // Edge case: Validate presence of credentials before hitting DB
        if (!email || !password) {
                return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Edge case: Validate basic email syntax format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
                return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        // Find user
        const checkUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() } // Normalize data access
        });

        // Loophole/Timing Attack Mitigation: 
        // Run a dummy bcrypt hash compare if the user doesn't exist so the response time stays uniform.
        if (!checkUser) {
                await bcrypt.compare(password, "$2b$10$abcdefghijklmnopqrstuvwx");
                return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, checkUser.passwordHash);
        if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Generate JWT Auth Token
        const token = generateToken({
                userId: checkUser.id,
                email: checkUser.email,
                //typescript fallback mapping
                role: checkUser.role
        });

        // Update login timestamp asynchronously (don't block user response)
        prisma.user.update({
                where: { id: checkUser.id },
                data: { lastLoginAt: new Date() }
        }).catch(err => console.error("Failed to update lastLoginAt:", err));

        // Prepare response
        const response = NextResponse.json({
                message: "Login successful",
                user: {
                        id: checkUser.id,
                        email: checkUser.email,
                }
        }, { status: 200 });

        // Set HTTP-only Cookie
        response.cookies.set("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24, // 1 day
        });

        return response;
}

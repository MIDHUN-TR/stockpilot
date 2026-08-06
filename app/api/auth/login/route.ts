import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import becrypt from "bcrypt"
import { generateToken } from "@/lib/auth/jwt";
type Data = {
        email: string,
        password: string
}

export async function POST(request: Request) {
        try {
                const body = await request.json() as Data
                const { email, password } = body

                const checkUser = await prisma.user.findUnique({
                        where: { email }
                })
                if (!checkUser) {
                        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
                }
                const compare = await becrypt.compare(password, checkUser.passwordHash)
                if (!compare) {
                        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
                }

                const token = generateToken({
                        userId: checkUser.id,
                        email: checkUser.email,
                        role: checkUser.role as unknown as string
                })

                await prisma.user.update({
                        where: { id: checkUser.id },
                        data: { lastLoginAt: new Date() }
                })
                const response = NextResponse.json({ message: "Login successful" }, { status: 200 })
                // Set the JWT as an httpOnly cookie so middleware can read it
                response.cookies.set("auth_token", token, {
                        httpOnly: true,          // JS cannot access this cookie (prevents XSS theft)
                        secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                        sameSite: "lax",         // Protects against CSRF
                        path: "/",               // Cookie available on all routes
                        maxAge: 60 * 60 * 24,    // 1 day (matches JWT_EXPIRES_IN)
                })
                return response
        }
        catch (e) {
                return NextResponse.json({ message: e }, { status: 500 })
        }

}
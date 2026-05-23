import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import becrypt from "bcrypt"



export async function POST(request: Request) {
        try {
                const body = await request.json()
                const { email,password } = body

                const checkUser = await prisma.user.findUnique({
                        where: {email}
                })
                if (!checkUser) {
                        return NextResponse.json({ message: "User not found" }, { status: 404 })
                }
                const compare  = await becrypt.compare(password ,checkUser.password_hash)
                if(!compare){
                        return NextResponse.json({error:"Wrong password"},{status:404})
                }

                return NextResponse.json({ message: "User  found",data:checkUser }, { status: 200 })
        }
        catch (e) {
                return NextResponse.json({ message: e }, { status: 500 })
        }

}
import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import becrypt from "bcrypt"
import { generateToken } from "@/lib/auth/jwt";
type Data = {
        email:string,
        password:string
}

export async function POST(request: Request) {
        try {
                const body = await request.json() as Data
                const { email,password } = body

                const checkUser = await prisma.user.findUnique({
                        where: {email}
                })
                if (!checkUser) {
                        return NextResponse.json({ message: "User not found" }, { status: 404 })
                }
                const compare  = await becrypt.compare(password ,checkUser.passwordHash)
                if(!compare){
                        return NextResponse.json({error:"Wrong password"},{status:404})
                }
                
                const token = generateToken({
                        userId:checkUser.id,
                        email:checkUser.email,
                        role:checkUser.role as unknown as string
                })

                await prisma.user.update({
                        where:{id:checkUser.id},
                        data:{lastLoginAt:new Date()}
                })
                console.log(checkUser)
                return NextResponse.json({ message: "User found",token }, { status: 200 })
        }
        catch (e) {
                return NextResponse.json({ message: e }, { status: 500 })
        }

}
import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import bcrypt from 'bcrypt'

type Data = {
    name: string,
    email: string,
    password: string,
    confirmpassword: string

}


export async function POST(request: Request) {
    try {
        const body = await request.json() as Data

        const { name, email, password, confirmpassword } = body
        const checkUser = await prisma.user.findUnique({
            where:{email}
        })
        if(checkUser){
            return NextResponse.json({message:"User already Registered",checkUser},{status:409})
        }
        if (password != confirmpassword) {
            return NextResponse.json({ message: "Password doen't matching" }, { status: 401 })
        }
        const hashed_password = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password_hash: hashed_password
            },

        })
        console.log(newUser)
        return NextResponse.json({ message: "New user created", userId: newUser }, { status: 201 })
        
    }
    catch (e: unknown) {
        const errormessage = e instanceof Error?e.message : String(e)
        console.error("Backend Error:",errormessage)
        return NextResponse.json({ message: "Something went wrong in backend :", error:errormessage }, { status: 500 })
    }



}
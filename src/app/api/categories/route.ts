import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import {Prisma} from "@prisma/client";
type category = {
    name: string
    parentCategoryId?: number | string;
}
export async function POST(request: Request) {
    try {
        const body = (await request.json()) as category
        const name = body.name?.trim()
        const parentCategoryId = body.parentCategoryId ? Number(body.parentCategoryId) : undefined

        if (!name) {
            return NextResponse.json({ message: "Category name is required" }, { status: 400 })
        }

        const existingCategory = await prisma.category.findUnique({
            where: { name }
        })
        if (existingCategory) {
            return NextResponse.json({ message: "Category already exists" }, { status: 409 })
        }

        if (parentCategoryId) {
            const parentExists = await prisma.category.findUnique({
                where: { id: parentCategoryId }
            })
            if (!parentExists) {
                return NextResponse.json({ message: "Parent category does not exist" }, { status: 400 })
            }
        }

        const newCategory = await prisma.category.create({
            data: {
                name,
                parentCategoryId: parentCategoryId ?? null
            }
        })

        return NextResponse.json({ message: "New category created", newCategory }, { status: 201 })
    }
    catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return NextResponse.json({ message: "Category already exists" }, { status: 409 })
        }
        console.error("Error", e)
        return NextResponse.json({ message: "Something went wrong in categories api", error: e }, { status: 500 })
    }
}

export async function GET(){
    try{
        const Categories = await prisma.category.findMany()

        return NextResponse.json({Message:"Fetched all categories",Categories},{status:200})
    }
    catch(e:unknown){
        console.error("Error:",e)
        return NextResponse.json({message:"Something went wrong in category GET api",error:e},{status:500})
    }
}
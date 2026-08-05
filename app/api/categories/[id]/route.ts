// Importing the db from 
import prisma from "@/lib/db/db";
// Importing Prisma client
import { Prisma } from "@prisma/client";
// imported NextResponse for responses
import { NextResponse } from "next/server";

// Created a interface for extract the id from the URL
interface RouteContext {
    params: Promise<{ id: string }>
}

// Creating a Interface for dynamic body Values

interface BodyData {
    name?: string
    parent_category_id?: number
}
// Create a PATCH function update Category
export async function PATCH(
    request: Request,
    context: RouteContext) {
    try {
        // Storing the id from URL 
        const id = await context.params

        // make sure the id is number
        const CategoryId = Number(id.id)

        // Extra guard for Ensuring the given id is not other type
        if (isNaN(CategoryId)) {
            return NextResponse.json({ error: "The given id format is invalid" }, { status: 400 })
        }

        // Destructuring the body 
        const body: BodyData = await request.json()
        // Update the category

        const UpdateCategory = await prisma.category.update({
            where: { id: CategoryId },
            data: {
                name: body.name,
                parent_category_id: body.parent_category_id
            }
        })

        // Returning the Response
        return NextResponse.json(UpdateCategory, { status: 200 })
    }
    catch (error: unknown) {

        return NextResponse.json({ Message: "Something went wrong in category PATCH api", error }, { status: 500 })
    }
}

export async function DELETE(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params
        const CategoryId = Number(id)

        if (isNaN(CategoryId)) {
            return NextResponse.json({ message: "Id must be valid type" }, { status: 400 })
        }

         await prisma.category.delete({
            where: { id: CategoryId }
        })
        return NextResponse.json({ Message: "Successfully category is deleted" }, { status: 200 })

    }
    catch (error: unknown) {
        // This is an extra layer for if user tried to delete the data that not exist in database
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"){
            return NextResponse.json({Message:"The data not existing"},{status:404})
        }
        console.error(error)
        return NextResponse.json({ Message: "Invalid error in Category Delete Api" }, { status: 500 })}
    }
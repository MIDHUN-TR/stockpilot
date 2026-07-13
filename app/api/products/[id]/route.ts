import prisma from "@/lib/db/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";


interface ProductPayload {
    sku?: string
    name?: string
    description?: string
    categoryId?: number
    price?: number | string
    costPrice?: number | string
    isActive?: boolean
}
// PATCH method to edit the product

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = (await request.json()) as ProductPayload
        // Prevent a database call if the user sent an empty object
        if (Object.keys(body).length === 0) {
            return NextResponse.json({ message: "No data provided to update" }, { status: 400 })
        }
        const ID = Number(params.id)
        // Optional check if the ID is actually a number
        if (isNaN(ID)) {
            return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
        }

        const check_product = await prisma.product.findUnique({
            where: {
                id: ID
            }
        })

        // check if the product exists, if it does then update the product
        if (check_product) {
            await prisma.product.update({
                where: {
                    id: ID
                },
                data: body
            })
            return NextResponse.json({ message: "Successfully updated product" }, { status: 200 })
        }

        return NextResponse.json({ message: "The product doesn't exist" }, { status: 404 })
    }
    catch (e) {
        const errormessage = e instanceof Error ? e.message : "Unknown error"
        return NextResponse.json({ message: "Edit function error:", error: errormessage }, { status: 500 })
    }
}

// Creating Delete method to delete a product
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try { 
        // Storing the params id in ID variable
        const ID = Number(params.id)
        // Optional checking id is actually a number
        if (isNaN(ID)) {
            return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
        }
        // Deleting the product from the database
        await prisma.product.delete({
            where: {
                id: ID
            }
        })
        return NextResponse.json({ message: "Successfully deleted product" }, { status: 200 })
    }
    catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
            return NextResponse.json({ message: "The product doesn't exist" }, { status: 404 })
        }
        const errormessage = e instanceof Error ? e.message : "Unknown error"
        return NextResponse.json({ message: "Delete function error:", error: errormessage }, { status: 500 })
    }
}
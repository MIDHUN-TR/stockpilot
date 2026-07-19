import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface WarehousePayload {
    code: string;
    name: string;
    location?: string;
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as WarehousePayload;
        // Prevent a database call if the user sent an empty object
        if (!body || Object.keys(body).length === 0) {
            return NextResponse.json({ message: "No data provided to create warehouse" }, { status: 400 })
        }
        if (!body.code || !body.name) {
            return NextResponse.json({ message: "Warehouse code and name are required" }, { status: 400 })
        }
        await prisma.warehouse.create({
            data: {
                code: body.code,
                name: body.name,
                location: body.location || null,
            },
        })
        return NextResponse.json({ message: "Successfully created warehouse" }, { status: 201 })
    }
    catch (e: unknown) {
        if (e&& typeof e === "object" &&'code'in e &&  e.code === "P2002") {
            return NextResponse.json({ message: "Warehouse with this code already exists" }, { status: 400 })
        }

        const errormessage = e instanceof Error ? e.message : "Unknown error"
        console.error("Warehouse creation backend error: ", errormessage)
        return NextResponse.json({ message: "Something went wrong in warehouse creation" }, { status: 500 })
    }

}
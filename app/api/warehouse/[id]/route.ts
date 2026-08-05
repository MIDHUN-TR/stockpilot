import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

//creating a interface for the warehouse data
interface WarehousePayload {
    code?: string;
    name?: string;
    location?: string;
}

// creating the PATCH method to update a warehouse by id
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // awaiting the params to get the id of the warehouse to be updated 
        const reservedParams = await params;
        // convert into number 
        const id = parseInt(reservedParams.id, 10);
        const body = (await request.json()) as WarehousePayload;
        if(isNaN(id)){
            return NextResponse.json({ message: "Invalid warehouse ID" }, { status: 400 });
        }
        
        const updatedWarehouse = await prisma.warehouse.update({
            where: { id },
            data:body,
        });

        return NextResponse.json(updatedWarehouse, { status: 200 });
    } catch (e:unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError ) {  
            if (e.code === 'P2002') {
                return NextResponse.json({ message: "Warehouse with this code already exists" }, { status: 400 });
            }
            if (e.code === 'P2025') {
                return NextResponse.json({ message: "Warehouse with this ID doesn't exist" }, { status: 400 });
            }
        }
        const errormessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Warehouse update backend error: ", errormessage);
        return NextResponse.json({ message: "Something went wrong in warehouse update" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reservedParams = await params;
        const id = parseInt(reservedParams.id, 10);
        if(isNaN(id)){
            return NextResponse.json({ message: "Invalid warehouse ID" }, { status: 400 });
        }
        await prisma.warehouse.delete({
            where: { id },
        }); 
        return NextResponse.json({message: "Warehouse deleted successfully"}, { status: 200 });
    } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2025') {
                return NextResponse.json({ message: "Warehouse with this ID doesn't exist" }, { status: 404 });
            }
        }
        const errormessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Warehouse delete backend error: ", errormessage);
        return NextResponse.json({ message: "Something went wrong in warehouse delete" }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // awaiting the params to get the id of the warehouse to be fetched
        const reservedParams = await params;    
        // convert into number
        const id = parseInt(reservedParams.id, 10);
        // check if the id is a number, if not return a 400 error
        if(isNaN(id)){
            return NextResponse.json({ message: "Invalid warehouse ID" }, { status: 400 });
        }
        // fetch the warehouse from the database using prisma
        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
        });
        // checking warehouse with the given id exists or not, if not return a 404 error
        if (!warehouse) {
            return NextResponse.json({ message: "Warehouse with this ID doesn't exist" }, { status: 404 });
        }
        // return fetched warehouse data as json with a 200 status code
        return NextResponse.json(warehouse, { status: 200 });
    } catch (e: unknown) {
        // log the error message to the console for debugging purposes
        const errormessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Warehouse get backend error: ", errormessage);
        return NextResponse.json({ message: "Something went wrong in warehouse get" }, { status: 500 });
    }
}

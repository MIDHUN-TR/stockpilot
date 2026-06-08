// Importing the db from 
import prisma from "@/lib/db/db";
// imported NextResponse for responses
import { NextResponse } from "next/server";

// Created a interface for extract the id from the URL
interface RouteContext  {
    params:Promise<{id:string}>
}

// Creating a Interface for dynamic body Values

interface BodyData {
    name?:string
    parent_category_id?:number
}
// Create a PATCH function update Category
export async function PATCH(
    request:Request,
    context:RouteContext){
    try{
        // Storing the id from URL 
        const id  = await context.params
        
        // make sure the id is number
        const CategoryId = Number(id.id)
        
        // Extra guard for Ensuring the given id is not other type
        if(isNaN(CategoryId)){
            return NextResponse.json({error:"The given id format is invalid"},{status:400})
        }

        // Destructuring the body 
        const body:BodyData = await request.json()
        // Update the category

        const UpdateCategory = await prisma.category.update({
            where:{id:CategoryId},
            data:{
                name:body.name,
                parent_category_id:body.parent_category_id
            }
        })
        
        // Returning the Response
        return NextResponse.json(UpdateCategory,{status:200})
    }
    catch(error:unknown){
        
        return NextResponse.json({Message:"Something went wrong in category PATCH api",error},{status:500})
    }
}
import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
type category ={
    name:string
    parent_category_id:number
}
export default async function POST(request:Request){
    try{
        // parsing the credentials
        const body = await request.json() as category
        // destructuring the body
        const {name,parent_category_id} = body
        
        // checking the provide parent is exist or not
        if(parent_category_id){
            const parentExits = await prisma.category.findUnique({
                where:{id:Number(parent_category_id)}
            })
            if(!parentExits){
                return NextResponse.json({message:"Parentcategory not exits"},{status:400})
            }
        }

        // New category is creating 
        const newCategory = await prisma.category.create({
            data:{
                name:name,
                parent_category_id:parent_category_id?Number(parent_category_id) : null
            }
        })

        // returning the response
        return NextResponse.json({message:"New category is created:",newCategory},{status:201})
    }
    catch(e:unknown){
        
        return NextResponse.json({message:"something went wrong in categories api",e},{status:500})
    }
}
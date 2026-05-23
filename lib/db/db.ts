import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
    connectionString:process.env.DATABASE_URL!
})
const prismaClientSingleton = ()=>{
    return new PrismaClient({adapter})
}

declare global{
    var prismaglobal : undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaglobal ?? prismaClientSingleton()

export default prisma

if(process.env.NODE_ENV !== "production") globalThis.prismaglobal =prisma
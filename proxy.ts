// creating a middleware root for protect the api routes and pages with jwt token verification and role based access control
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// importing jwt token verification and role types from lib/auth/jwt.ts
import { verifyToken } from "./lib/auth/jwt"


// Define RBAC Logic: Map specific routes to allowed roles.
const rbacRules = [
    // Admins only
    { path: '/settings', allowedRoles: ['admin'] },
    { path: '/api/warehouse', allowedRoles: ['admin'] },
    
    // Managers and Admins
    { path: '/inventory', allowedRoles: ['admin', 'manager'] },
    { path: '/api/inventory', allowedRoles: ['admin', 'manager'] },
    
    // Everyone (assuming basic users have 'user' role)
    { path: '/dashboard', allowedRoles: ['admin', 'manager', 'user'] },
    { path: '/orders', allowedRoles: ['admin', 'manager', 'user'] },
    { path: '/products', allowedRoles: ['admin', 'manager', 'user'] },
    { path: '/analytics', allowedRoles: ['admin', 'manager', 'user'] },
    // API routes
    { path: '/api/categories', allowedRoles: ['admin', 'manager', 'user'] },
    { path: '/api/products', allowedRoles: ['admin', 'manager', 'user'] },
    { path: '/api/stock-movements', allowedRoles: ['admin', 'manager', 'user'] },
]

export default async function middleware(request: NextRequest) {
    const {pathname} = request.nextUrl
    const token = request.cookies.get("auth_token")?.value
    //Protecting specific routes based on user roles. You can customize this list based on your application's requirements.
    
    // if there is no token, redirect to login page
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    try{
        // Verify token and get the user's role
        const payload = await verifyToken(token)
        const userRole = payload.role as string
        console.log("User role from token:", userRole)
        if (!userRole) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Find the RBAC rule for the current path
        const matchedRule = rbacRules.find(rule => pathname.startsWith(rule.path))
        // If a rule exists, check if the user's role is allowed
        if (matchedRule && !matchedRule.allowedRoles.includes(userRole)) {
             // User is logged in, but their role is not allowed here (e.g., a 'user' trying to access '/settings')
            return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
        return NextResponse.next()
    }
    catch (error) {
        console.error("Token verification failed:", error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

// The Gatekeeper: Only wake up the middleware for these paths
export const config = { 
    matcher:[
        '/analytics/:path*',
        '/dashboard/:path*',
        '/inventory/:path*',
        '/orders/:path*',
        '/products/:path*',
        '/settings/:path*',
        '/api/categories/:path*',
        '/api/inventory/:path*',
        '/api/products/:path*',
        '/api/stock-movements/:path*',
        '/api/warehouse/:path*'
    ]
}

// import { NextResponse } from "next/server"
// import type { NextRequest } from "next/server"
// import { verifyToken } from "./lib/auth/jwt"

// // Example Rules (Make sure specific routes are at the TOP)
// const rbacRules = [
//     { path: '/api/inventory', allowedRoles: ['admin', 'manager'] },
//     // Add other rules below...
// ]

// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl
    
//     // DEBUG LOG 1: Check if middleware is awake
//     console.log("----------------------------------------")
//     console.log("🚨 MIDDLEWARE TRIGGERED FOR:", pathname)

//     const token = request.cookies.get("auth_token")?.value

//     if (!token) {
//         console.log("❌ No token found. Blocking request.")
//         return NextResponse.json({ error: "No token" }, { status: 401 })
//     }

//     try {
//         const payload = await verifyToken(token)
//         const userRole = payload.role as string

//         // DEBUG LOG 2: Check what role the token actually has
//         console.log("👤 USER ROLE FROM TOKEN:", userRole)

//         // Find matching rule
//         const matchedRule = rbacRules.find((rule) => pathname.startsWith(rule.path))

//         if (matchedRule) {
//             // DEBUG LOG 3: See which rule was matched
//             console.log("🎯 MATCHED RULE:", matchedRule.path)
//             console.log("✅ ALLOWED ROLES:", matchedRule.allowedRoles)

//             if (!matchedRule.allowedRoles.includes(userRole)) {
//                 console.log(`⛔ ACCESS DENIED for ${userRole}`)
//                 return NextResponse.json({ error: "Unauthorized role" }, { status: 403 })
//             } else {
//                 console.log(`🟢 ACCESS GRANTED for ${userRole}`)
//             }
//         } else {
//             console.log("⚠️ NO RULE MATCHED. Letting request pass.")
//         }

//         return NextResponse.next()

//     } catch (error) {
//         // DEBUG LOG 4: Check if verification crashed
//         console.log("💥 ERROR IN MIDDLEWARE:", error)
//         return NextResponse.json({ error: "Middleware error" }, { status: 500 })
//     }
// }

// export const config = {
//     matcher: [
//         '/api/inventory',
//         '/api/inventory/:path*'
//     ],
// }
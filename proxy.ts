// creating a middleware root for protect the api routes and pages with jwt token verification and role based access control
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// importing jwt token verification and role types from lib/auth/jwt.ts
import { verifyToken } from "./lib/auth/jwt"


// Define RBAC Logic: Map specific routes to allowed roles.
const rbacRules = [
    // Admins only
    { path: '/settings', allowedRoles: ['Admin'] },
    { path: '/api/warehouse', allowedRoles: ['Admin'] },
    
    // Managers and Admins
    { path: '/inventory', allowedRoles: ['Admin', 'Manager'] },
    { path: '/api/inventory', allowedRoles: ['Admin', 'Manager'] },
    
    // Everyone (assuming basic users have 'Staff' role)
    { path: '/dashboard', allowedRoles: ['Admin', 'Manager', 'Staff'] },
    { path: '/orders', allowedRoles: ['Admin', 'Manager', 'Staff'] },
    { path: '/products', allowedRoles: ['Admin', 'Manager', 'Staff'] },
    { path: '/analytics', allowedRoles: ['Admin', 'Manager', 'Staff'] },
    
    // API routes
    { path: '/api/categories', allowedRoles: ['Admin', 'Manager', 'Staff'] },
    { path: '/api/products', allowedRoles: ['Admin', 'Manager', 'Staff'] },
    { path: '/api/stock-movements', allowedRoles: ['Admin', 'Manager', 'Staff'] },
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


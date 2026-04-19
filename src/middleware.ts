import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // If user is on a public path, allow without checking token
    const publicPaths = ['/login', '/register', '/api/auth']
    const isPublicPath = publicPaths.some(path => 
      req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
    )
    
    if (isPublicPath) {
      return NextResponse.next()
    }
    
    // Allow access if user is authenticated
    if (req.nextauth.token) {
      return NextResponse.next()
    }
    
    return NextResponse.redirect(new URL('/login', req.url))
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow public paths without token
        const publicPaths = ['/login', '/register', '/api/auth']
        const isPublicPath = publicPaths.some(path => 
          req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
        )
        
        if (isPublicPath) return true
        
        // Require token for protected paths
        return token !== null
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

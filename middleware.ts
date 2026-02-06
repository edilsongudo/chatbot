import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Get the pathname of the request (e.g. /, /protected)
    const path = request.nextUrl.pathname

    // Define public paths that don't require authentication
    const isPublicPath = path === '/login' || path === '/signup' || path.startsWith('/_next') || path.startsWith('/favicon.ico') || path.startsWith('/static')

    // Get the token from the cookies
    const token = request.cookies.get('auth_token')?.value

    // Redirect to login if accessing protected route without token
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to home if accessing login while authenticated
    if (path === '/login' && token) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}

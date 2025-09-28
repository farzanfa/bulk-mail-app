// Type declarations for Next.js modules
declare module 'next/server' {
  export class NextResponse extends Response {
    static next(): NextResponse;
    static redirect(url: string | URL): NextResponse;
    static json(data: any): NextResponse;
    static rewrite(url: string | URL): NextResponse;
    headers: Headers;
  }
}

declare module 'next-auth/middleware' {
  export function withAuth(middleware: any, config?: any): any;
  export interface NextRequestWithAuth extends Request {
    nextauth: {
      token: any;
    };
  }
}

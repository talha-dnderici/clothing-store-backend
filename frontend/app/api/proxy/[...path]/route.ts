import { NextRequest, NextResponse } from 'next/server';

const allowedMethods = new Set(['GET', 'POST', 'PATCH', 'DELETE']);

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const method = request.method.toUpperCase();

  if (!allowedMethods.has(method)) {
    return NextResponse.json(
      { message: `Method ${method} is not supported by the playground proxy.` },
      { status: 405 },
    );
  }

  const { path } = await context.params;
  const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { message: 'API_BASE_URL is not configured for the frontend container.' },
      { status: 500 },
    );
  }

  const targetUrl = new URL(path.join('/'), `${baseUrl.replace(/\/$/, '')}/`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // The proxy forwards body content only for methods that can legally send one.
  const shouldForwardBody = !['GET', 'HEAD'].includes(method);

  const response = await fetch(targetUrl, {
    method,
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    },
    body: shouldForwardBody ? await request.text() : undefined,
    cache: 'no-store',
  });

  const responseText = await response.text();

  return new NextResponse(responseText, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

import { NextRequest, NextResponse } from "next/server";
import { BackendRequestError, backendRequest } from "@/lib/server/backend-api";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleRequest(
  request: NextRequest,
  { params }: RouteContext,
) {
  const { path } = await params;
  const endpoint = `/${path.join("/")}${request.nextUrl.search}`;
  const contentType = request.headers.get("content-type");
  const bodyBuffer =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  const body =
    bodyBuffer && bodyBuffer.byteLength > 0
      ? new Uint8Array(bodyBuffer)
      : undefined;

  try {
    const data = await backendRequest(endpoint, {
      method: request.method,
      headers: contentType ? { "Content-Type": contentType } : undefined,
      body,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof BackendRequestError) {
      const isServerError = error.status >= 500;
      const logMessage = `[Backend proxy] ${request.method} ${endpoint} -> ${error.status} ${error.code ?? "BACKEND_REQUEST_FAILED"}: ${error.message}`;

      if (isServerError) {
        console.error(logMessage, {
          backendEndpoint: error.endpoint,
          backendMethod: error.method,
          responseBody: error.responseBody?.slice(0, 2000),
        });
      } else {
        console.warn(logMessage);
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code ?? "BACKEND_REQUEST_FAILED",
            message: error.message,
          },
          timestamp: new Date().toISOString(),
          path: request.nextUrl.pathname,
        },
        { status: error.status },
      );
    }

    console.error("Backend proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected proxy error.",
        },
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

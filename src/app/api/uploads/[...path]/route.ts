// src/app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { MIME_BY_EXT, resolveUploadPath } from "@/lib/uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const segments = params.path;

    if (!segments || segments.length < 1) {
      return new NextResponse("File not found", { status: 404 });
    }

    const filename = segments.join("/"); // safer for future
    const filepath = resolveUploadPath(filename);

    if (!filepath) {
      return new NextResponse("File not found", { status: 404 });
    }

    const buffer = await readFile(filepath);

    const ext = path.extname(filepath).slice(1).toLowerCase();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return new NextResponse("File not found", { status: 404 });
    }

    console.error("UPLOAD API ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
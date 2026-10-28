import { db } from '@/db/db';
import { area } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function DELETE(
  req: NextRequest,
  context: any  // <-- bypass type errors here
) {
  const areaId = Number(context.params.id);

  if (isNaN(areaId)) {
    return NextResponse.json({ error: "Invalid area ID" }, { status: 400 });
  }

  try {
    const deleted = await db.delete(area).where(eq(area.id, areaId));
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Error deleting area:", error);
    return NextResponse.json({ error: "Failed to delete area" }, { status: 500 });
  }
}


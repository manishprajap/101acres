import { NextResponse ,NextRequest} from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema"; // adjust path as needed
import { eq } from "drizzle-orm";
import { uploadImage } from "@/db/upload";


export async function GET(
  req: NextRequest,
  context: any
)  {
  const user = await db.select().from(users).where(eq(users.id, Number(context.params.id)));
  return NextResponse.json({ success: true, data: user[0] });
}

export async function PUT(
  req: NextRequest,
  context: any
)  {
  try {
    const formData = await req.formData();
    const id = Number(context.params.id); // Convert to number

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const mobile = formData.get("mobile") as string;
    const address = formData.get("address") as string;
    const countryId = formData.get("countryId") as string;
    const stateId = formData.get("stateId") as string;
    const cityId = formData.get("cityId") as string;
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string | null = null;

    // Upload image if exists
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadImage(buffer, imageFile.name); // Save and return URL
    }

    const updateData: any = {
      name,
      email,
      mobile,
      address,
      country_id: countryId,
      state_id: stateId,
      city_id: cityId,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  context: any
)  {
  const userId = Number(context.params.id);

  try {
    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
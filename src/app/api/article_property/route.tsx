import { writeFile, access, mkdir, constants, chmod } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
//import {property_article } from "@/db/schema";
import { property_article, countries, states, cities, area } from "@/db/schema";
import { eq } from "drizzle-orm";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadsDir = path.join(process.cwd(), "uploads"); // NOT /public/uploads
const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const maxSizeInBytes = 10 * 1024 * 1024;

async function ensureUploadsFolderExists() {
  try {
    await access(uploadsDir, constants.F_OK);
  } catch {
    await mkdir(uploadsDir, { recursive: true });
    await chmod(uploadsDir, 0o777);
    console.log("✅ uploads/ directory created");
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const requiredFields = [
     
      "propertyLocation", "propertyType", "propertyFor",
      "countryId", "stateId", "cityId",  "description", "areaId", "area", "slug"
    ];

    const optionalFields = [
      "residentialType", "paymentstatus", "paymentType", "premium",
      "amount", "isDeleted", "remark"
    ];

    const data: Record<string, string> = {};
    for (const field of requiredFields) {
      const value = formData.get(field)?.toString().trim();
      if (!value) {
        return NextResponse.json({ success: false, message: `Missing required field: ${field}` }, { status: 400 });
      }
      data[field] = value;
    }
    for (const field of optionalFields) {
      data[field] = formData.get(field)?.toString().trim() || "";
    }

    const userId = formData.get("userId")?.toString();
    const role = formData.get("role")?.toString();
    if (!userId || !role) {
      return NextResponse.json({ success: false, message: "User ID or role missing" }, { status: 400 });
    }

    const status = role === "admin" ? "Active" : "Inactive";

    await ensureUploadsFolderExists();

    // ✅ Handle image uploads
    const images = formData.getAll("images") as File[];
    const imagePaths: string[] = [];

    for (const image of images) {
      if (!allowedImageTypes.includes(image.type)) {
        return NextResponse.json({ success: false, message: "Invalid image type" }, { status: 400 });
      }

      const buffer = Buffer.from(await image.arrayBuffer());
      if (buffer.length > maxSizeInBytes) {
        return NextResponse.json({ success: false, message: "Image size exceeds 10MB" }, { status: 400 });
      }

      const extension = path.extname(image.name) || ".jpg";
      const filename = `${uuidv4()}${extension}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      await chmod(filepath, 0o777);

      imagePaths.push(filename); // or `/uploads/${filename}` if you want full path
    }

    const result = await db.insert(property_article).values({
      image: JSON.stringify(imagePaths),
      propertyLocation: data.propertyLocation,
      propertyType: data.propertyType,
      residentialType: data.residentialType || "",
      propertyFor: data.propertyFor,
      // priceFor: data.priceFor,
      country: parseInt(data.countryId),
      state: parseInt(data.stateId),
      city: parseInt(data.cityId),
      area: parseInt(data.areaId),
      description: data.description,
      slug: data.slug,
      status, 
      isDeleted: data.isDeleted === "true",
      user_id: parseInt(userId),
    });

    return NextResponse.json({ success: true, result, imagePaths });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
        error: (error as Error)?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}








// get

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, message: "Missing user_id" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);

    const baseQuery = db
      .select({
        id: property_article.id,
        user_id: property_article.user_id,
        image: property_article.image,
        propertyLocation: property_article.propertyLocation,
        propertyType: property_article.propertyType,
        residentialType: property_article.residentialType,
        propertyFor: property_article.propertyFor,
        country_id: property_article.country,
        state_id: property_article.state,
        city_id: property_article.city,
        area_id: property_article.area,
        description: property_article.description,
        status: property_article.status,
        isDeleted: property_article.isDeleted,

        country_name: countries.name,
        state_name: states.name,
        city_name: cities.name,
        area_name: area.name, // confirm your table name and import here
      })
      .from(property_article)
      .leftJoin(countries, eq(countries.id, property_article.country))
      .leftJoin(states, eq(states.id, property_article.state))
      .leftJoin(cities, eq(cities.id, property_article.city))
      .leftJoin(area, eq(area.id, property_article.area)); // or areas?

    let allProperties;

    if (userId === 1) {
      allProperties = await baseQuery;
    } else {
      allProperties = await baseQuery.where(eq(property_article.user_id, userId));
    }
///console.log('all data gget:',allProperties);
    return NextResponse.json({ success: true, data: allProperties });
  } catch (error) {
    console.error("Drizzle select error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}


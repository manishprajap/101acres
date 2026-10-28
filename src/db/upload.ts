import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

/**
 * Save image buffer to public/uploads and return the relative URL
 */
export async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  const uniqueName = `${uuidv4()}-${filename.replace(/\s+/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, uniqueName);

  // Ensure the uploads directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, buffer);

  // Return relative path to access from the frontend
  return `/uploads/${uniqueName}`;
}

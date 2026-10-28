import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  try {
    // Log the DB config to verify env vars are loaded
    console.log("DB Config:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute(`
      SELECT 
        properties.id,
        properties.title,
        properties.price,
        properties.commission,
        agents.name AS agent_name,
        agents.email AS agent_email
      FROM properties
      LEFT JOIN agents ON properties.agent_id = agents.id
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json({ error: "Unable to fetch commissions" }, { status: 500 });
  }
}

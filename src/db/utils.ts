import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// Function to generate a JWT token
export function generateToken(id: number, email: string) {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "1h" });
}

// Function to verify a JWT token
export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch (error) {
    return null; // Invalid or expired token
  }
}

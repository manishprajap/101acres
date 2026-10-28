import jwt from "jsonwebtoken";

// Secret key for JWT (store it in your .env file for production)
const JWT_SECRET = process.env.JWT_SECRET || "101acers-a-very-secure-password-at-least-32-chars";


export function generateToken(id: number, email: string) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}


// Function to verify a JWT token
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Invalid or expired token
  }
};

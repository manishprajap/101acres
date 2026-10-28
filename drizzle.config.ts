// import type { Config } from "drizzle-kit";

// export default {
  // schema: "./src/db/schema.ts",
  // out: "./drizzle",
  // driver: "mysql2",
  // dbCredentials: {
    // host: "localhost",
    // port: 3306,
    // user: "root",
    // password: "password",
    // database: "101acer",
  // },
// } satisfies Config;
 
 import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "101acers",
  },
} satisfies Config;

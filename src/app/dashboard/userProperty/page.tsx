////src/app/dashboard/userProperty/page.tsx
"use client";
import PropertyListing from "../components/PropertyListing";

export default function UserPropertyPage() {
  return <PropertyListing mode="user" />;
  console.log("localStorage keys:", Object.keys(localStorage));
const t = localStorage.getItem("token");
fetch("/api/debug-auth", { headers: t ? { Authorization: "Bearer " + t } : {} })
  .then(r => r.json()).then(console.log);
}
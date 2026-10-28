import { Suspense } from "react";
import type { Metadata } from "next";
import PropertiesList from "./PropertiesList";
import Footer from "../landing/components/footer";
import Navbar from "../landing/components/navbar";
import Switcher from "../landing/components/switcher";

export const metadata: Metadata = {
  title: "Properties for Buy & Rent",
  description: "Browse properties for sale and rent.",
};

function ListSkeleton() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-18">
      <div className="h-8 w-56 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    </main>
  );
}

export default function PropertiesPage() {
  return (
    <>
      <Navbar navClass="" topnavClass="" tagline={false} />
      <Suspense fallback={<ListSkeleton />}>
        <PropertiesList />
      </Suspense>
      <Footer />
      <Switcher />
    </>
  );
}
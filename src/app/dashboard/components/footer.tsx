import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="shadow-sm shadow-gray-200 dark:shadow-gray-700 bg-white dark:bg-slate-900 px-6 py-4">
      <div className="container-fluid flex justify-center">
        <p className="mb-0 text-slate-400 text-center text-sm">
          © {new Date().getFullYear()} 101Acres. Design & Develop with{" "}
          <i className="mdi mdi-heart text-red-600" /> by{" "}
          <Link
            href="https://aarnatechxperts.in/"
            target="_blank"
            className="text-reset underline hover:text-green-600"
          >
            Aarna Tech Xperts
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}

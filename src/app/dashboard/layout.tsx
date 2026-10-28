import "./assets/css/tailwind.css";
import "./assets/css/materialdesignicons.min.css";

import { League_Spartan } from "next/font/google";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-league-spartan",
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${leagueSpartan.variable} font-body text-base text-black dark:text-white dark:bg-slate-900`}
    >
      {children}
    </div>
  );
}
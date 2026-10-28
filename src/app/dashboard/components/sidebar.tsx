'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

/* ============================================================
   MENU DEFINITIONS
============================================================ */

type Child = { label: string; href: string };
type MenuLink = { label: string; icon: string; href: string; exact?: boolean };
type MenuGroup = { label: string; icon: string; key: string; children: Child[] };
type MenuItem = MenuLink | MenuGroup;

const isGroup = (item: MenuItem): item is MenuGroup => "children" in item;

const SETTINGS: MenuGroup = {
  label: "Settings",
  icon: "mdi-cog-outline",
  key: "settings",
  children: [
    { label: "Profile", href: "/dashboard/profile" },
    { label: "Change Password", href: "#" },
  ],
};

const AGENT_MENU: MenuItem[] = [
  { label: "Dashboard", icon: "mdi-chart-bell-curve-cumulative", href: "/dashboard/agent-dashboard", exact: true },
  {
    label: "User", icon: "mdi-account-edit", key: "user",
    children: [
      { label: "Add", href: "/dashboard/user/add" },
      { label: "View", href: "/dashboard/user/view" },
    ],
  },
  {
    label: "Article Property Master", icon: "mdi-account-edit", key: "article",
    children: [
      { label: "Add", href: "/dashboard/addarticle-property" },
      { label: "View", href: "/dashboard/listArticleproperty" },
    ],
  },
  {
    label: "Property Master", icon: "mdi-account-edit", key: "property",
    children: [
      { label: "Add", href: "/dashboard/add-property" },
      { label: "View", href: "/dashboard/agentProperty" },
    ],
  },
  { label: "Premium Property", icon: "mdi-home-heart", href: "/dashboard/userpremium" },
  { label: "Commission", icon: "mdi-chat-outline", href: "/dashboard/commission" },
  SETTINGS,
];

/* dealer / builder / owner / user (every logged-in role that is not admin or agent) */
const USER_MENU: MenuItem[] = [
  { label: "Dashboard", icon: "mdi-chart-bell-curve-cumulative", href: "/dashboard/user-dashboard", exact: true },
  {
    label: "Property Master", icon: "mdi-account-edit", key: "property",
    children: [
      { label: "Add", href: "/dashboard/add-property" },
      { label: "View", href: "/dashboard/userProperty" },
    ],
  },
  { label: "Premium Property", icon: "mdi-home-heart", href: "/dashboard/userpremium" },
  SETTINGS,
];

const ADMIN_MENU: MenuItem[] = [
  { label: "Dashboard", icon: "mdi-chart-bell-curve-cumulative", href: "/dashboard", exact: true },
  {
    label: "User", icon: "mdi-account-edit", key: "user",
    children: [
      { label: "Add", href: "/dashboard/user/add" },
      { label: "View", href: "/dashboard/user/view" },
    ],
  },
  { label: "Area Master", icon: "mdi-home-heart", href: "/dashboard/areamaster" },
  {
    label: "Article Property Master", icon: "mdi-account-edit", key: "article",
    children: [
      { label: "Add", href: "/dashboard/addarticle-property" },
      { label: "View", href: "/dashboard/listArticleproperty" },
    ],
  },
  {
    label: "Property Master", icon: "mdi-account-edit", key: "property",
    children: [
      { label: "Add", href: "/dashboard/add-property" },
      { label: "View", href: "/dashboard/PropertyListPage" },
    ],
  },
  { label: "Premium Properties", icon: "mdi-home-heart", href: "/dashboard/favorite-property" },
  { label: "Plans", icon: "mdi-chat-outline", href: "/dashboard/pricing" },
  { label: "Commission", icon: "mdi-chat-outline", href: "/dashboard/commission" },
  SETTINGS,
];

/* ============================================================
   HELPERS
============================================================ */

/** Reads the role saved at login ("role" key, or user.role as a fallback). */
function readRole(): string | null {
  try {
    const direct = localStorage.getItem("role");
    if (direct && direct !== "undefined" && direct !== "null") return direct.trim().toLowerCase();

    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined" && stored !== "null") {
      const parsed = JSON.parse(stored);
      const role = parsed?.user?.role ?? parsed?.data?.role ?? parsed?.role;
      if (typeof role === "string" && role.trim()) return role.trim().toLowerCase();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function getMenu(role: string | null): MenuItem[] {
  if (!role) return [];
  if (role === "admin") return ADMIN_MENU;
  if (role === "agent") return AGENT_MENU;
  return USER_MENU;
}

function isActive(current: string, href: string, exact?: boolean): boolean {
  if (href === "#") return false;
  if (exact) return current === href;
  return current === href || current.startsWith(`${href}/`);
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Sidebar() {
  const current = usePathname() || "";
  const [role, setRole] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string>("");

  /* Read the role on mount and whenever the route changes */
  useEffect(() => {
    setRole(readRole());
  }, [current]);

  /* Auto-open the dropdown that contains the current page */
  useEffect(() => {
    const group = getMenu(role).find(
      (item): item is MenuGroup => isGroup(item) && item.children.some((c) => isActive(current, c.href))
    );
    setOpenKey(group ? group.key : "");
  }, [current, role]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/login", { method: "DELETE" });

      if (res.ok) {
        localStorage.clear(); // Clear user data
        window.location.href = "/"; // Redirect after logout
      } else {
        const data = await res.json();
        console.error("Logout failed:", data.error || res.statusText);
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menu = getMenu(role);

  return (
    <nav id="sidebar" className="sidebar-wrapper sidebar-dark">
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <Link href="/"><Image src="/images/logo1.png" width={70} height={24} alt="" /></Link>
        </div>

        <SimpleBar style={{ height: "calc(100% - 70px)" }}>
          <ul className="sidebar-menu border-t border-white/10">
            {/* Go to Website (visible for all roles) */}
            <li className="ms-0">
              <Link href="/">
                <i className="mdi mdi-web me-2"></i>Go to Website
              </Link>
            </li>

            {menu.map((item) => {
              /* ---- Dropdown ---- */
              if (isGroup(item)) {
                const groupActive = item.children.some((c) => isActive(current, c.href));
                return (
                  <li key={item.key} className={`sidebar-dropdown ms-0 ${groupActive ? "active" : ""}`}>
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenKey(openKey === item.key ? "" : item.key);
                      }}
                    >
                      <i className={`mdi ${item.icon} me-2`}></i>{item.label}
                    </Link>
                    <div className={`sidebar-submenu ${openKey === item.key ? "block" : ""}`}>
                      <ul>
                        {item.children.map((child) => (
                          <li
                            key={`${item.key}-${child.label}`}
                            className={`${isActive(current, child.href) ? "active" : ""} ms-0`}
                          >
                            <Link href={child.href}>{child.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              /* ---- Single link ---- */
              return (
                <li key={item.href} className={`${isActive(current, item.href, item.exact) ? "active" : ""} ms-0`}>
                  <Link href={item.href}>
                    <i className={`mdi ${item.icon} me-2`}></i>{item.label}
                  </Link>
                </li>
              );
            })}

            {/* Logout (only when a role is known) */}
            {role && (
              <li>
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  className="block py-1 px-4 dark:text-white/70 hover:text-green-600 dark:hover:text-white"
                >
                  <i className="mdi mdi-logout me-2"></i>Logout
                </Link>
              </li>
            )}
          </ul>
        </SimpleBar>
      </div>
    </nav>
  );
}
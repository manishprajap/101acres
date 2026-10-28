"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from 'react-feather';
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LogOut } from 'lucide-react';
import '@/styles/navbar.css'; // adjust path based on your structure
import { RiArrowDropDownLine } from "react-icons/ri";
import { FiMenu, FiX } from "react-icons/fi";



export default function Navbar({ navClass, topnavClass, tagline }: { navClass: string, topnavClass: string, tagline: boolean }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    let [isOpen, setIsOpen] = useState(true);
    let [topNavbar, setTopNavBar] = useState(false);

    let [manu, setManu] = useState('');
    let [subManu, setSubManu] = useState('');

    let current = usePathname();
    const router = useRouter();


    useEffect(() => {

        setManu(current)
        setSubManu(current)

        function windowScroll() {
            setTopNavBar(window.scrollY >= 50)
        }

        window.addEventListener('scroll', windowScroll)
        window.scrollTo(0, 0)
        return () => {
            window.removeEventListener('scroll', windowScroll)
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const [role, setRole] = useState("");

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        setRole(userRole || "");
    }, []);


    const getDashboardLink = () => {
        switch (role) {
            case "admin":
                return "/dashboard";
            case "agent":
                return "/dashboard/agent-dashboard";
            case "owner":
                return "/dashboard/user-dashboard";
            case "dealer":
                return "/dashboard/user-dashboard";
            case "builder":
                return "/dashboard/user-dashboard";
            default:
                return "#"; // or a fallback route
        }
    };

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/login", {
                method: "DELETE",
            });

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



    const toggleMenu = (): void => {
        setIsOpen((open) => !open);
    };


    return (
        <React.Fragment>
            <nav id="topnav" className={`${topNavbar ? 'nav-sticky' : ''} ${tagline ? 'tagline-height' : ''} ${topnavClass ? topnavClass : ''} defaultscroll is-sticky`} >

                <div className={`${topnavClass !== '' && topnavClass !== undefined ? 'container-fluid md:' : 'container-fluid mx-[20px]'}`}>
                    {/* <!-- Logo container--> */}

                    {navClass === '' || navClass === undefined ?

                        <Link className="logo" href="/">
                            <Image src="/images/logo1.png" className="inline-block dark:hidden " alt="" width={80} height={24} />
                            <Image src="/images/logo1.png" className="hidden dark:inline-block" alt="" width={80} height={24} />
                            <span className="text-green-600">101Acres</span>
                        </Link> :

                        <Link className="logo" href="#">
                            <span className="inline-block dark:hidden">
                                <Image src="/images/logo1.png" className="l-dark" alt="" width={98} height={24} />
                                <Image src="/images/logo1.png" className="l-light" alt="" width={98} height={24} />
                            </span>
                            <Image src="/images/logo1.png" className="hidden dark:inline-block" alt="" width={98} height={24} />
                        </Link>
                    }

                    {/* <!-- End Logo container--> */}

                    {/* <!-- Start Mobile Toggle --> */}
                    <div className="menu-extras">
                        <div className="menu-item">
                            <button
                                type="button"
                                className="navbar-toggle"
                                id="isToggle"
                                aria-label={isOpen ? "Open navigation menu" : "Close navigation menu"}
                                aria-expanded={!isOpen}
                                aria-controls="navigation"
                                onClick={toggleMenu}
                            >
                                {isOpen ? <FiMenu size={24} /> : <FiX size={24} />}
                            </button>
                        </div>
                    </div>
                    {/* <!-- Login button Start --> */}
                    <ul className="buy-button list-none mb-0">
                        {!isLoggedIn ? (
                            <>
                                <li className="inline mb-0">
                                    <Link
                                        href="/auth-login"
                                        className="btn bg-[#10172b] hover:bg-[#10172b] border-green-600 dark:border-green-600 text-white !rounded-full"
                                    >
                                        {/* <User className="h-4 w-4 stroke-[3]" /> */}
                                        Login
                                    </Link>
                                </li>

                                <li className="sm:inline ps-1 mb-0 hidden">
                                    <Link href="/auth-signup" className="btn bg-green-600 hover:bg-green-700 border-green-600 dark:border-green-600 text-white !rounded-full">Signup</Link>
                                </li>

                            </>
                        ) : (
                            <>
                                <li className="inline mb-0">
                                    <Link
                                        href={getDashboardLink()}
                                        className="text-white bg-green-600 px-2 py-2 rounded-full hover:bg-green-700"
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                                <li className="inline mb-0 ms-4">
                                    <button
                                        onClick={handleLogout}
                                        className="text-white bg-red-400 px-3 py-2 rounded-full hover:bg-red-600"
                                    >
                                        {/* <LogOut className="w-4 h-4  stroke-[3]" /> */}
                                        LogOut
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* <!--Login button End--> */}

                    <div
                        id="navigation"
                        className={!isOpen ? "open" : ""}
                        onClick={() => setIsOpen(true)}
                    >
                        {/* <!-- Navigation Menu--> */}
                        <ul className={`navigation-menu  ${navClass === '' || navClass === undefined ? '' : 'nav-light'}   ${topnavClass !== '' && topnavClass !== undefined ? '!justify-center' : '!justify-end'}`}>

                            <li className={manu === "/" ? 'active' : ''}><Link href="/" className="sub-menu-item">Home</Link></li>

                            <li className={manu === "/aboutus" ? 'active' : ''}><Link href="/aboutus" className="sub-menu-item">About Us</Link></li>

                            {/* <li className={manu === "/area" ? 'active' : ''}><Link href="/area" className="sub-menu-item">Area </Link></li> */}

                            {/* <li className={manu === "/featured-property" ? 'active' : ''}><Link href="/featured-property" className="sub-menu-item">Premium Property</Link></li> */}

                            {/* <li className={manu === "/bank-property" ? 'active' : ''}><Link href="/bank-property" className="sub-menu-item">Bank Property</Link></li> */}
							
                            <li className={manu === "/pricing" ? 'active' : ''}><Link href="/pricing" className="sub-menu-item">Plans</Link></li>
                            {/* <li className={`has-submenu parent-parent-menu-item ${["/grid", "/    grid-sidebar", "/grid-map", "/list", "/list-sidebar", "/list-map", "/property-detail/1", "/featured-property"].includes(manu) ? 'active' : ''}`}>
                               
                               
                                <Link href="#" onClick={() => { setSubManu(subManu === "/list-item" ? "" : "/list-item") }}><div className="flex">Featured Properties</div></Link>
                                <ul className={`submenu ${["/grid", "/grid-sidebar", "/grid-map", "/list", "/list-sidebar", "/list-map", "/property-detail/1", "/list-item", "/grid-item", "/list-view-item", "/property-item", "/featured-property"].includes(subManu) ? 'open' : ''}`}>
                                    <li className={manu === "/featured-property" ? 'active' : ''}><Link href="/featured-property" className="sub-menu-item">Featured Property</Link></li>
                                    <li className={manu === "/property-detail/1" ? 'active' : ''}><Link href="/property-detail/1" className="sub-menu-item">Property Detail</Link></li>
                                </ul>
                            </li> 


                            <li className={manu === "/agents" ? "active" : ''}><Link href="/agents" className="sub-menu-item">Agents</Link></li>*/}


                            {/* <li className={`has-submenu parent-menu-item ${["/agents", "/agent-profile"].includes(manu) ? 'active' : ''}`}><Link href="#" onClick={() => { setSubManu(subManu === "/auth-item" ? '' : "/auth-item") }}> <div className="flex"> Agents <RiArrowDropDownLine className="text-[25px] pr-1 pt-0.5"/> </div></Link><span className="submenu-arrow"></span>
                                <ul className={`submenu ${["/auth-item"].includes(subManu) ? 'open' : ''}`}>
                                    <li className={manu === "/agents" ? "active" : ''}><Link href="/agents" className="sub-menu-item">Agents</Link></li>
                                    <li className={manu === "/agent-profile" ? "active" : ''}><Link href="/agent-profile" className="sub-menu-item">Agent Profile</Link></li>
                                </ul>
                            </li> */}

                            <li>
                                <a
                                    href="https://properties.101acres.com/category/blog/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sub-menu-item"
                                >
                                    Blog
                                </a>
                            </li>

                            <li className={manu === "/faqs" ? "active" : ''}><Link href="/faqs" className="sub-menu-item">Faqs</Link></li>

                            <li className={manu === "/contact" ? "active" : ''}><Link href="/contact" className="sub-menu-item">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </nav>
            {/* End Navbar  */}
        </React.Fragment>
    );

}

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from 'react-feather';
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LogOut } from 'lucide-react';



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
            case "user":
                return "/dashboard/user-dashboard";
            default:
                return "#"; // or a fallback route
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        setIsLoggedIn(false); // This must update the state
    };


    const toggleMenu = (): void => {
        setIsOpen(!isOpen);

        const navigation = document.getElementById("navigation");
        if (navigation) {
            const anchorArray = Array.from(navigation.getElementsByTagName("a"));

            anchorArray.forEach((element) => {
                element.addEventListener("click", (elem: Event) => {
                    const target = elem.target as HTMLElement;
                    if (target) {
                        const href = target.getAttribute("href");
                        if (href && href !== "") {
                            const nextSibling = target.nextElementSibling;
                            if (nextSibling && nextSibling.nextElementSibling) {
                                const submenu = nextSibling.nextElementSibling as HTMLElement;
                                submenu.classList.toggle("open");
                            }
                        }
                    }
                });
            });
        }
    };


    return (
        <React.Fragment>
            <nav id="topnav" className={`${topNavbar ? 'nav-sticky' : ''} ${tagline ? 'tagline-height' : ''} ${topnavClass ? topnavClass : ''} defaultscroll is-sticky`} >

                <div className={`${topnavClass !== '' && topnavClass !== undefined ? 'container-fluid md:' : 'container'}`}>
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
                            <Link href="#" className="navbar-toggle" id="isToggle" onClick={toggleMenu}>
                                <div className="lines">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </Link>
                        </div>
                    </div>
                    {/* <!-- Login button Start --> */}
                    <ul className="buy-button list-none mb-0">
                        {!isLoggedIn ? (
                            <>
                                <li className="inline mb-0">
                                    <Link
                                        href="/landing/auth-login"
                                        className="btn btn-icon bg-green-600 hover:bg-green-700 border-green-600 dark:border-green-600 text-white !rounded-full"
                                    >
                                        <User className="h-4 w-4 stroke-[3]" />
                                    </Link>
                                </li>
                                <li className="sm:inline ps-1 mb-0">
                                    <Link
                                        href="/landing/auth-signup"
                                        className="btn bg-green-600 hover:bg-green-700 border-green-600 dark:border-green-600 text-white !rounded-full"
                                    >
                                        SignUp
                                    </Link>
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
                                        className="text-white bg-green-600 px-3 py-2 rounded-full hover:bg-green-700"
                                    >
                                        <LogOut className="w-4 h-4  stroke-[3]" />
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* <!--Login button End--> */}

                    <div id="navigation" className={`${isOpen === true ? 'hidden' : 'block'}`} >
                        {/* <!-- Navigation Menu--> */}
                        <ul className={`navigation-menu  ${navClass === '' || navClass === undefined ? '' : 'nav-light'}   ${topnavClass !== '' && topnavClass !== undefined ? '!justify-center' : '!justify-end'}`}>

                            <li className={manu === "/" ? 'active' : ''}><Link href="/" className="sub-menu-item">Home</Link></li>

                            <li className={manu === "/landing/aboutus" ? 'active' : ''}><Link href="/landing/aboutus" className="sub-menu-item">About Us</Link></li>

                            <li className={`has-submenu parent-parent-menu-item ${["/grid", "/    grid-sidebar", "/grid-map", "/list", "/list-sidebar", "/list-map", "/property-detail/1", "/featured-property"].includes(manu) ? 'active' : ''}`}>
                                <Link href="#" onClick={() => { setSubManu(subManu === "/landing/list-item" ? "" : "/landing/list-item") }}>Properties</Link><span className="menu-arrow"></span>
                                <ul className={`submenu ${["/grid", "/grid-sidebar", "/grid-map", "/list", "/list-sidebar", "/landing/list-map", "/landing/property-detail/1", "/landing/list-item", "/grid-item", "/landing/list-view-item", "/landing/property-item", "/featured-property"].includes(subManu) ? 'open' : ''}`}>

                                    <li className={`has-submenu parent-menu-item ${["/landing/property-detail/1", "/landing/featured-property"].includes(manu) ? 'active' : ''}`}><Link href="#" onClick={() => { setSubManu(subManu === "/landing/property-item" ? "" : "/landingproperty-item") }}> Property Detail </Link><span className="submenu-arrow"></span>
                                        <ul className={`submenu ${["/landing/property-detail/1", "/property-item"].includes(subManu) ? 'open' : ''}`}>
                                            <li className={manu === "/landing/property-detail/1" ? 'active' : ''}><Link href="/landing/property-detail/1" className="sub-menu-item">Property Detail</Link></li>
                                            <li className={manu === "/landing/featured-property" ? 'active' : ''}><Link href="/landing/featured-property" className="sub-menu-item">Featured Property</Link></li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>

                            <li className={`has-submenu parent-menu-item ${["/landing/agents", "/landing/agent-profile"].includes(manu) ? 'active' : ''}`}><Link href="#" onClick={() => { setSubManu(subManu === "/landing/auth-item" ? '' : "/landing/auth-item") }}> Agents </Link><span className="submenu-arrow"></span>
                                <ul className={`submenu ${["/landing/auth-item"].includes(subManu) ? 'open' : ''}`}>
                                    <li className={manu === "/landing/agents" ? "active" : ''}><Link href="/landing/agents" className="sub-menu-item">Agents</Link></li>
                                    <li className={manu === "/landing/agent-profile" ? "active" : ''}><Link href="/landing/agent-profile" className="sub-menu-item">Agent Profile</Link></li>
                                </ul>
                            </li>

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

                            <li className={manu === "/landing/faqs" ? "active" : ''}><Link href="/landing/faqs" className="sub-menu-item">Faqs</Link></li>

                            <li className={manu === "/landing/contact" ? "active" : ''}><Link href="/landing/contact" className="sub-menu-item">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </nav>
            {/* End Navbar  */}
        </React.Fragment>
    );

}

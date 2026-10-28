'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

export default function Sidebar() {
    const [manu, setmanu] = useState<string>('');
    const [submanu, setSubManu] = useState<string>('');
    const [userType, setUserType] = useState<string | null>(null);
    const userMenuPaths = ["/add-property", "/PropertyListPage", "/user-item"];

    const current = usePathname();

    useEffect(() => {
        const path = current.split('/').slice(0, 3).join('/');
        setmanu(path);
        setSubManu(path);
        const type = localStorage.getItem('role');
        console.log("user login type role:", type);
        setUserType(type);
    }, [current]);

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

    return (
        <nav id="sidebar" className="sidebar-wrapper sidebar-dark">
            <div className="sidebar-content">
                <div className="sidebar-brand">
                    <Link href="/"><Image src='/images/logo1.png' width={70} height={24} alt="" /></Link>
                </div>
                <SimpleBar style={{ height: "calc(100% - 70px)" }}>
                    <ul className="sidebar-menu border-t border-white/10">

					
                        {userType === 'agent' && (
                            <>
                                <li className={`${manu === "/" || "" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/agent-dashboard"><i className="mdi mdi-chart-bell-curve-cumulative me-2"></i>Dashboard</Link>
                                </li>

                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/user", "/dashboard/user", '/dashboard/user'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/dashboard/user' ? '' : '/dashboard/user')}>
                                        <i className="mdi mdi-account-edit me-2"></i>User
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/user", "/dashboard/user", '/dashboard/user'].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/user" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/user/add">Add</Link>
                                            </li>

                                            <li className={`${manu === "/dashboard/user" ? 'active' : ''} ms-0`}><Link href="/dashboard/user/view">View</Link></li>
                                        </ul>
                                    </div>
                                </li>


                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/addarticle-property", "/dashboard/listArticleproperty"].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/dashboard/addarticle-property' ? '' : '/dashboard/addarticle-property')}>
                                        <i className="mdi mdi-account-edit me-2"></i>Article Property Master
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/addarticle-property", "/dashboard/listArticleproperty"].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/addarticle-property" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/addarticle-property">Add</Link>
                                            </li>

                                            <li className={`${manu === "/dashboard/listArticleproperty" ? 'active' : ''} ms-0`}><Link href="/dashboard/listArticleproperty">View</Link></li>
                                        </ul>
                                    </div>
                                </li>

                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/add-property", "/dashboard/agentProperty", '/user-item'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/user-item' ? '' : '/user-item')}>
                                        <i className="mdi mdi-account-edit me-2"></i>Property Master
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/add-property", "/dashboard/agentProperty", '/user-item'].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/add-property" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/add-property">Add</Link>
                                            </li>

                                            <li className={`${manu === "/dashboard/agentProperty" ? 'active' : ''} ms-0`}><Link href="/dashboard/agentProperty">View</Link></li>
                                        </ul>
                                    </div>
                                </li>

                                <li className={`${manu === "/dashboard/userpremium" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/userpremium"><i className="mdi mdi-home-heart me-2"></i> Premium Property</Link>
                                </li>

                                <li className={`${manu === "/dashboard/commission" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/commission"><i className="mdi mdi-chat-outline me-2"></i>Commission</Link>
                                </li>

                                {/*
								<li className={`sidebar-dropdown ms-0 ${["/dashboard/payment", "/dashboard/payment", '/dashboard/payment'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/dashboard/payment' ? '' : '/dashboard/payment')}>
                                        <i className="mdi mdi-credit-card-outline me-2"></i>Payment
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/payment", "/dashboard/payment", '/dashboard/payment'].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/payment" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/payment">View Payment</Link>
                                            </li>
                                            <li className={`${manu === "/dashboard/payment" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/payment">Failed Payment</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>*/}



                                <li className={`sidebar-dropdown ms-0 ${['/dashboard/profile', '/dashboard/change-password'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === 'settings' ? '' : 'settings')}>
                                        <i className="mdi mdi-cog-outline me-2"></i>Settings
                                    </Link>
                                    <div className={`sidebar-submenu ${submanu === 'settings' ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === '/dashboard/profile' ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/profile">Profile</Link>
                                            </li>
                                            <li className={`${manu === '/dashboard/change-password' ? 'active' : ''} ms-0`}>
                                                <Link href="#">Change Password</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>

                                <li>
                                    <Link href="#" onClick={handleLogout} className="block py-1 px-4 dark:text-white/70 hover:text-green-600 dark:hover:text-white"><i className="mdi mdi-logout me-2"></i>Logout</Link>
                                </li>
                            </>
                        )}

                        {/* end agent  */}

                        {userType === 'user' && (
                            <>
                                {/* Dashboard */}
                                <li className={`${manu === "/dashboard/user-dashboard" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/user-dashboard">
                                        <i className="mdi mdi-chart-bell-curve-cumulative me-2"></i>Dashboard
                                    </Link>
                                </li>

                                {/* Property Master */}
                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/add-property", "/dashboard/userProperty"].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === 'property' ? '' : 'property')}>
                                        <i className="mdi mdi-account-edit me-2"></i>Property Master
                                    </Link>
                                    <div className={`sidebar-submenu ${submanu === 'property' ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/add-property" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/add-property">Add</Link>
                                            </li>
                                            <li className={`${manu === "/dashboard/userProperty" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/userProperty">View</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>

                                {/* Premium Property */}
                                <li className={`${manu === "/dashboard/userpremium" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/userpremium">
                                        <i className="mdi mdi-home-heart me-2"></i>Premium Property
                                    </Link>
                                </li>

                                

                                {/* Settings */}
                                <li className={`sidebar-dropdown ms-0 ${['/dashboard/profile', '/dashboard/change-password'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === 'settings' ? '' : 'settings')}>
                                        <i className="mdi mdi-cog-outline me-2"></i>Settings
                                    </Link>
                                    <div className={`sidebar-submenu ${submanu === 'settings' ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === '/dashboard/profile' ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/profile">Profile</Link>
                                            </li>
                                            <li className={`${manu === '/dashboard/change-password' ? 'active' : ''} ms-0`}>
                                                <Link href="#">Change Password</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>

                                {/* Logout */}
                                <li>
                                    <Link
                                        href="#"
                                        onClick={handleLogout}
                                        className="block py-1 px-4 dark:text-white/70 hover:text-green-600 dark:hover:text-white"
                                    >
                                        <i className="mdi mdi-logout me-2"></i>Logout
                                    </Link>
                                </li>
                            </>
                        )}


				
                        {userType === 'admin' && (
                            <>
                                <li className={`${manu === "/" || "" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard"><i className="mdi mdi-chart-bell-curve-cumulative me-2"></i>Dashboard</Link>
                                </li>

                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/user", "/dashboard/user", '/dashboard/user'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/dashboard/user' ? '' : '/dashboard/user')}>
                                        <i className="mdi mdi-account-edit me-2"></i>User
                                    </Link>

                                    <div className={`sidebar-submenu ${["/dashboard/user", "/dashboard/user", '/dashboard/user'].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/user" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/user/add">Add</Link>
                                            </li>

                                            <li className={`${manu === "/dashboard/user" ? 'active' : ''} ms-0`}><Link href="/dashboard/user/view">View</Link></li>
                                        </ul>
                                    </div>
                                </li>

                                <li className={`${manu === "/dashboard/areamaster" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/areamaster"><i className="mdi mdi-home-heart me-2"></i> Area Master</Link>
                                </li>
            
                                {/* Article Property */}

                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/addarticle-property", "/listArticleproperty"].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/dashboard/addarticle-property' ? '' : '/dashboard/addarticle-property')}>
                                        <i className="mdi mdi-account-edit me-2"></i>Article Property Master
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/addarticle-property", "/listArticleproperty"].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/addarticle-property" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/addarticle-property">Add</Link>
                                            </li>
                                            <li className={`${manu === "/dashboard/listArticleproperty" ? 'active' : ''} ms-0`}><Link href="/dashboard/listArticleproperty">View</Link></li>
                                        </ul>
                                    </div>
                                </li>
                                {/* Property Master */}

                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/add-property", "/PropertyListPage", '/user-item'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/user-item' ? '' : '/user-item')}>
                                        <i className="mdi mdi-account-edit me-2"></i>Property Master
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/add-property", "/PropertyListPage", '/user-item'].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/add-property" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/add-property">Add</Link>
                                            </li>
                                  <li className={`${manu === "/dashboard/PropertyListPage" ? 'active' : ''} ms-0`}><Link href="/dashboard/PropertyListPage">View</Link></li>
                                        </ul>
                                    </div>
                                </li>
                                <li className={`${manu === "/dashboard/favorite-property" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/favorite-property"><i className="mdi mdi-home-heart me-2"></i> Premium Properties</Link>
                                </li>
								
								<li className={`${manu === "/dashboard/pricing" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/pricing"><i className="mdi mdi-chat-outline me-2"></i>Plans</Link>
                                </li>


                                <li className={`${manu === "/dashboard/commission" ? 'active' : ''} ms-0`}>
                                    <Link href="/dashboard/commission"><i className="mdi mdi-chat-outline me-2"></i>Commission</Link>
                                </li>

									{/*
                                <li className={`sidebar-dropdown ms-0 ${["/dashboard/payment", "/dashboard/payment", '/dashboard/payment'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === '/dashboard/payment' ? '' : '/dashboard/payment')}>
                                        <i className="mdi mdi-credit-card-outline me-2"></i>Payment
                                    </Link>
                                    <div className={`sidebar-submenu ${["/dashboard/payment", "/dashboard/payment", '/dashboard/payment'].includes(submanu) ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === "/dashboard/payment" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/payment">View Payment</Link>
                                            </li>
                                            <li className={`${manu === "/dashboard/payment" ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/payment">Failed Payment</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li> */}

                                <li className={`sidebar-dropdown ms-0 ${['/dashboard/profile', '/dashboard/change-password'].includes(manu) ? 'active' : ''}`}>
                                    <Link href="#" onClick={() => setSubManu(submanu === 'settings' ? '' : 'settings')}>
                                        <i className="mdi mdi-cog-outline me-2"></i>Settings
                                    </Link>
                                    <div className={`sidebar-submenu ${submanu === 'settings' ? 'block' : ''}`}>
                                        <ul>
                                            <li className={`${manu === '/dashboard/profile' ? 'active' : ''} ms-0`}>
                                                <Link href="/dashboard/profile">Profile</Link>
                                            </li>
                                            <li className={`${manu === '/dashboard/change-password' ? 'active' : ''} ms-0`}>
                                                <Link href="#">Change Password</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>


                                <li>
                                    <Link href="#" onClick={handleLogout} className="block py-1 px-4 dark:text-white/70 hover:text-green-600 dark:hover:text-white"><i className="mdi mdi-logout me-2"></i>Logout</Link>
                                </li>
                            </>
                        )}

                    </ul>
                </SimpleBar>
            </div>
        </nav>
    )
}
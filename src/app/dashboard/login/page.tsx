'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import Switcher from "../components/switcher";
import BackToHome from "../components/backToHome";

export default function Login() {
    const [successMessage, setSuccessMessage] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const message = localStorage.getItem("registrationSuccess");
        if (message) {
            setSuccessMessage(message);
            localStorage.removeItem("registrationSuccess");
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Start loading
    
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await res.json();
    
            if (res.ok) {
                // Save the token and userId in localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.user.id.toString());
                localStorage.setItem("userName", data.user.name.toString());
                localStorage.setItem("user", JSON.stringify(data.user));
    
                // Optional: Display a message indicating successful login
                localStorage.setItem("loginSuccess", "You are logged in!");
    
                // Redirect to the dashboard after successful login
                router.push("/");  // Ensure this is the correct path
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false); // Stop loading in all cases
        }
    };


    return (
        <>
            <section
                className="h-screen flex items-center justify-center relative overflow-hidden bg-no-repeat bg-center bg-cover"
                style={{ backgroundImage: `url('/images/01.jpg')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                <div className="container relative z-10">
                    {successMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded text-center">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mx-auto">
                        <div className="relative overflow-hidden bg-white dark:bg-slate-900 shadow-md dark:shadow-gray-800 rounded-md">
                            <div className="p-6">
                                <Link href="/">
                                    <Image src='/images/101.png' width={98} height={28} className="mx-auto block dark:hidden" alt="Logo" />
                                    <Image src='/images/101.png' width={98} height={28} className="mx-auto dark:block hidden" alt="Logo" />
                                </Link>
                                <h5 className="my-6 text-xl font-semibold text-center">Login</h5>
                                <form className="text-start" onSubmit={handleLogin}>
                                    <div className="grid grid-cols-1">
                                        <div className="mb-4">
                                            <label className="font-medium" htmlFor="LoginEmail">Email Address:</label>
                                            <input
                                                id="LoginEmail"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-3"
                                                placeholder="name@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="font-medium" htmlFor="LoginPassword">Password:</label>
                                            <input
                                                id="LoginPassword"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-3"
                                                placeholder="Password"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-between mb-4">
                                            <div className="flex items-center">
                                                <input
                                                    className="form-checkbox size-4 me-2"
                                                    type="checkbox"
                                                    id="RememberMe"
                                                />
                                                <label className="text-slate-400" htmlFor="RememberMe">Remember me</label>
                                            </div>
                                            <p className="text-slate-400 mb-0">
                                                <Link href="/reset-password" className="text-slate-400">Forgot password?</Link>
                                            </p>
                                        </div>

                                        <div className="mb-4">
                                            <button
                                                type="submit"
                                                className="btn bg-green-600 hover:bg-green-700 text-white rounded-md w-full flex items-center justify-center"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                        </svg>
                                                        Logging in...
                                                    </>
                                                ) : (
                                                    "Login"
                                                )}
                                            </button>
                                        </div>

                                        <div className="text-center">
                                            <span className="text-slate-400 me-2">Don't have an account?</span>
                                            <Link href="/signup" className="text-black dark:text-white font-medium">Sign Up</Link>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 text-center">
                                <p className="mb-0 text-slate-400">© {new Date().getFullYear()} 101Acers. Designed by <Link href="https://aarnatechxperts.in/" target="_blank" className="text-reset">Aarna Tech Xperts</Link>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Switcher />
            <BackToHome />
        </>
    );
}

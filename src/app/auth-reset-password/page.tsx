'use client';
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/resetpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
    
            const data = await response.json();
            setMessage(data.message);
            console.log("message data:", data);
        } catch (error) {
            console.error('Reset error:', error);
            setMessage('Something went wrong.');
        }
    };
    

    return (
        <>
            <section className="md:h-screen py-36 flex items-center relative overflow-hidden zoom-image">
                <div
                    style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
                    className="absolute inset-0 image-wrap z-1 bg-no-repeat bg-center bg-cover">
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-2"></div>
                <div className="container z-3">
                    <div className="flex justify-center">
                        <div className="max-w-[400px] w-full m-auto p-6 bg-white dark:bg-slate-900 shadow-md shadow-gray-200 dark:shadow-gray-700 rounded-md">
                            <Link href="/"><Image src="/images/logo1.png" className="mx-auto" alt="" width={64} height={64} /></Link>
                            <h5 className="my-6 text-lg text-center font-semibold">Reset Your Password</h5>
                            <div className="grid grid-cols-1">
                                <p className="text-slate-400 mb-6">Please enter your email address. You will receive a link to create a new password via email.</p>
                                {message && <div className="text-green-600 text-sm mb-3">{message}</div>}
                                <form onSubmit={handleSubmit} className="text-start">
                                    <div className="grid grid-cols-1">
                                        <div className="mb-4">
                                            <label className="font-medium" htmlFor="LoginEmail">Email Address:</label>
                                            <input
                                                id="LoginEmail"
                                                type="email"
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-3"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md w-full">Send</button>
                                        </div>

                                        <div className="text-center">
                                            <span className="text-slate-400 me-2">Remember your password? </span>
                                            <Link href="/landing/auth-login" className="text-black dark:text-white font-bold">Sign in</Link>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

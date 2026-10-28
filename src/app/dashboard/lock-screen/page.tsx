import React from "react";
import Link from "next/link";
import Image from "next/image";

import Switcher from "../components/switcher";
import BackToHome from "../components/backToHome";

export default function LockScreen(){
    return(
        <>
        <section className="h-screen flex items-center justify-center relative overflow-hidden bg-no-repeat bg-center bg-cover" style={{backgroundImage:`url('/images/01.jpg')`}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
            <div className="container relative">
                <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
                    <div className="p-6 bg-white dark:bg-slate-900 shadow-md  dark:shadow-gray-800 rounded-md">
                        <div className="text-center">
                            <Image src='/images/client/07.jpg' width={80} height={80} className="mx-auto h-20 w-20 rounded-full shadow-sm dark:shadow-gray-800" alt=""/>
                            <h5 className="mb-6 mt-4 text-xl font-semibold">Calvin Carlo</h5>
                        </div>
                        <form>
                            <div className="grid grid-cols-1">
                                <div className="mb-4 ltr:text-left rtl:text-right">
                                        <label className="font-semibold" htmlFor="LoginPassword">Password:</label>
                                    <input id="LoginPassword" type="password" className="form-input border !border-gray-200 dark:!border-gray-800 mt-3 rounded-md"  placeholder="Password:"/>
                                </div>

                                <div className="flex justify-between mb-4">
                                    <div className="inline-flex items-center mb-0">
                                        <input className="form-checkbox size-4 appearance-none rounded border border-gray-200 dark:border-gray-800 accent-green-600 checked:appearance-auto dark:accent-green-600 focus:border-green-300 focus:ring-0 focus:ring-offset-0 focus:ring-green-200 focus:ring-opacity-50 me-2" type="checkbox" value="" id="RememberMe"/>
                                        <label className="form-checkbox-label text-slate-400" htmlFor="RememberMe">Remember me</label>
                                    </div>
                                    <p className="text-slate-400 mb-0"><Link href="/reset-password" className="text-slate-400">Forgot password ?</Link></p>
                                </div>

                                <div className="mb-4">
                                    <input type="submit" className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md w-full" value="Login / Sign in"/>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
        <Switcher/>
        <BackToHome/>
        </>
    )
}
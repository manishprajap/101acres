import Link from "next/link";
import Image from "next/image";
import Switcher from "../landing/components/switcher";


export default function Errorpages() {

    return (
        <>
            <section className="relative bg-green-600/5">
                <div className="container-fluid relative">
                    <div className="grid grid-cols-1">
                        <div className="flex flex-col min-h-screen justify-center md:px-10 py-10 px-4">
                            <div className="text-center">
                                <Link href="/"><Image src="/images/logo-icon-64.png" className="mx-auto" alt="" width={64} height={64}/></Link>
                            </div>
                            <div className="title-heading text-center my-auto">
                                <Image src="/images/error.png" width={200} height={200} className="mx-auto" alt="" />
                                <h1 className="mt-3 mb-6 md:text-4xl text-3xl font-bold">Page Not Found?</h1>
                                <p className="text-slate-400">Whoops, this is embarassing. <br /> Looks like the page you were looking for wasnt found.</p>

                                <div className="mt-4">
                                    <Link href="/" className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md">Back to Home</Link>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="mb-0 text-slate-400">© {(new Date().getFullYear())}{" "} Hously. Design & Develop with <i className="mdi mdi-heart text-red-600"></i> by <Link href="https://aarnatechxperts.in/" target="_blank" className="text-reset">Aarna Tech Xperts</Link>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Switcher/>
        </>
    );

}

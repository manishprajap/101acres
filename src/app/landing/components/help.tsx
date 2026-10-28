import React from "react";
import { featureData } from "@/app/data/data";
import { FiHexagon } from "react-icons/fi";

export default function Help() {
    return (
        <section
            className="relative w-full bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/images/bg/02.jpg')",
            }}
        >
            {/* Transparent Overlay */}
            <div className="absolute inset-0 bg-black/200  bg-transparent to-black bg-gradient-to-b" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <h3 className="mb-4 text-3xl font-semibold text-black text-green-700">
                        We’re Here To Help You
                    </h3>
                    <p className="text-slate-600 text-white">
                        What Are You Looking For?​
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
                    {featureData.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-xl text-center shadow-lg"
                            >
                                <div className="relative mb-6">
                                    <FiHexagon className="h-32 w-32 fill-green-600/10 mx-auto" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600 text-4xl">
                                        <Icon height={36} width={36} />
                                    </div>
                                </div>
                                <h5 className="text-xl font-semibold text-black dark:text-white">
                                    {item.title}
                                </h5>
                                <p className="text-slate-600 dark:text-slate-300 mt-3">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

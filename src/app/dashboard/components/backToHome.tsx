import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function BackToHome(){
    return(
        <div className="fixed bottom-3 end-3 z-50">
            <Link href="/" className="back-button btn btn-icon bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md"><FiArrowLeft className="h-4 w-4"/></Link>
        </div>
    )
}
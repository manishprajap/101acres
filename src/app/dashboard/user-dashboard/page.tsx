// src/app/dashboard/user/page.tsx
'use client'

import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Wrapper from '../components/wrapper'
import Counter from '../components/counter'
import Charts from '../components/charts'
import ScrollBar from '../components/scrollbar'
import axios from 'axios';
import { counterData, salesData, recentTransection, topProperties } from '../data/data'
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";

interface CounterData {

    icon: string;
    title: string;
    target: number;
    symbol: string;
}

interface SaleData {
    title: string;
    sale: string;
}
interface RecentTransectionData {
    image: string;
    date: string;
    name: string;
    price: string;
    type: string;
    status: string;
}

interface TopProperties {
    image: string;
    name: string;
    loction: string;
    rate: string;
    status: string;
}

const MapVactor = dynamic(() => import('../components/mapVactor'), { ssr: false });

export default function UserDashboard() {
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState("");
    const [userId, setUserId] = useState("");
    const [userName, setUserName] = useState("");
	const [planAlert, setPlanAlert] = useState("");
	const [planExpired, setPlanExpired] = useState(false);
    useEffect(() => {
        const message = localStorage.getItem("loginSuccess");
        if (message) {
            setSuccessMessage(message);
            /* localStorage.removeItem("loginSuccess"); */
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");

        if (!token || !storedUserId) {
            router.push("/login");
        } else {
            setUserId(storedUserId);
        }
    }, [router]);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);

        }
    }, []);

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
            setUserName(storedUserName);

        }
    }, []);

const getDaysLeft = (expiryDate: string) => {
  const now = new Date().getTime();
  const expiry = new Date(expiryDate).getTime();

  const diff = expiry - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
useEffect(() => {
  const userId = localStorage.getItem("userId");

  if (!userId) return;

  const fetchPlan = async () => {
    try {
      const res = await axios.get(`/api/user-plan?userId=${userId}`);

      // API returns an array of plan rows — pick the latest/active one
      const rawData = res.data;
      const plan = Array.isArray(rawData) ? rawData[0] : rawData;

      if (plan?.expiry_date) {
        const daysLeft = getDaysLeft(plan.expiry_date);

        if (daysLeft <= 4 && daysLeft > 0) {
          setPlanAlert(`⚠️ Your plan will expire in ${daysLeft} day(s)`);
          setPlanExpired(false);
        } else if (daysLeft <= 0) {
          setPlanAlert(`❌ Your plan has expired`);
          setPlanExpired(true);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  fetchPlan();
}, []);

    return (
        <div className="conatainer-fluid">
            <Wrapper>
                <div className="flex flex-1 flex-row">
                    
                    <div className="container-fluid relative px-3 flex justify-center items-center flex-2/3 bg-red">

                       <div className="layout-specing min-h-screen flex flex-col justify-center items-center text-center">
  {successMessage && (
    <div className="mb-4 px-6 py-2 bg-green-100 text-green-800 rounded">
      Welcome, {successMessage}
    </div>
  )}
  {planAlert && (
  <div className="fixed top-25 right-5 z-50 animate-pulse bg-red-600 text-white px-6 py-3 rounded shadow-lg flex items-center gap-4">
    <span>{planAlert}</span>
    <Link
      href="/pricing"
      className="bg-white text-red-600 text-sm font-semibold px-3 py-1 rounded hover:bg-red-50 whitespace-nowrap"
    >
      {planExpired ? "Renew Plan" : "Upgrade Plan"}
    </Link>
  </div>
)}

  <h5 className="text-[50px] font-bold text-green-600">
    Welcome, {userName || 'User'}
  </h5>
  <h1 className="text-[30px] text-gray-700">
    Explore and manage your favorite properties
  </h1>
</div>


                    </div>

                </div>

                {/* </div> */}
            </Wrapper>

        </div>
    )
}
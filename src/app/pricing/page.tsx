"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck } from "react-icons/fi";
import Navbar from "../landing/components/navbar";
import Footer from "../landing/components/footer";

type Plan = {
  _id: string;
  name: string;
  price: string;
  duration: string;
  popular?: boolean;
  features: string[];
};

// Helper: does this plan count as "Free"?
const isFreePlan = (price: string) => price === "Free" || price === "0" || Number(price) === 0;

// Helper: format price for display (adds ₹ for paid plans)
const formatPrice = (price: string) => {
  if (isFreePlan(price)) return "Free";
  const num = Number(price);
  return !isNaN(num) ? `₹${num.toLocaleString("en-IN")}` : price;
};

export default function Subscription() {
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/plans");
        const data = await res.json();

        if (data.success) {
          setPlans(data.plans);
        } else {
          setError(data.message || "Failed to load plans");
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        setError("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Plan select hote hi seedha signup page pe bhej do, saath me plan name query param me
  const handleChoosePlan = (planName: string) => {
    router.push(`/auth-signup?plan=${encodeURIComponent(planName)}`);
  };

  return (
    <>
      <Navbar navClass={""} topnavClass={""} tagline={false} />
      <section
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="relative md:pb-24 pb-16 mt-20 table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover"
      >
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">
              Plans
            </h3>
          </div>
        </div>
      </section>
      <div className="container lg:mt-24 mt-16">
        <div className="grid grid-cols-1 pb-8 text-center">
          <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">
            Choose Your Plan
          </h3>
          <p className="text-slate-400 max-w-xl mx-auto">
            Simple, transparent pricing to list, sell or rent your properties without any agent or commissions.
          </p>
        </div>

        {loading && (
          <div className="text-center text-slate-400 py-10">Loading plans...</div>
        )}

        {!loading && error && (
          <div className="text-center text-red-500 py-10">{error}</div>
        )}

        {!loading && !error && plans.length === 0 && (
          <div className="text-center text-slate-400 py-10">No plans available right now.</div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="group relative rounded-xl overflow-hidden p-6 transition-all duration-500 ease-in-out border border-[oklch(0.18_0_0)] bg-transparent hover:border-green-600 hover:shadow-lg hover:shadow-green-600/10"
              >
                {plan.popular && (
                  <span className="absolute top-4 right-4 text-xs font-medium bg-green-600 text-white px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}

                <h5 className="text-xl font-semibold">{plan.name}</h5>

                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-bold text-green-600">{formatPrice(plan.price)}</span>
                  {!isFreePlan(plan.price) && (
                    <span className="text-slate-400 mb-1 text-sm">/ {plan.duration}</span>
                  )}
                </div>
                {isFreePlan(plan.price) && (
                  <span className="text-slate-400 text-sm">{plan.duration}</span>
                )}

                <ul className="mt-6 space-y-3 text-left">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <FiCheck className="text-green-600 shrink-0" size={16} />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoosePlan(plan.name)}
                  className="mt-8 w-full py-2.5 rounded-md font-medium transition-all duration-500 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                >
                  {isFreePlan(plan.price) ? "Get Started" : "Choose Plan"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
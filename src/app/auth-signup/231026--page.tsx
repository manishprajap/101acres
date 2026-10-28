"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import Navbar from "../landing/components/navbar";
import Footer from "../landing/components/footer";

// ---- Payment / Scan & Pay details ----
const PAYMENT_DETAILS = {
  accountName: "101ACRES.COM",
  accountNumber: "8054278341",
  bankName: "Indian Bank",
  ifscCode: "IDIB000M175",
  branch: "IND MSME BRANCH NEW DELHI, INDER ENCLAVE, NEW DELHI 110087",
  upiId: "101acrescom@indianbk",
  whatsappNumber: "919217703975", // country code + number, no + or spaces
};

// Only these names are treated as free (exact match, case-insensitive).
// Silver / Gold / Diamond and anything else is a paid plan.
const FREE_PLAN_NAMES = ["free"];

const isFreePlan = (plan: string) =>
  FREE_PLAN_NAMES.includes((plan || "").trim().toLowerCase());

function SignUpForm() {
  const searchParams = useSearchParams();

  // searchParams already decodes %20; trim removes the trailing space in "free%20"
  const planFromUrl = (searchParams.get("plan") || "").replace(/\s+/g, " ").trim();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
    plan: planFromUrl,
  });

  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Scan & Pay popup (paid plans only, after successful registration)
  const [showPopup, setShowPopup] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("/auth-login");

  useEffect(() => {
    if (planFromUrl) {
      setForm((prev) => ({ ...prev, plan: planFromUrl }));
    }
  }, [planFromUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closePopupAndRedirect = () => {
    setShowPopup(false);
    window.location.href = redirectUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.mobile)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Mobile Number",
        text: "Mobile number must be exactly 10 digits",
      });
      return;
    }

    if (!form.role) {
      Swal.fire({
        icon: "warning",
        title: "Missing Role",
        text: "Please select a role (User or Agent).",
      });
      return;
    }

    if (!form.plan.trim()) {
      Swal.fire({
        icon: "warning",
        title: "No Plan Selected",
        text: "Please choose a subscription plan first.",
      });
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        data.append(key, key === "plan" ? value.trim() : value);
      });

      if (image) {
        data.append("image", image);
      }

      const res = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (res.ok) {
        // The server is the source of truth. Fall back to the plan name only
        // if the API did not return requiresPayment.
        // A Free plan never needs payment, even if the server flag is wrong.
        // Only a paid plan can be forced to show the popup by the server.
        const needsPayment = isFreePlan(form.plan)
          ? false
          : result?.requiresPayment !== false;

        if (needsPayment) {
          // Silver / Gold / Diamond -> show Scan & Pay popup.
          setRedirectUrl("/auth-login");
          setShowPopup(true);
        } else {
          // Free plan -> no QR popup, show success and redirect to login.
          await Swal.fire({
            icon: "success",
            title: "Registration Successful",
            text: "Redirecting to login...",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });

          window.location.href = "/auth-login";
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: result?.error || "Something went wrong.",
        });
      }
    } catch (err) {
      console.error("Submit error:", err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---- Scan & Pay derived values ----
  const upiPayString = `upi://pay?pa=${PAYMENT_DETAILS.upiId}&pn=${encodeURIComponent(
    PAYMENT_DETAILS.accountName
  )}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayString
  )}`;
  const whatsappShareUrl = `https://wa.me/${PAYMENT_DETAILS.whatsappNumber}?text=${encodeURIComponent(
    `Hi, I have registered on 101acres.com with the "${form.plan}" plan and am sharing the payment screenshot for approval.`
  )}`;

  return (
    <div className="mb-180">
      <Navbar navClass="" topnavClass="" tagline={false} />

      <section className="md:h-screen mt-20 flex items-center relative overflow-hidden bg-white">
        <div
          style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
          className="absolute inset-0 z-10 bg-no-repeat bg-center bg-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-20" />

        <div className="relative z-30 w-full mb-6">
          <div className="flex justify-center">
            <div className="max-w-[420px] w-full m-auto p-6 bg-white shadow-xl rounded-md">
              <h5 className="my-6 text-center text-xl font-bold">Create an Account</h5>

              {/* Selected Plan Badge */}
              {form.plan ? (
                <div className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-2">
                  <span className="text-sm text-slate-600">
                    Selected Plan:{" "}
                    <span className="font-semibold text-green-700">{form.plan}</span>
                  </span>
                  <Link
                    href="/pricing"
                    className="text-xs font-medium text-green-700 underline"
                  >
                    Change
                  </Link>
                </div>
              ) : (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md px-4 py-2 text-sm text-yellow-700">
                  No plan selected —{" "}
                  <Link href="/pricing" className="underline font-medium">
                    choose a plan first
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Role */}
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-base font-medium">Register As:</label>

                  <label className="flex items-center text-sm font-semibold">
                    <input
                      type="radio"
                      name="role"
                      value="owner"
                      checked={form.role === "owner"}
                      onChange={handleChange}
                      className="mr-1"
                    />
                Owner
                  </label>

                  <label className="flex items-center text-sm font-semibold">
                    <input
                      type="radio"
                      name="role"
                      value="agent"
                      checked={form.role === "agent"}
                      onChange={handleChange}
                      className="mr-1"
                    />
                    Agent
                  </label><label className="flex items-center text-sm font-semibold">
                    <input
                      type="radio"
                      name="role"
                      value="dealer"
                      checked={form.role === "dealer"}
                      onChange={handleChange}
                      className="mr-1"
                    />
                  Dealer
                  </label>
                  <label className="flex items-center text-sm font-semibold">
                    <input
                      type="radio"
                      name="role"
                      value="builder"
                      checked={form.role === "builder"}
                      onChange={handleChange}
                      className="mr-1"
                    />
                    Builder
                  </label>
                </div>

                {/* Name */}
                <div className="mb-4 mt-4">
                  <label className="block font-medium">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="form-input w-full border px-3 py-2 rounded-md"
                    placeholder="Your name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-input w-full border px-3 py-2 rounded-md"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                {/* Mobile */}
                <div className="mb-4">
                  <label className="block font-medium">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    className="form-input w-full border px-3 py-2 rounded-md"
                    placeholder="Enter 10-digit mobile"
                    required
                  />
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block font-medium">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="form-input w-full border px-3 py-2 rounded-md"
                    placeholder="Password"
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 rounded-md text-white ${
                    loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loading ? "Registering..." : "Register"}
                </button>

                <p className="text-center mt-4 text-gray-600">
                  Already have an account?{" "}
                  <Link href="/auth-login" className="font-bold">
                    Sign In
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Scan & Pay Modal — paid plans only, after successful registration */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full p-6 md:p-8">
            <button
              type="button"
              onClick={closePopupAndRedirect}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none"
            >
              &times;
            </button>

            <h5 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
              Scan &amp; Pay to Activate Your Plan
            </h5>
            <p className="text-center text-sm text-slate-500 mb-6">
              Your account is created. Your <strong>{form.plan}</strong> plan will be
              activated once we verify your payment.
            </p>

            <div className="grid md:grid-cols-2 grid-cols-1 gap-6 items-center">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[220px] rounded-2xl border-2 border-blue-800 overflow-hidden shadow-sm bg-white">
                  <div className="bg-blue-900 text-white text-center py-1.5">
                    <p className="text-[11px] font-bold tracking-wide">101 ACRES.COM</p>
                  </div>
                  <p className="text-center text-[10px] font-semibold text-slate-700 py-1 border-b border-dashed border-gray-300">
                    SCAN &amp; PAY
                  </p>
                  <div className="flex justify-center p-3">
                    <Image
                      src={qrCodeUrl}
                      alt="Scan & Pay QR Code"
                      width={160}
                      height={160}
                      unoptimized
                      className="rounded"
                    />
                  </div>
                  <div className="bg-orange-500 text-white text-center py-1">
                    <p className="text-[11px] font-bold tracking-wide">BHIM · UPI</p>
                  </div>
                </div>
                <p className="text-green-600 font-medium mt-3 text-sm break-all text-center">
                  UPI ID: {PAYMENT_DETAILS.upiId}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Account Name:</span>{" "}
                  {PAYMENT_DETAILS.accountName}
                </p>
                <p>
                  <span className="font-semibold">Account Number:</span>{" "}
                  {PAYMENT_DETAILS.accountNumber}
                </p>
                <p>
                  <span className="font-semibold">Bank:</span> {PAYMENT_DETAILS.bankName}
                </p>
                <p>
                  <span className="font-semibold">IFSC Code:</span> {PAYMENT_DETAILS.ifscCode}
                </p>
                <p>
                  <span className="font-semibold">Branch:</span> {PAYMENT_DETAILS.branch}
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <h6 className="font-semibold text-slate-900 dark:text-white mb-2">
                Share Screenshot of Payment
              </h6>
              <p className="bg-green-600 text-white rounded-md py-2 px-3 inline-block text-sm mb-3">
                After payment, please share the screenshot on WhatsApp to:
              </p>
              <div>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 font-medium"
                >
                  📞 +{PAYMENT_DETAILS.whatsappNumber.replace(/^91/, "91 ")}
                </a>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={closePopupAndRedirect}
                  className="btn bg-slate-600 hover:bg-slate-700 text-white rounded-md px-4 py-2"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center">Loading...</div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
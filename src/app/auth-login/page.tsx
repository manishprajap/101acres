"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import Footer from "../landing/components/footer";
import Navbar from "../landing/components/navbar";

/*
 * Sirf internal paths allow karo (open redirect attack se bachne ke liye).
 * "/dashboard/add-property" jaisa path allowed hai,
 * "//evil.com" ya "https://evil.com" allowed nahi hai.
 */
const getSafeRedirect = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;
  return value;
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Login successful!",
          text: "Redirecting you now...",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          customClass: {
            title: "text-[18px]",
            popup: "p-6",
          },
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", data.user.role);

        /*
         * Agar ?redirect=/dashboard/add-property aaya hai
         * to login ke baad seedha wahi page kholo.
         */
        const redirectTo = getSafeRedirect(searchParams.get("redirect"));

        if (redirectTo) {
          router.push(redirectTo);
          return;
        }

        /*
         * Redirect nahi hai to role ke hisaab se dashboard.
         */
        if (data.user.role === "admin") {
          router.push("/");
        } else if (data.user.role === "agent") {
          router.push("/");
        } else if (data.user.role === "owner") {
          router.push("/"); 
        } else if (data.user.role === "dealer") {
          router.push("/"); 
        } else if (data.user.role === "builder") {
          router.push("/");
        } else {
          router.push("/landing/404");
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Login failed",
          text: data.error || "Please check your credentials and try again.",
          customClass: {
            title: "text-[18px]",
            popup: "p-6",
          },
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred. Please try again later.",
        customClass: {
          title: "text-[18px]",
          popup: "p-6",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-160">
        <Navbar navClass="" topnavClass="" tagline={false} />

        {/* Main Content */}
        <div className="container mt-20">
          <section className="mt:h-screen py-36 flex mt-20 items-center relative overflow-hidden zoom-image bg-white">
            <div
              style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
              className="absolute inset-0 image-wrap bg-no-repeat bg-center bg-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-2" />

            <div className="container z-3">
              <div className="flex justify-center">
                <div className="max-w-[400px] w-full m-auto p-6 bg-white dark:bg-slate-900 shadow-md rounded-md relative">
                  <h5 className="my-6 text-center text-lg text-[20px] font-semibold">
                    Login
                  </h5>

                  <form className="text-start" onSubmit={handleLogin}>
                    <div className="grid grid-cols-1">
                      <div className="mb-4">
                        <label className="font-medium" htmlFor="LoginEmail">
                          Email Address:
                        </label>
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
                        <label className="font-medium" htmlFor="LoginPassword">
                          Password:
                        </label>
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

                      <div className="flex mb-4">
                        <Link
                          href="/landing/auth-reset-password"
                          className="text-slate-400 ml-auto"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="mb-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn bg-green-600 hover:bg-green-700 text-white rounded-md w-full flex items-center justify-center"
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </button>
                      </div>

                      <div className="text-center mt-4">
                        <span className="text-slate-400 me-2">
                          Don&apos;t have an account?
                        </span>
                        <Link
                          href="/auth-signup"
                          className="text-black dark:text-white font-bold"
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
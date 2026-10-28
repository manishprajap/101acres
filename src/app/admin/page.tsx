'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Login() {
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("Login response data:", data);

      if (res.ok) {
        if (data.user && data.user.id && data.user.name && data.token) {
          setSuccessMessage("Login successful! Redirecting...");
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.user.id.toString());
          localStorage.setItem("userName", data.user.name.toString());
          localStorage.setItem("role", "admin");

          localStorage.setItem("loginSuccess", "You are logged in!");
          router.push("/dashboard");
        } else {
          setErrorMessage("Unexpected response structure from server.");
          console.error("User object missing or incomplete in response:", data);
        }
      } else {
        setErrorMessage(data.errorMessage || "Login failed.");
      }
    } catch (err) {
      setErrorMessage("Something went wrong.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="md:h-screen py-36 flex items-center relative overflow-hidden zoom-image bg-white">
      <div
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="absolute inset-0 image-wrap z-1 bg-no-repeat bg-center bg-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-2" />
      <div className="container z-3">
        <div className="flex justify-center">
          <div className="max-w-[400px] w-full m-auto p-6 bg-white dark:bg-slate-900 shadow-md rounded-md">
            <Link href="/">
              <Image
                src="/images/logo1.png"
                alt="Logo"
                width={64}
                height={64}
                className="mx-auto"
              />
            </Link>
            <h5 className="my-6 text-center text-lg font-semibold">Admin Login</h5>

            <form className="text-start" onSubmit={handleLogin}>
              {successMessage && (
                <p className="text-green-600 text-sm mt-2">{successMessage}</p>
              )}
              {errorMessage && (
                <p className="text-red-600 text-sm mt-2">{errorMessage}</p>
              )}

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
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

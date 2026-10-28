"use client";

import React, { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import Navbar from "../landing/components/navbar";
import Footer from "../landing/components/footer";

export default function SignUp() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
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
        text: "Please select a role (Owner, Agent, Dealer or Builder).",
      });
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
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
        await Swal.fire({
          icon: "success",
          title: "Registration Successful",
          text: "Redirecting to login...",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        window.location.href = "/auth-login";
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
                  </label>

                  <label className="flex items-center text-sm font-semibold">
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

      <Footer />
    </div>
  );
}
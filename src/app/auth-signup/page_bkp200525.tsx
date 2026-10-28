"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function SignUp() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    address: "",
    mobile: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("password", form.password);
      data.append("role", form.role);
      data.append("address", form.address);
      data.append("mobile", form.mobile);
      if (image) {
        data.append("image", image);
      }

      const res = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      let result = null;
      try {
        result = await res.json();
      } catch (error) {
        console.warn("Response is not valid JSON.");
      }

      if (res.ok) {
        setMessage("User registered successfully!");
        router.push("/landing/auth-login");
      } else {
        setMessage(result?.error || "Failed to register user.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="md:h-screen py-20 flex items-center relative overflow-hidden zoom-image">
      <div
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="absolute inset-0 image-wrap z-1 bg-no-repeat bg-center bg-cover opacity-100"
      />
      <div className="absolute inset-0 z-2 bg-transparent to-black bg-gradient-to-b" />
      <div className="container z-3">
        <div className="flex justify-center">
          <div className="max-w-5xl w-full m-auto p-6 bg-white dark:bg-slate-900 shadow-md rounded-md">
            <Link href="/">
              <Image src="/images/logo1.png" className="mx-auto" alt="Logo" width={64} height={64} />
            </Link>
            <h5 className="my-6 text-2xl font-semibold text-center">Signup</h5>
            <form className="text-start" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1 */}
                <div>
                  <div className="mb-3">
                    <label className="font-semibold">Your Name:</label>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      className="form-input mt-2"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="font-semibold">Email Address:</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input mt-2"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div>
                  <div className="mb-3">
                    <label className="font-semibold">Password:</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      className="form-input mt-2"
                      placeholder="Password"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="font-semibold">Role:</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 form-input mt-2"
                    >
                      <option value="">Select Role</option>
                      <option value="agent">Agent</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                </div>

                {/* Column 3 */}
                <div>
                  <div className="mb-3">
                    <label className="font-semibold">Address:</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="form-input mt-2"
                      placeholder="Enter address"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="font-semibold">Mobile No:</label>
                    <input
                      name="mobile"
                      type="tel"
                      value={form.mobile}
                      onChange={handleChange}
                      className="form-input mt-2"
                      placeholder="e.g., 9876543210"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  className={`btn ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                  } text-white rounded-md w-full`}
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>

              {/* Message Display */}
              {message && (
                <div className="mt-4 text-center text-2xl text-blue-500 font-bold">
                  <p>{message}</p>
                </div>
              )}

              {/* Redirect Link */}
              <div className="text-center mt-4">
                <span className="text-slate-400 me-2">Already have an account?</span>
                <Link href="/landing/auth-login" className="text-black dark:text-white font-bold">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Wrapper from "../components/wrapper";

type Plan = {
  _id: string;
  name: string;
  price: string;
  duration: string;
  listingLimit: number | null;
  features: string[];
};

const emptyForm = {
  name: "",
  price: "",
  duration: "",
  listingLimit: "", // empty string = unlimited
  features: "",
};

export default function AddPlanPage() {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : data.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans", error);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEditClick = (plan: Plan) => {
    setEditingId(plan._id);
    setForm({
      name: plan.name || "",
      price: plan.price || "",
      duration: plan.duration || "",
      listingLimit:
        plan.listingLimit === null || plan.listingLimit === undefined
          ? ""
          : String(plan.listingLimit),
      features: Array.isArray(plan.features) ? plan.features.join(", ") : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) => prev.filter((p) => p._id !== id));
        if (editingId === id) resetForm();
      } else {
        alert(data.message || "Failed to delete plan");
      }
    } catch (error) {
      alert("Something went wrong.");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const featuresArray = form.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const isEditing = Boolean(editingId);
      const url = isEditing ? `/api/plans/${editingId}` : "/api/plans";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          price: form.price,
          duration: form.duration,
          listingLimit: form.listingLimit, // "" => unlimited (handled server-side)
          features: featuresArray,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(isEditing ? "Plan updated successfully" : "Plan added successfully");
        resetForm();
        fetchPlans();
      } else {
        alert(data.message || (isEditing ? "Failed to update plan" : "Failed to add plan"));
      }
    } catch (error) {
      alert("Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="container-fluid relative px-3">
        <div className="layout-specing">
          <div className="md:flex justify-between items-center">
            <h5 className="text-lg font-semibold">
              {editingId ? "Edit Plan" : "Add New Plan"}
            </h5>
            <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
              <li className="inline-block capitalize text-[16px] font-medium duration-500 dark:text-white/70 hover:text-green-600 dark:hover:text-white">
                <Link href="/">101Acres</Link>
              </li>
              <li className="inline-block text-base text-slate-950 dark:text-white/70 mx-0.5">
                <i className="mdi mdi-chevron-right"></i>
              </li>
              <li
                className="inline-block capitalize text-[16px] font-medium text-green-600 dark:text-white"
                aria-current="page"
              >
                {editingId ? "Edit Plan" : "Add New Plan"}
              </li>
            </ul>
          </div>

          <div className="container relative">
            <div className="grid md:grid-cols-1 grid-cols-1 gap-6 mt-6">
              <div className="rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900 h-fit">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-12 gap-5">
                    <div className="col-span-12 md:col-span-3">
                      <label className="font-medium">Plan Name</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="form-input w-full border px-3 py-2 rounded-md mt-2"
                        placeholder="Plan name"
                        required
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="font-medium">Plan Price</label>
                      <input
                        type="text"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        className="form-input w-full border px-3 py-2 rounded-md mt-2"
                        placeholder="Plan price"
                        required
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="font-medium">Duration</label>
                      <input
                        type="text"
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        className="form-input w-full border px-3 py-2 rounded-md mt-2"
                        placeholder="e.g. 1 Month, 1 Year"
                        required
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="font-medium">Listing Limit</label>
                      <input
                        type="number"
                        min={0}
                        name="listingLimit"
                        value={form.listingLimit}
                        onChange={handleChange}
                        className="form-input w-full border px-3 py-2 rounded-md mt-2"
                        placeholder="Leave empty = Unlimited"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Max properties a user can list. Leave blank for unlimited (e.g. Gold plan).
                      </p>
                    </div>

                    <div className="col-span-12">
                      <label className="font-medium">Features</label>
                      <textarea
                        name="features"
                        value={form.features}
                        onChange={handleChange}
                        className="form-input w-full border !h-40 !border-gray-500 dark:!border-gray-800 mt-2 rounded-md"
                        placeholder="Comma separated, e.g. Priority Support, Unlimited Listings"
                      />
                    </div>

                    <div className="col-span-12">
                      <div className="flex justify-end gap-3 mt-4">
                        {editingId && (
                          <button
                            type="button"
                            onClick={resetForm}
                            className="btn border border-gray-300 text-gray-700 dark:text-white rounded-md px-4 py-2"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className={`btn flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md px-4 py-2 ${
                            loading ? "opacity-75 cursor-not-allowed" : ""
                          }`}
                        >
                          {loading ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                              </svg>
                              Saving...
                            </>
                          ) : editingId ? (
                            "Update"
                          ) : (
                            "Submit"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900 h-fit">
                <h5 className="text-lg font-semibold mb-4">All Plans</h5>

                {plansLoading ? (
                  <p className="text-sm text-gray-500">Loading plans...</p>
                ) : plans.length === 0 ? (
                  <p className="text-sm text-gray-500">No plans added yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="py-2 px-3 font-medium">Name</th>
                          <th className="py-2 px-3 font-medium">Price</th>
                          <th className="py-2 px-3 font-medium">Duration</th>
                          <th className="py-2 px-3 font-medium">Listing Limit</th>
                          <th className="py-2 px-3 font-medium">Features</th>
                          <th className="py-2 px-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan) => (
                          <tr
                            key={plan._id}
                            className="border-b dark:border-gray-800 last:border-0"
                          >
                            <td className="py-2 px-3">{plan.name}</td>
                            <td className="py-2 px-3">{plan.price}</td>
                            <td className="py-2 px-3">{plan.duration}</td>
                            <td className="py-2 px-3">
                              {plan.listingLimit === null || plan.listingLimit === undefined
                                ? "Unlimited"
                                : plan.listingLimit}
                            </td>
                            <td className="py-2 px-3">
                              {Array.isArray(plan.features)
                                ? plan.features.join(", ")
                                : plan.features}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(plan)}
                                  className="text-green-600 hover:underline text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(plan._id)}
                                  className="text-red-600 hover:underline text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
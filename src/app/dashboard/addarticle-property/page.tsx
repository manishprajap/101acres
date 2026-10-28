"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Wrapper from "../components/wrapper";

type Property = {
  id: number;
  title: string;
  squareFt: string;
  beds: string;
  baths: string;
  price: string;
  image: string;
};

type Country = { id: number; name: string };
type State = { id: number; name: string };
type City = { id: number; name: string };
type Area = { id: number; name: string };

export default function AddArticleProperty() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  const [formData, setFormData] = useState({
   
    propertyType: "",
    residentialType: "",
    propertyFor: "",
    country: "",
    countryId: "",
    state: "",
    stateId: "",
    city: "",
    cityId: "",
    area: "",
    areaId: "",
    propertyLocation: "",
    description: "",
    slug: "",
  });

  const capitalizeWords = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const getCapitalizedFormData = () => {
    const newData: typeof formData = { ...formData };
    Object.entries(newData).forEach(([key, value]) => {
      if (typeof value === "string") {
        newData[key as keyof typeof formData] = capitalizeWords(value);
      }
    });
    return newData;
  };

  const handleChanges = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "countryId") {
      const selectedCountry = countriesList.find((c) => c.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        countryId: value,
        country: selectedCountry?.name || "",
        stateId: "",
        state: "",
        cityId: "",
        city: "",
        area: "",
        areaId: "",
      }));
      try {
        const res = await fetch(`/api/states?countryId=${value}`);
        const data = await res.json();
        setStates(data || []);
        setCities([]);
      } catch (err) {
        console.error("Failed to fetch states", err);
      }
      return;
    }

    if (name === "stateId") {
      const selectedState = states.find((s) => s.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        stateId: value,
        state: selectedState?.name || "",
        cityId: "",
        city: "",
        area: "",
        areaId: "",
      }));
      try {
        const res = await fetch(`/api/cities?stateId=${value}`);
        const data = await res.json();
        setCities(data || []);
      } catch (err) {
        console.error("Failed to fetch cities", err);
      }
      return;
    }

    if (name === "areaId") {
      const selectedArea = areas.find((a) => a.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        areaId: value,
        area: selectedArea?.name || "",
      }));
      return;
    }

    if (name === "cityId") {
      const selectedCity = cities.find((c) => c.id.toString() === value);
      const cityName = selectedCity?.name || "";
      setFormData((prev) => ({
        ...prev,
        cityId: value,
        city: selectedCity?.name || "",
        slug: generateSlug(cityName),
        area: "",
        areaId: "",
      }));

      try {
        const response = await fetch(`/api/area?cityId=${value}`);
        if (!response.ok) throw new Error("Failed to fetch areas");
        const data: Area[] = await response.json();
        setAreas(data);
      } catch (error) {
        console.error("Error fetching areas:", error);
        setAreas([]);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileList = Array.from(selectedFiles);
      setFiles(fileList);
      const previewUrlsList = fileList.map((file) => URL.createObjectURL(file));
      setPreviewUrls(previewUrlsList);
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");

    if (storedUserId && storedRole) {
      setUserId(storedUserId);
      setRole(storedRole);
    } else {
      router.push("/auth-login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      const capitalizedData = getCapitalizedFormData();

      Object.entries(capitalizedData).forEach(([key, value]) => {
        form.append(key, value);
      });

      if (!userId) {
        alert("User ID not found. Please log in again.");
        setLoading(false);
        return;
      }
      form.append("userId", userId);

      if (!role) {
        alert("Role not found. Please log in again.");
        setLoading(false);
        return;
      }
      form.append("role", role);

      if (role === "admin") {
        form.append("status", "Active");
      }

      files.forEach((file) => form.append("images", file));

      const res = await fetch("/api/article_property", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      console.log("object",data)

      if (res.ok) {
        localStorage.setItem("PropertySuccess", "Property added successfully!");
		const redirectAndReload = (url: string) => {
				window.location.href = url; // ✅ Proper reload+redirect in App Router
			  };
        if (role === "admin") {
          redirectAndReload("/dashboard/listArticleproperty");
       
        } else if (role === "agent") {
          redirectAndReload("/dashboard/listArticleproperty");
        } else if (role === "user") {
          redirectAndReload("/dashboard/userProperty");
        } else {
          redirectAndReload("/dashboard");
        }
      } else {
        alert(data.message || "Failed to add property");
      }
    } catch (error) {
      alert("Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/country")
      .then((res) => res.json())
      .then((data) => setCountriesList(data || []))
      .catch((error) => console.error("Error fetching countries:", error));

    const message = localStorage.getItem("PropertySuccess");
    if (message) {
      setSuccessMessage(message);
      localStorage.removeItem("PropertySuccess");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-transparent">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-20 w-20"></div>
        <style>{`
          .loader {
            border-top-color: rgb(110, 189, 36);
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

    return (
        <Wrapper>
            <div className="container-fluid relative px-3">
                <div className="layout-specing">
                   
                    <div className="md:flex justify-between items-center">
                        <h5 className="text-lg font-semibold">Add Article Property</h5>
                        <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
                            <li className="inline-block capitalize text-[16px] font-medium duration-500 dark:text-white/70 hover:text-green-600 dark:hover:text-white">
                                <Link href="/">101Acres</Link>
                            </li>
                            <li className="inline-block text-base text-slate-950 dark:text-white/70 mx-0.5">
                                <i className="mdi mdi-chevron-right"></i>
                            </li>
                            <li className="inline-block capitalize text-[16px] font-medium text-green-600 dark:text-white" aria-current="page">
                            Add Article Property
                            </li>
                        </ul>
                    </div>

                    <div className="container relative">
                        <div className="grid md:grid-cols-1 grid-cols-1 gap-6 mt-6">

                            <div className="rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900 h-fit">
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-12 gap-5">
                                        {/* Location */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Property Location:</label>
                                            <select
                                                name="propertyLocation"
                                                value={formData.propertyLocation}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-500 dark:!border-gray-800 mt-2"
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="National">National</option>
                                                <option value="International">International</option>
                                            </select>
                                        </div>


                                        {/* Property For */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Property For:</label>
                                            <select
                                                name="propertyFor"
                                                value={formData.propertyFor}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-500 dark:!border-gray-800 mt-2"
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="Rent">Rent</option>
                                                <option value="Sale">Sale</option>
                                            </select>
                                        </div>

                                        {/* Property Type */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Property Type:</label>
                                            <select
                                                name="propertyType"
                                                value={formData.propertyType}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-500 dark:!border-gray-800 mt-2 w-full"
                                            >
                                                <option value="">Select Type</option>
                                                <option value="Commercial">Commercial</option>
                                                <option value="Residential">Residential</option>
                                            </select>
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">Commercial Type:</label>
                                            <select
                                                name="residentialType"
                                                value={formData.residentialType || ""}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-500 dark:!border-gray-800 mt-2 w-full"
                                            >
                                                <option value="">Select Commercial Type</option>
                                                <option value="Shop">Shop</option>
                                                <option value="Office">Office</option>
                                                <option value="Hotel">Hotel</option>
                                                <option value="Land">Land</option>
                                                <option value="Marriage Lawn">Marriage Lawn</option>
                                                <option value="House">House</option>
                                                <option value="Flat">Flat</option>
                                                <option value="Land">Land</option>
                                                <option value="Farm House">Farm House</option>
                                            </select>
                                        </div>



                                        {/* Location Dropdowns */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Country:</label>
                                            <select name="countryId" value={formData.countryId} onChange={handleChanges} className="form-input border !border-gray-500 dark:!border-gray-800 mt-2">
                                                <option value="">Select Country</option>
                                                {countriesList.map((country) => (
                                                    <option key={country.id} value={country.id}>{country.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">State:</label>
                                            <select name="stateId" value={formData.stateId} onChange={handleChanges} className="form-input border !border-gray-500 dark:!border-gray-800 mt-2">
                                                <option value="">Select State</option>
                                                {states.map((state) => (
                                                    <option key={state.id} value={state.id}>{state.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">City:</label>
                                            <select name="cityId" value={formData.cityId} onChange={handleChanges} className="form-input border !border-gray-500 dark:!border-gray-800 mt-2">
                                                <option value="">Select City</option>
                                                {cities.map((city) => (
                                                    <option key={city.id} value={city.id}>{city.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">Area:</label>
                                            <select
                                                name="areaId"
                                                value={formData.areaId}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-500 dark:!border-gray-800 mt-2"
                                            >
                                                <option value="">Select Area</option>
                                                {areas.map((area) => (
                                                    <option key={area.id} value={area.id}>{area.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* description */}
                                        <div className="col-span-12">
                                            <label className="font-medium">Description</label>
                                            <textarea name="description" className="form-input border !h-40 !border-gray-500 dark:!border-gray-800 mt-2" placeholder="Description" value={formData.description} onChange={handleChanges} />
                                        </div>


                                        {/* Image Upload */}
                                        <div className="col-span-12 ">
                                            <div className="rounded-md shadow-sm shadow-gray-500 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900 h-fit">
                                                <p className="font-medium mb-4">
                                                    Upload your property images here. Please click Upload Image Button.(Optional)
                                                </p>

                                                {previewUrls.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {previewUrls.map((url, idx) => (
                                                            <Image
                                                                key={idx}
                                                                src={url}
                                                                alt={`Preview ${idx}`}
                                                                width={100}
                                                                height={100}
                                                                className="object-cover rounded"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="preview-box flex justify-center items-center rounded-md shadow-sm dark:shadow-gray-800 overflow-hidden bg-gray-50 dark:bg-slate-800 text-slate-400 p-4 text-center small w-full max-h-60">
                                                        Supports JPG, PNG. Max file size: 10MB.
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    id="images"
                                                    name="images"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    hidden
                                                />
                                                <label
                                                    htmlFor="images"
                                                    className="btn-upload btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md mt-6 cursor-pointer"
                                                >
                                                    Upload Images
                                                </label>
                                            </div>
                                            <div className="flex justify-end mt-4">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className={`btn flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md px-4 py-2 ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <svg
                                                                className="animate-spin h-5 w-5 text-white"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                            </svg>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        "Submit"
                                                    )}

                                                   
                                                </button>

                                            </div>
                                        </div>

                                    </div>

                                </form>

                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </Wrapper>
    );
}

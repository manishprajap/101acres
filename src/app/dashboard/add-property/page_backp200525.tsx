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

export default function AddProperty() {
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [countriesList, setCountriesList] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        squareFt: "",
        beds: "",
        baths: "",
        price: "",
        propertyType: "",
        residentialType: "",
        propertyFor: "",
        priceFor: "",
        country: "",
        countryId: "",
        state: "",
        stateId: "",
        city: "",
        cityId: "",
        propertyLocation: "",
        landmark: "",
        address: "",
    });

    const handleChanges = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
    
        if (name === "countryId") {
            const selectedCountry = countriesList.find(c => c.id.toString() === value);
            setFormData(prev => ({
                ...prev,
                countryId: value,
                country: selectedCountry?.name || "",
                stateId: "",
                state: "",
                cityId: "",
                city: "",
            }));
            try {
                const res = await fetch(`/api/states?countryId=${value}`);
                const data = await res.json();
                console.log("states data:", data);
                setStates(data || []);
                setCities([]);
            } catch (err) {
                console.error("Failed to fetch states", err);
            }
            return;
        }
    
        if (name === "stateId") {
            const selectedState = states.find(s => s.id.toString() === value);
            setFormData(prev => ({
                ...prev,
                stateId: value,
                state: selectedState?.name || "",
                cityId: "",
                city: "",
            }));
            try {
                const res = await fetch(`/api/cities?stateId=${value}`);
                const data = await res.json();
                console.log("cities data:", data);
                setCities(data || []);
            } catch (err) {
                console.error("Failed to fetch cities", err);
            }
            return;
        }
    
        if (name === "cityId") {
            const selectedCity = cities.find(c => c.id.toString() === value);
            setFormData(prev => ({
                ...prev,
                cityId: value,
                city: selectedCity?.name || "",
            }));
            return;
        }
    
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    

    // Handle file selection and previews
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            const fileList = Array.from(selectedFiles);
            setFiles(fileList); // Update the `files` state
            const previewUrlsList = fileList.map((file) => URL.createObjectURL(file));
            setPreviewUrls(previewUrlsList); // Store the preview URLs for rendering
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const form = new FormData();

            // Append form data
            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, value);
            });

            // Append all selected files
            files.forEach(file => form.append("images", file));

            // Send form data to the backend
            const res = await fetch("/api/property", {
                method: "POST",
                body: form,
            });

            const data = await res.json();

            if (res.ok) {
                // Success: Store success message in localStorage and redirect
                localStorage.setItem("PropertySuccess", "Property added successfully!");
                router.push("/dashboard/PropertyListPage");
            } else {
                // Handle API error response
                alert(data.message || "Failed to add property");
            }
        } catch (error) {
            // Handle unexpected errors
            alert("Something went wrong.");
            console.error(error);
        } finally {
            // Stop loading indicator
            setLoading(false);
        }
    };


    useEffect(() => {
        fetch("/api/country")
            .then(res => res.json())
            .then(data => setCountriesList(data || []))
            .catch(error => console.error("Error fetching countries:", error));

        const message = localStorage.getItem("PropertySuccess");
        if (message) {
            setSuccessMessage(message);
            localStorage.removeItem("PropertySuccess");
        }
    }, []);

    return (
        <Wrapper>
            <div className="container-fluid relative px-3">
                <div className="layout-specing">


                    <div className="md:flex justify-between items-center">
                        <h5 className="text-lg font-semibold">Add Property</h5>
                        <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
                            <li className="inline-block capitalize text-[16px] font-medium duration-500 dark:text-white/70 hover:text-green-600 dark:hover:text-white">
                                <Link href="/">101Acres</Link>
                            </li>
                            <li className="inline-block text-base text-slate-950 dark:text-white/70 mx-0.5">
                                <i className="mdi mdi-chevron-right"></i>
                            </li>
                            <li className="inline-block capitalize text-[16px] font-medium text-green-600 dark:text-white" aria-current="page">
                                Add Property
                            </li>
                        </ul>
                    </div>

                    <div className="container relative">
                        <div className="grid md:grid-cols-1 grid-cols-1 gap-6 mt-6">

                            <div className="rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900 h-fit">
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-12 gap-5">
                                        {/* Location */}
                                        <div className="col-span-6">
                                            <label className="font-medium">Property Location:</label>
                                            <select
                                                name="propertyLocation"
                                                value={formData.propertyLocation}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="National">National</option>
                                                <option value="International">International</option>
                                            </select>
                                        </div>

                                        {/* Title */}
                                        <div className="col-span-6">
                                            <label className="font-medium">Title:</label>
                                            <input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChanges}
                                                type="text"
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                                placeholder="Property Title"
                                                required
                                            />
                                        </div>

                                        {/* Property For */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Property For:</label>
                                            <select
                                                name="propertyFor"
                                                value={formData.propertyFor}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
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
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2 w-full"
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
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2 w-full"
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



                                        {/* Basic Details */}
                                        <div className="md:col-span-4 col-span-12">
                                            <label className="font-medium">Square ft:</label>
                                            <input
                                                name="squareFt"
                                                value={formData.squareFt}
                                                onChange={handleChanges}
                                                type="number"
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                                placeholder="Size (sqft)"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-4 col-span-12">
                                            <label className="font-medium">Beds:</label>
                                            <input
                                                name="beds"
                                                value={formData.beds}
                                                onChange={handleChanges}
                                                type="number"
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                                placeholder="Beds"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-4 col-span-12">
                                            <label className="font-medium">Baths:</label>
                                            <input
                                                name="baths"
                                                value={formData.baths}
                                                onChange={handleChanges}
                                                type="number"
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                                placeholder="Baths"
                                                required
                                            />
                                        </div>

                                        {/* Pricing */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Price:</label>
                                            <input
                                                name="price"
                                                value={formData.price}
                                                onChange={handleChanges}
                                                type="number"
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                                placeholder="Price"
                                                required
                                            />
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">Price For:</label>
                                            <select
                                                name="priceFor"
                                                value={formData.priceFor}
                                                onChange={handleChanges}
                                                className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                                            >
                                                <option value="">Select</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>

                                        {/* Location Dropdowns */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Country:</label>
                                            <select name="countryId" value={formData.countryId} onChange={handleChanges} className="form-input border !border-gray-200 dark:!border-gray-800 mt-2">
                                                <option value="">Select Country</option>
                                                {countriesList.map((country) => (
                                                    <option key={country.id} value={country.id}>{country.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">State:</label>
                                            <select name="stateId" value={formData.stateId} onChange={handleChanges} className="form-input border !border-gray-200 dark:!border-gray-800 mt-2">
                                                <option value="">Select State</option>
                                                {states.map((state) => (
                                                    <option key={state.id} value={state.id}>{state.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4">
                                            <label className="font-medium">City:</label>
                                            <select name="cityId" value={formData.cityId} onChange={handleChanges} className="form-input border !border-gray-200 dark:!border-gray-800 mt-2">
                                                <option value="">Select City</option>
                                                {cities.map((city) => (
                                                    <option key={city.id} value={city.id}>{city.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Landmark */}
                                        <div className="col-span-4">
                                            <label className="font-medium">Landmark:</label>
                                            <input name="landmark" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Landmark" value={formData.landmark} onChange={handleChanges} />

                                        </div>

                                        {/* Address */}
                                        <div className="col-span-12">
                                            <label className="font-medium">Address:</label>
                                            <textarea name="address" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Address" value={formData.address} onChange={handleChanges} />
                                        </div>


                                        {/* Image Upload */}
                                        <div className="col-span-12">
                                            <div className="rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900 h-fit">
                                                <p className="font-medium mb-4">
                                                    Upload your property images here. Please click Upload Image Button.
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
                                                    className="btn-upload btn bg-blue-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md mt-6 cursor-pointer"
                                                >
                                                    Upload Images
                                                </label>
                                            </div>
                                        </div>

                                    </div>


                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md mt-5 float:right"
                                    >
                                        {loading ? "Saving..." : "Submit"}
                                    </button>

                                </form>

                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </Wrapper>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Wrapper from "@/app/dashboard/components/wrapper";
import { FiImage, FiMail, FiMapPin, FiUser, FiPhone } from "react-icons/fi";
import axios from "axios";

const EditUserPage = () => {
    const router = useRouter();
    const { id } = useParams();
    const [user, setUser] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        address: "",
        countryId: "",
        stateId: "",
        cityId: "",
    });

    const [countriesList, setCountriesList] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    // Fetch countries and user data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [countriesRes, userRes] = await Promise.all([
                    axios.get("/api/country"),
                    fetch(`/api/register/${id}`)
                ]);

                setCountriesList(countriesRes.data);

                const userData = await userRes.json();
                if (userData.success) {
                    setUser(userData.data);
                    setFormData({
                        name: userData.data.name || "",
                        email: userData.data.email || "",
                        mobile: userData.data.mobile || "",
                        address: userData.data.address || "",
                        countryId: userData.data.countryId || "",
                        stateId: userData.data.stateId || "",
                        cityId: userData.data.cityId || "",
                    });
                    if (userData.data.image) {
                        setPreviewUrl(userData.data.image);
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        if (id) {
            fetchInitialData();
        }
    }, [id]);

    // Fetch states when country changes
    useEffect(() => {
        const fetchStates = async () => {
            if (!formData.countryId) {
                setStates([]);
                setCities([]);
                return;
            }

            try {
                const res = await axios.get(`/api/states?countryId=${formData.countryId}`);
                setStates(res.data);
            } catch (err) {
                console.error("Error fetching states:", err);
            }
        };

        fetchStates();
    }, [formData.countryId]);

    // Fetch cities when state changes
    useEffect(() => {
        const fetchCities = async () => {
            if (!formData.stateId) {
                setCities([]);
                return;
            }

            try {
                const res = await axios.get(`/api/cities?stateId=${formData.stateId}`);
                setCities(res.data);
            } catch (err) {
                console.error("Error fetching cities:", err);
            }
        };

        fetchCities();
    }, [formData.stateId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });
            if (imageFile) {
                data.append("image", imageFile);
            }

            const res = await fetch(`/api/register/${id}`, {
                method: "PUT",
                body: data,
            });

            const result = await res.json();
            if (result.success) {
                router.push("/dashboard/user/view");
            } else {
                alert("Failed to update user");
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    if (!user) return <p>Loading...</p>;

    return (
        <Wrapper>
            <div className="container relative">
                <div className="grid grid-cols-1 gap-6 mt-6">
                    <div className="xl:col-span-9 lg:col-span-8 md:col-span-8">
                        <div className="p-6 rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 bg-white dark:bg-slate-900">
                            <h2 className="text-xl font-bold  py-8">Edit User:</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
                                    <InputField icon={FiUser} label="Name" name="name" value={formData.name} onChange={handleChange} required />
                                    <InputField icon={FiMail} label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                    <InputField icon={FiPhone} label="Mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} />

                                    <SelectField icon={FiMapPin} label="Country" name="countryId" value={formData.countryId} onChange={handleChange} options={countriesList} />
                                    <SelectField icon={FiMapPin} label="State" name="stateId" value={formData.stateId} onChange={handleChange} options={states} />
                                    <SelectField icon={FiMapPin} label="City" name="cityId" value={formData.cityId} onChange={handleChange} options={cities} />

                                    <div>
                                        <label className="form-label font-medium">Profile Image :</label>
                                        <div className="form-icon relative mt-2">
                                            <FiImage className="w-4 h-4 absolute top-3 start-4" />
                                            <input
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                className="form-input w-full py-2 px-3 h-8 ps-10"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        {previewUrl && (
                                            <img src={previewUrl} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded" />
                                        )}
                                    </div>

                                    <div className="mt-5 col-span-full">
                                        <label className="form-label font-medium">Address :</label>
                                        <div className="form-icon relative mt-2">
                                            <FiMapPin className="w-4 h-4 absolute top-3 start-4" />
                                            <textarea
                                                name="address"
                                                className="form-input !ps-11 w-full py-2 px-3 !h-28"
                                                placeholder="Address"
                                                value={formData.address}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <input type="submit" className="btn bg-green-600 hover:bg-green-700 text-white mt-5" value="Update" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
};

// Reusable input component
const InputField = ({ icon: Icon, label, name, value, onChange, type = "text", required = false }: any) => (
    <div>
        <label className="form-label font-medium">{label} : {required && <span className="text-red-600">*</span>}</label>
        <div className="form-icon relative mt-2">
            <Icon className="w-4 h-4 absolute top-3 start-4" />
            <input type={type} name={name} value={value} onChange={onChange} className="form-input !ps-12 w-full py-2 px-3 h-10" placeholder={label} />
        </div>
    </div>
);

// Reusable select component
const SelectField = ({ icon: Icon, label, name, value, onChange, options }: any) => (
    <div>
        <label className="form-label font-medium">{label} :</label>
        <div className="form-icon relative mt-2">
            <Icon className="w-4 h-4 absolute top-3 start-4" />
            <select name={name} value={value} onChange={onChange} className="form-input !ps-12 w-full py-2 px-3 h-10">
                <option value="">Select {label}</option>
                {options.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
        </div>
    </div>
);

export default EditUserPage;

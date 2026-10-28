"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Wrapper from "../../components/wrapper";
import Link from "next/link";

interface FormDataType {
  name: string;
  email: string;
  password: string;
  mobile: string;
  country: string;
  countryId: string;
  state: string;
  stateId: string;
  city: string;
  cityId: string;
  address: string;
  image: File | null;
  memberId: string;
  registrationAs: string;
}

type Country = { id: number; name: string };
type State = { id: number; name: string };
type City = { id: number; name: string };

export default function AddUser() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [userId, setUserId] = useState("");

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    password: "",
    mobile: "",
    country: "",
    countryId: "",
    state: "",
    stateId: "",
    city: "",
    cityId: "",
    address: "",
    image: null,
    memberId: "",
    registrationAs: "user",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      setFormData((prev) => ({
        ...prev,
        memberId: storedUserId,
      }));
    }
  }, []);

  useEffect(() => {
    fetch("/api/country").then((res) => res.json()).then(setCountriesList);
  }, []);

  useEffect(() => {
    if (formData.countryId) {
      fetch(`/api/states?countryId=${formData.countryId}`)
        .then((res) => res.json())
        .then(setStates);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formData.countryId]);

  useEffect(() => {
    if (formData.stateId) {
      fetch(`/api/cities?stateId=${formData.stateId}`)
        .then((res) => res.json())
        .then(setCities);
    } else {
      setCities([]);
    }
  }, [formData.stateId]);

  const handleChanges = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "countryId") {
      setFormData((prev) => ({
        ...prev,
        countryId: value,
        stateId: "",
        cityId: "",
      }));
      return;
    }

    if (name === "stateId") {
      setFormData((prev) => ({
        ...prev,
        stateId: value,
        cityId: "",
      }));
      return;
    }

    if (name === "cityId") {
      setFormData((prev) => ({
        ...prev,
        cityId: value,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.image) {
      alert("Please upload an image.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("mobile", formData.mobile);
    data.append("country", formData.countryId);
    data.append("state", formData.stateId);
    data.append("city", formData.cityId);
    data.append("address", formData.address);
    data.append("image", formData.image);
    data.append("memberId", formData.memberId);
    data.append("registrationAs", formData.registrationAs);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (res.ok) {
        setSubmitMessage("User registered successfully!");
        setTimeout(() => {
          router.push("/dashboard/user/view");
        }, 1500);
      } else {
        setSubmitMessage(result.error || "Failed to register user.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="container-fluid relative px-3">
        <div className="layout-specing">
          <div className="md:flex justify-between items-center">
            <h5 className="text-lg font-semibold">Add Users</h5>
            <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
              <li className="inline-block capitalize text-[16px] font-medium duration-500 dark:text-white/70 hover:text-green-600 dark:hover:text-white">
                <Link href="/">101Acres</Link>
              </li>
              <li className="inline-block text-base text-slate-950 dark:text-white/70 mx-0.5">
                <i className="mdi mdi-chevron-right"></i>
              </li>
              <li className="inline-block capitalize text-[16px] font-medium text-green-600 dark:text-white">
                Add Users
              </li>
            </ul>
          </div>

          <div className="container relative mt-6">
            <div className="rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6 bg-white dark:bg-slate-900">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-12 gap-5">
                  <InputField name="name" value={formData.name} onChange={handleChanges} label="Name" colSpan={6} required />
                  <InputField name="email" value={formData.email} onChange={handleChanges} label="Email" type="email" colSpan={6} required />
                  <InputField name="mobile" value={formData.mobile} onChange={handleChanges} label="Mobile" colSpan={6} required />
                  <InputField name="password" value={formData.password} onChange={handleChanges} label="Password" type="password" colSpan={6} required />

                  <SelectField name="countryId" value={formData.countryId} onChange={handleChanges} label="Country" options={countriesList} colSpan={4} />
                  <SelectField name="stateId" value={formData.stateId} onChange={handleChanges} label="State" options={states} colSpan={4} />
                  <SelectField name="cityId" value={formData.cityId} onChange={handleChanges} label="City" options={cities} colSpan={4} />

                  <div className="col-span-12">
                    <label className="font-medium">Address:</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChanges}
                      className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                      placeholder="Address"
                    />
                  </div>

                  <div className="col-span-12">
                    <label className="font-medium">Profile Image:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="form-input mt-2"
                      required
                    />
                    {previewUrl && (
                      <img src={previewUrl} alt="Preview" className="mt-3 w-24 h-24 rounded-full object-cover" />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md mt-5 float-right"
                >
                  {loading ? "Saving..." : "Submit"}
                </button>

                {submitMessage && (
                  <p className="mt-3 text-sm text-green-600">{submitMessage}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// Reusable input component
function InputField({ name, value, onChange, label, type = "text", colSpan = 12, required = false }: any) {
  return (
    <div className={`col-span-${colSpan}`}>
      <label className="font-medium">{label}:</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
        placeholder={label}
        required={required}
      />
    </div>
  );
}

// Reusable select component
function SelectField({ name, value, onChange, label, options, colSpan = 12 }: any) {
  return (
    <div className={`col-span-${colSpan}`}>
      <label className="font-medium">{label}:</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
      >
        <option value="">Select {label}</option>
        {options.map((opt: { id: number; name: string }) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
}

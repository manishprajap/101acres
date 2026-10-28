'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Wrapper from '../../components/wrapper';
import Link from 'next/link';

interface ArticleProperty {
  id: number;
  propertyLocation: string;
  propertyType: string;
  propertyFor: string;
  residentialType: string;
  priceFor: string;
  country: number;
  state: number;
  city: number;
  description: string;
  image: string;
  imageUrl?: string; // ✅ preview
}

const EditProperty = () => {
  const router = useRouter();
  const params = useParams();

  const [property, setProperty] = useState<ArticleProperty | null>(null);
  const [formData, setFormData] = useState<ArticleProperty>({
    id: 0,
    image: '',
    propertyLocation: '',
    propertyType: '',
    propertyFor: '',
    residentialType: '',
    priceFor: '',
    country: 0,
    state: 0,
    city: 0,
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countriesRes = await axios.get('/api/country');
        setCountriesList(countriesRes.data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
    fetchProperty();
  }, []);

  useEffect(() => {
    if (!formData.country) {
      setStates([]);
      setCities([]);
      return;
    }
    const fetchStates = async () => {
      try {
        const response = await axios.get(
          `/api/states?countryId=${formData.country}`
        );
        setStates(response.data);
        setFormData((prev) => ({ ...prev, state: 0, city: 0 }));
      } catch (err) {
        console.error('Error fetching states:', err);
      }
    };
    fetchStates();
  }, [formData.country]);

  useEffect(() => {
    if (!formData.state) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const response = await axios.get(
          `/api/cities?stateId=${formData.state}`
        );
        setCities(response.data);
        setFormData((prev) => ({ ...prev, city: 0 }));
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, [formData.state]);

  const fetchProperty = async () => {
    if (!params?.id) return;
    try {
      const response = await axios.get(`/api/article_property/${params.id}`);
      const propertyData = response.data;
console.log("all data for images:",propertyData);
      let imagesArray: string[] = [];
      try {
        imagesArray = JSON.parse(propertyData.image);
      } catch (e) {
        console.error('Error parsing image field:', e);
      }

      const updatedFormData = {
        ...propertyData,
        country: Number(propertyData.country),
        state: Number(propertyData.state),
        city: Number(propertyData.city),
      };

      setFormData(updatedFormData);
      setProperty(propertyData);
      setUploadedImages(imagesArray);

      // fetch states and cities
      if (propertyData.country) {
        const statesRes = await axios.get(
          `/api/states?countryId=${propertyData.country}`
        );
        setStates(statesRes.data);
      }
      if (propertyData.state) {
        const citiesRes = await axios.get(
          `/api/cities?stateId=${propertyData.state}`
        );
        setCities(citiesRes.data);
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
    }
  };

  const handleChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) {
          newImages.push(URL.createObjectURL(files[i])); // 👈 preview purpose
        }
        const allImages = [...uploadedImages, ...newImages];
        setUploadedImages(allImages);
        setFormData((prev) => ({
          ...prev,
          image: JSON.stringify(allImages),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTextAreaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    setFormData((prev) => ({
      ...prev,
      image: JSON.stringify(newImages),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;

    try {
      setLoading(true);
      await axios.put(`/api/article_property/${params.id}`, formData);
      router.push(`/dashboard/listArticleproperty`);
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return <div>Loading...</div>;
  }

  return (
    <Wrapper>
      <div className="container-fluid relative px-3">
        <div className="layout-specing">
          <div className="md:flex justify-between items-center">
            <h5 className="text-lg font-semibold">Edit Article Property</h5>
            <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
              <li className="inline-block capitalize text-[16px] font-medium duration-500 dark:text-white/70 hover:text-green-600 dark:hover:text-white">
                <Link href="/">101Acres</Link>
              </li>
              <li className="inline-block text-base text-slate-950 dark:text-white/70 mx-0.5">
                <i className="mdi mdi-chevron-right"></i>
              </li>
              <li className="inline-block capitalize text-[16px] font-medium text-green-600 dark:text-white">
                Edit Article Property
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
                      <label className="font-medium">
                        Property Location:
                      </label>
                      <select
                        name="propertyLocation"
                        value={formData.propertyLocation}
                        onChange={handleChange}
                        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2 w-full"
                      >
                        <option value="">Select Type</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Residential">Residential</option>
                      </select>
                    </div>

                    {/* Residential/Commercial Type */}
                    <div className="col-span-4">
                      <label className="font-medium">
                        Commercial/Residential Type:
                      </label>
                      <select
                        name="residentialType"
                        value={formData.residentialType}
                        onChange={handleChange}
                        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2 w-full"
                      >
                        <option value="">Select</option>
                        <option value="Shop">Shop</option>
                        <option value="Office">Office</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Land">Land</option>
                        <option value="Marriage Lawn">Marriage Lawn</option>
                        <option value="House">House</option>
                        <option value="Flat">Flat</option>
                        <option value="Farm House">Farm House</option>
                      </select>
                    </div>

                    {/* Country */}
                    <div className="col-span-4">
                      <label className="font-medium">Country:</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                      >
                        <option value="">Select Country</option>
                        {countriesList.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State */}
                    <div className="col-span-4">
                      <label className="font-medium">State:</label>
                      <select
                        name="state"
                        value={formData.state || ''}
                        onChange={handleChange}
                        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div className="col-span-4">
                      <label className="font-medium">City:</label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-input border !border-gray-200 dark:!border-gray-800 mt-2"
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-span-12">
                      <label className="font-medium">Description:</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleTextAreaChange}
                        className="form-input border !border-gray-200 !h-40 dark:!border-gray-800 mt-2"
                        placeholder="Description"
                      />
                    </div>

                    {/* File upload */}
                    <div className="col-span-12">
                      <label
                        htmlFor="images"
                        className="btn-upload btn bg-blue-600 hover:bg-green-700 text-white rounded-md mt-6 cursor-pointer"
                      >
                        Upload Images
                      </label>

                      <input
                        type="file"
                        id="images"
                        name="images"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleChange}
                      />

                      {uploadedImages.length > 0 && (
                        <div className="mt-4 flex gap-4 flex-wrap">
                          {uploadedImages.map((imgUrl: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={imgUrl}
                                alt={`Property Image ${index + 1}`}
                                className="w-48 h-32 object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn bg-green-600 hover:bg-green-700 text-white rounded-md mt-5"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default EditProperty;

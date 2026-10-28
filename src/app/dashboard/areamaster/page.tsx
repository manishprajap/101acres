'use client';

import React, { useEffect, useState } from 'react';
import Wrapper from '../components/wrapper';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataTable from 'react-data-table-component';
import { Trash2 } from 'lucide-react';

interface Area {
  id: number;
  name: string;
  cityId: number;
}

interface Areas {
  id: number;
  areaName: string;
  countryName: string;
  stateName: string;
  cityName: string;
}

interface City {
  id: number;
  name: string;
  stateId: number;
}

interface State {
  id: number;
  name: string;
  countryId: number;
}

interface Country {
  id: number;
  name: string;
}

const AreaPage = () => {
  const [areas, setAreas] = useState<Areas[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Areas[]>([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cityId: '',
    stateId: '',
    countryId: '',
  });

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    fetchInitialData();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await fetch('/api/country');
      if (res.ok) {
        const data = await res.json();
        setCountries(data || []);
      } else {
        console.error('Failed to fetch countries');
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const areaRes = await fetch('/api/areamaster');
      if (areaRes.ok) {
        const areaData = await areaRes.json();
        setAreas(areaData || []);
        setFilteredAreas(areaData || []);
      } else {
        setMessage('Error fetching areas');
      }
    } catch (err) {
      setMessage('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async (countryId: string) => {
    try {
      const res = await fetch(`/api/states?countryId=${countryId}`);
      if (res.ok) {
        const data = await res.json();
        setStates(data || []);
      } else {
        setStates([]);
      }
    } catch {
      setStates([]);
    }
  };

  const fetchCities = async (stateId: string) => {
    try {
      const res = await fetch(`/api/cities?stateId=${stateId}`);
      if (res.ok) {
        const data = await res.json();
        setCities(data || []);
      } else {
        setCities([]);
      }
    } catch {
      setCities([]);
    }
  };

  useEffect(() => {
    const filtered = areas.filter((area) =>
      area.areaName.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredAreas(filtered);
  }, [filterText, areas]);

  const handleChanges = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'countryId') {
      setFormData((prev) => ({
        ...prev,
        countryId: value,
        stateId: '',
        cityId: '',
      }));
      setStates([]);
      setCities([]);
      if (value) {
        await fetchStates(value);
      }
      return;
    }

    if (name === 'stateId') {
      setFormData((prev) => ({
        ...prev,
        stateId: value,
        cityId: '',
      }));
      setCities([]);
      if (value) {
        await fetchCities(value);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.cityId ||
      !formData.stateId ||
      !formData.countryId
    ) {
      setMessage('Please provide area name, city, state, and country.');
      return;
    }

    try {
      const res = await fetch('/api/areamaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          country_id: parseInt(formData.countryId),
          state_id: parseInt(formData.stateId),
          city_id: parseInt(formData.cityId),
        }),
      });

      if (res.ok) {
        setMessage('Area added successfully.');
        setFormData({ name: '', cityId: '', stateId: '', countryId: '' });
        fetchInitialData();
      } else {
        setMessage('Failed to add area.');
      }
    } catch {
      setMessage('Something went wrong.');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this area?')) return;

    try {
      const res = await fetch(`/api/areamaster/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Area deleted successfully.');
        fetchInitialData();
      } else {
        setMessage('Failed to delete area.');
      }
    } catch {
      setMessage('Something went wrong.');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const columns = [
    { name: 'Area Name', selector: (row: Areas) => row.areaName, sortable: true },
    { name: 'Country Name', selector: (row: Areas) => row.countryName, sortable: true },
    { name: 'State Name', selector: (row: Areas) => row.stateName, sortable: true },
    { name: 'City Name', selector: (row: Areas) => row.cityName, sortable: true },
    {
      name: 'Action',
      cell: (row: Areas) => (
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => handleDelete(row.id)}
          aria-label={`Delete area ${row.areaName}`}
        >
          <Trash2 size={18} />
        </button>
      ),
    },
  ];

  if (!isClient) return <Wrapper><p>Loading...</p></Wrapper>;

  return (
    <Wrapper>
      <div className="layout-specing px-4">
        <div className="md:flex justify-between items-center mb-6">
          <h5 className="text-lg font-semibold">Add New Area</h5>
          <ul className="text-sm">
            <li className="inline-block text-green-600 font-medium">
              <Link href="/">101Acres</Link>
            </li>
            <li className="inline-block mx-1">›</li>
            <li className="inline-block text-green-600">Add Area</li>
          </ul>
        </div>

        <div className="w-full mx-auto bg-white p-6 rounded shadow-md mb-10">
          {message && (
            <div
              className={`mb-4 p-4 rounded text-center ${
                message.toLowerCase().includes('fail') ||
                message.toLowerCase().includes('wrong')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleAddArea} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1" htmlFor="countryId">Country</label>
              <select
                id="countryId"
                name="countryId"
                value={formData.countryId}
                onChange={handleChanges}
                className="border px-3 py-2 w-full rounded"
                required
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1" htmlFor="stateId">State</label>
              <select
                id="stateId"
                name="stateId"
                value={formData.stateId}
                onChange={handleChanges}
                className="border px-3 py-2 w-full rounded"
                required
                disabled={!states.length}
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1" htmlFor="cityId">City</label>
              <select
                id="cityId"
                name="cityId"
                value={formData.cityId}
                onChange={handleChanges}
                className="border px-3 py-2 w-full rounded"
                required
                disabled={!cities.length}
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1" htmlFor="name">Area Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChanges}
                className="border px-3 py-2 w-full rounded"
                placeholder="Enter area name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded float-right hover:bg-green-700"
              >
                Add Area
              </button>
            </div>
          </form>
        </div>

        <div className="mb-4 flex items-center max-w-md">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by area name..."
            className="border px-3 py-2 w-full rounded"
          />
        </div>

        {loading ? (
          <p>Loading areas...</p>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAreas}
            pagination
            striped
            responsive
          />
        )}
      </div>
    </Wrapper>
  );
};

export default AreaPage;

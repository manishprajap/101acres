'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Wrapper from "../components/wrapper";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";

interface PropertiesData {
  id: number | string;
  image: string;
  title: string;
  squareFt: string;
  beds: string;
  baths: string;
  price: string;
  address: string;
  rating: number;
  paymentType: string;
  amount: string;
  remark: string;
  googleLocation: string;
}

export default function Premiumproperty() {
  const [properties, setProperties] = useState<PropertiesData[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertiesData | null>(null);
  const [deletedIds, setDeletedIds] = useState<(number | string)[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        setProperties(data.data || []);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchProperties();
    const deleted = JSON.parse(localStorage.getItem("deletedProperties") || "[]");
    setDeletedIds(deleted);
  }, []);

  const handleEdit = (id: number | string) => {
    router.push(`/dashboard/edit-property/${id}`);
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });

      if (res.ok) {
        const updatedDeleted = [...deletedIds, id];
        setDeletedIds(updatedDeleted);
        localStorage.setItem("deletedProperties", JSON.stringify(updatedDeleted));
      } else {
        const errorData = await res.json();
        console.error("Delete failed:", errorData.error);
      }
    } catch (err) {
      console.error("Error deleting property:", err);
    }
  };

const getParsedImage = (imageStr: string): string => {
  try {
    const parsed = JSON.parse(imageStr);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {
    return imageStr || "";
  }
};
const columns = [
  {
    name: "Image",
    cell: (row: PropertiesData) => {
      const rawImage = getParsedImage(row.image ?? "");
       const imageUrl = rawImage ? `/uploads/${rawImage.replace(/^\/+/, "")}` : "/default-image.jpg";

     return (
        <Image
          src={imageUrl}
          alt={`PropertiesData ${row.title}`}
          width={80}
          height={60}
          className="rounded object-cover"
          unoptimized // ✅ correct for dynamic, external, or API-served images
        />
      );
    },
    sortable: false,
  },
    {
      name: "Title",
      cell: (row: PropertiesData) => row.title,
      sortable: true,
    },
    {
      name: "Price",
      cell: (row: PropertiesData) => `₹${row.price}`,
      sortable: true,
    },
    {
      name: "Property Type",
      cell: () => "Commercial",
    },
    {
      name: "Location Type",
      cell: () => "National",
    },
    {
      name: "Actions",
      cell: (row: PropertiesData) => (
        <div className="flex space-x-2">
          <button onClick={() => setSelectedProperty(row)} className="hover:bg-blue-100 text-blue-600 p-1.5 rounded" title="View">
            <Eye size={16} />
          </button>
          {/* <button onClick={() => handleEdit(row.id)} className="hover:bg-green-100 text-green-600 p-1.5 rounded" title="Edit">
            <Pencil size={16} />
          </button> */}
          <button
            onClick={() => handleDelete(row.id)}
            className="hover:bg-red-100 text-red-600 p-1.5 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <Wrapper>
      <div className="container-fluid relative px-3">
        <div className="layout-specing">
          <div className="md:flex justify-between items-center">
            <h5 className="text-lg font-semibold">Premium Properties</h5>
            <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
              <li className="inline-block capitalize text-[16px] font-medium hover:text-green-600">
                <Link href="/">101 Acers</Link>
              </li>
              <li className="inline-block text-base mx-0.5">›</li>
              <li className="inline-block capitalize text-[16px] font-medium text-green-600">
                Properties
              </li>
            </ul>
          </div>

          
     <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={properties.filter(p => !deletedIds.includes(p.id))}
                  pagination
                  responsive
                  highlightOnHover
                  striped
                  persistTableHead
                  customStyles={{
                    table: {
                      style: {
                        borderCollapse: "collapse",
                        border: "1px solid #ddd",
                      },
                    },
                    headCells: {
                      style: {
                        backgroundColor: "#f7f7f7",
                        border: "1px solid #ddd",
                        padding: "10px",
                        fontWeight: "bold",
                      },
                    },
                    cells: {
                      style: {
                        border: "1px solid #ddd",
                        padding: "10px",
                      },
                    },
                  }}
                />
              </div>

          {/* Modal */}
          {selectedProperty && (
            <div className="fixed inset-0 pl-48 pt-20 bg-black/70 z-50 flex justify-center items-center px-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg relative">
                <h3 className="text-xl font-bold text-center mb-6">Property Details</h3>
                <div className="flex justify-center mb-6">
                 <Image
				  src={
					selectedProperty?.image
					  ? `/uploads/${getParsedImage(selectedProperty.image).replace(/^\/+/, "")}`
					  : "/default-image.jpg"
				  }
				  alt="Property"
				  width={160}
				  height={160}
				  className="rounded-full object-cover border"
				  unoptimized
				/>
                </div>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {selectedProperty.title}</p>
                    <p><strong>Price:</strong> ₹{selectedProperty.price}</p>
                    <p><strong>Property Type:</strong> Commercial</p>
                    <p><strong>Location:</strong> National</p>
                    <p><strong>Square Ft:</strong> {selectedProperty.squareFt}</p>
                    <p><strong>Beds:</strong> {selectedProperty.beds}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Baths:</strong> {selectedProperty.baths}</p>
                    <p><strong>Payment Type:</strong> {selectedProperty.paymentType}</p>
                    <p><strong>Amount:</strong> ₹{selectedProperty.amount}</p>
                    <p><strong>Remark:</strong> {selectedProperty.remark}</p>
                    <p><strong>Address:</strong> {selectedProperty.address}</p>
					<p>
					  <strong>Google Location:</strong>{" "}
					  <a
						href={selectedProperty.googleLocation}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 underline"
					  >
						View on Map
					  </a>
					</p>                 
					</div>
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={async () => {
                      setClosing(true);
                      await new Promise((res) => setTimeout(res, 500));
                      setSelectedProperty(null);
                      setClosing(false);
                    }}
                    className={`flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 ${closing ? "opacity-75 cursor-not-allowed" : ""}`}
                    disabled={closing}
                  >
                    {closing ? "Closing..." : "Close"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

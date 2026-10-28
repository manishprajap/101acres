"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Wrapper from "../components/wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

interface Property {
  description: string;
  area_name: string | null;
  city_name: string | null;
  state_name: string | null;
  country_name: string | null;
  propertyFor: string;
  id: number;
  image?: string;
  propertyType: string;
  propertyLocation: string;
  status: string;
  country: number;
  state: number;
  city: number;
  agentId?: string;
}

const ArticlePropertyListingPageAgent = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Status toggle modal states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [propertyToToggleStatus, setPropertyToToggleStatus] = useState<Property | null>(null);

  const router = useRouter();

  // Sorting on Description column
  const [descSortOrder, setDescSortOrder] = useState<"asc" | "desc" | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // adjust as needed

  const fetchProperties = async () => {
    try {
      const agentId = localStorage.getItem("userId");
      const res = await fetch(`/api/article_property?userId=${agentId}`);
      const data = await res.json();
      setProperties(data.data || []);
      setFilteredProperties(data.data || []);
    } catch (error) {
      console.error("Failed to fetch properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    const message = localStorage.getItem("PropertySuccess");
    if (message) {
      setSuccessMessage(message);
      localStorage.removeItem("PropertySuccess");
    }
  }, []);

  useEffect(() => {
    const filtered = properties.filter((item) =>
      item.propertyType?.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredProperties(filtered);
    setCurrentPage(1); // reset to first page on filter change
  }, [filterText, properties]);

  // Sort filteredProperties by description if sorting is enabled
  const sortedProperties = React.useMemo(() => {
    if (!descSortOrder) return filteredProperties;

    return [...filteredProperties].sort((a, b) => {
      const descA = a.description?.toLowerCase() || "";
      const descB = b.description?.toLowerCase() || "";
      if (descA < descB) return descSortOrder === "asc" ? -1 : 1;
      if (descA > descB) return descSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProperties, descSortOrder]);

  // Pagination: calculate displayed rows
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProperties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);

  const toggleDescSort = () => {
    setDescSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleEdit = (id: number) => router.push(`/dashboard/articleProperty-edit/${id}`);

  // Delete modal open handler
  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteModalOpen(true);
  };

  // Status toggle modal open handler
  const handleStatusToggleClick = (property: Property) => {
    setPropertyToToggleStatus(property);
    setStatusModalOpen(true);
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const res = await fetch(`/api/article_property/${propertyToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProperties();
        setSuccessMessage("Property deleted successfully.");
      } else {
        alert("Failed to delete property.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  // Confirm status toggle handler
  const confirmStatusToggle = async () => {
    if (!propertyToToggleStatus) return;

    const newStatus = propertyToToggleStatus.status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch(`/api/article_property/${propertyToToggleStatus.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchProperties();
        setSuccessMessage(`Property status updated to ${newStatus}.`);
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      alert("Something went wrong while updating status.");
    } finally {
      setStatusModalOpen(false);
      setPropertyToToggleStatus(null);
    }
  };

  const getParsedImage = (imageStr: string): string => {
    try {
      const parsed = JSON.parse(imageStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
      return "";
    } catch {
      return "";
    }
  };

  // Pagination controls
  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
    fetchProperties();

    const message = localStorage.getItem("PropertySuccess");
    if (message) {
      setSuccessMessage(message);
      localStorage.removeItem("PropertySuccess");
    }
  }, []);




  return (
    <Wrapper>
      <div className="container-fluid relative px-3 w-full">
        <div className="layout-specing">
          <div className="md:flex justify-between items-center">
            <h5 className="text-lg font-semibold">List Of Properties</h5>
            <ul className="tracking-[0.5px] inline-block sm:mt-0 mt-3">
              <li className="inline-block capitalize text-[16px] font-medium duration-500 dark:text-white/70 hover:text-green-600 dark:hover:text-white">
                <Link href="/">101Acres</Link>
              </li>
              <li className="inline-block text-base text-slate-950 dark:text-white/70 mx-0.5">
                <i className="mdi mdi-chevron-right"></i>
              </li>
              <li className="inline-block capitalize text-[16px] font-medium text-green-600 dark:text-white">
                View Properties
              </li>
            </ul>
          </div>

          <div className="px-4 py-6 w-full">
            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 text-green-800 rounded text-center">
                {successMessage}
              </div>
            )}

            <input
              type="text"
              placeholder="Filter by property type..."
              className="mb-4 p-2 border rounded w-full max-w-sm"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              aria-label="Filter properties by property type"
            />

            {loading ? (
              <p>Loading...</p>
            ) : sortedProperties.length === 0 ? (
              <p className="text-center text-gray-500">No properties found matching the filter.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-md">
                    <thead>
                      <tr className="bg-gray-100">
                        {/* <th className="border border-gray-300 px-1 py-1">Image</th> */}
                        <th className="px-4 py-3 text-left text-sm font-semibold">Property</th>
                        <th className="px-2 py-3 text-left text-sm font-semibold">Location </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer select-none"
                          onClick={toggleDescSort}
                          aria-sort={
                            descSortOrder === null
                              ? "none"
                              : descSortOrder === "asc"
                                ? "ascending"
                                : "descending"
                          }
                        >
                          Description {descSortOrder === "asc" ? "▲" : descSortOrder === "desc" ? "▼" : ""}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((row) => {
                        // const rawImage = getParsedImage(row.image ?? "");
                        // const imageUrl = rawImage ? `/uploads/${rawImage.replace(/^\/+/, "")}` : "/default-image.jpg";
                        const addressParts = [row.country_name, row.state_name, row.city_name, row.area_name].filter(Boolean);
                        const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "N/A";
                        return (
                          <tr key={row.id} className="hover:bg-gray-50">
                            {/* <td className="border  border-gray-300 flex justify-center items-center">
                              {rawImage ? (
                                <Image
                                  src={imageUrl}
                                  alt={`Property ${row.propertyType}`}
                                  width={70}
                                  height={60}
                                  className="rounded object-cover h-12 my-0.5"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex items-center justify-center h-12 px-2 m-1 border rounded text-gray-500 text-sm">
                                  No Image
                                </div>
                              )}
                            </td> */}
                            <td className="border border-gray-100 text-gray-600 px-1 py-1 text-sm font-semibold ">
                              {[row.propertyType, row.propertyFor].filter(Boolean).join(", ") || "N/A"}
                            </td>
                            <td className="border border-gray-100 text-gray-600 px-1 py-1 text-sm font-semibold ">{row.propertyLocation}</td>
                            <td className="border border-gray-100 text-gray-600 px-1 py-1 text-sm font-semibold ">{fullAddress}</td>
                            <td className="border border-gray-100 text-gray-600 px-1 py-1 text-sm font-semibold ">
                              {(row.description?.length ?? 0) > 20
                                ? row.description.slice(0, 20) + "..."
                                : row.description || "N/A"}
                            </td>
                            <td className="border border-gray-100 text-gray-600 px-1 py-1 text-sm font-semibold ">
                              {userId === "1" ? (
                                <button
                                  onClick={() => handleStatusToggleClick(row)}
                                  className={`text-xs font-semibold px-3 py-1 rounded ${row.status === "Active" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                                    }`}
                                >
                                  {row.status}
                                </button>
                              ) : (
                                // Show plain text or disabled styled button for others
                                <span
                                  className={`text-xs font-semibold px-3 py-1 rounded inline-block ${row.status === "Active" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                                    } `}
                                // aria-disabled="true"
                                >
                                  {row.status}
                                </span>
                              )}
                            </td>

                            <td className="border border-gray-100 text-gray-600 px-1 py-1 text-sm font-semibold ">
                              <div className="flex gap-2">
                                <button
                                  className="text-blue-500 hover:text-blue-700"
                                  onClick={() => handleEdit(row.id)}
                                  title="Edit"
                                  aria-label={`Edit property ${row.id}`}
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-500"
                                  onClick={() => handleDeleteClick(row)}
                                  title="Delete"
                                  aria-label={`Delete property ${row.id}`}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    aria-label="Previous Page"
                  >
                    Prev
                  </button>

                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 border rounded ${page === currentPage ? "bg-green-500 text-white" : ""
                          }`}
                        aria-current={page === currentPage ? "page" : undefined}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    aria-label="Next Page"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && propertyToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteModalTitle"
          aria-describedby="deleteModalDesc"
        >
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
            <h2 id="deleteModalTitle" className="text-xl font-bold mb-4">
              Delete Property
            </h2>
            <p id="deleteModalDesc" className="mb-4">
              Are you sure you want to delete property ?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Confirmation Modal */}
      {statusModalOpen && propertyToToggleStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="statusModalTitle"
          aria-describedby="statusModalDesc"
        >
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
            <h2 id="statusModalTitle" className="text-xl font-bold mb-4">
              Change Property Status
            </h2>
            <p id="statusModalDesc" className="mb-4">
              Are you sure you want to change status of property {" "}
              from <strong>{propertyToToggleStatus.status}</strong> to{" "}
              <strong>{propertyToToggleStatus.status === "Active" ? "Inactive" : "Active"}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={confirmStatusToggle}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
};

export default ArticlePropertyListingPageAgent;

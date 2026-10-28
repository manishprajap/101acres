"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { Eye } from "react-feather";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import Wrapper from "../../components/wrapper";

const UserListingPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  // Days left until a plan's expiry_date (negative/0 = expired)
  const getDaysLeft = (expiryDate: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryDate).getTime();
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const fetchUsers = async () => {
    try {
      const roleFromStorage = localStorage.getItem("role"); // 'admin' or 'agent'
      const userId = localStorage.getItem("userId");

      setRole(roleFromStorage);

      let url = "";
      if (roleFromStorage === "admin") {
        // Admin gets plan info (status/expiry) joined in, for the days-left badge + Activate action
        url = `/api/admin/users-with-plans`;
      } else {
        url = `/api/register?role=${roleFromStorage}`;
        if (roleFromStorage === "agent") {
          url += `&userId=${userId}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();
      const sortedUsers = (data.data || []).sort((a: any, b: any) => b.id - a.id);
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      `${user.name} ${user.email} ${user.mobile}`
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);

  const handleDelete = async (userId: number) => {
    try {
      const confirmed = confirm("Are you sure you want to delete this user?");
      if (!confirmed) return;

      const res = await fetch(`/api/register/${userId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchUsers();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const handleEdit = (userId: number) => {
    router.push(`/dashboard/user/edit/${userId}`);
  };

  const handleView = (userId: number) => {
    const user = users.find((user: any) => user.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowModal(true);
    }
  };

  // Admin-only: activate a user's pending (inactive) plan after verifying payment
  const handleActivate = async (planRowId: number) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Activate this plan?",
      text: "Make sure you've verified the payment screenshot before activating.",
      showCancelButton: true,
      confirmButtonText: "Yes, Activate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/admin/approve-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPlanId: planRowId }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Plan Activated",
          text: "The user's plan has been activated successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchUsers();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data.message || "Failed to activate plan",
        });
      }
    } catch (error) {
      console.error("Failed to activate plan", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while activating the plan.",
      });
    }
  };

  const columns = [
    {
      name: "Image",
      cell: (row: any) =>
        row.image ? (
          <img
            src={row.image}
            alt="User"
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : (
          <span className="text-gray-400">No image</span>
        ),
      width: "80px",
    },
    {
      name: "Name",
      cell: (row: any) => {
        // Days-left badge next to the name — admin view only
        if (role !== "admin" || !row.planExpiry) {
          return <span>{row.name}</span>;
        }
        const daysLeft = getDaysLeft(row.planExpiry);
        const label = daysLeft > 0 ? `${daysLeft}d left` : "expired";
        const colorClass = daysLeft > 0 ? "text-slate-400" : "text-red-500";
        return (
          <span>
            {row.name}{" "}
            <span className={`text-xs ${colorClass}`}>({label})</span>
          </span>
        );
      },
      sortable: true,
      sortFunction: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      name: "Email",
      selector: (row: any) => row.email,
      sortable: true,
    },
    {
      name: "Mobile",
      selector: (row: any) => row.mobile,
      sortable: true,
    },
    ...(role === "admin"
      ? [
          {
            name: "Role",
            selector: (row: any) => row.role,
            sortable: true,
          },
        ]
      : []),
    {
      name: "Address",
      selector: (row: any) => row.address,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: any) => (
        <div className="flex gap-2">
          {role === "admin" && row.planStatus === "inactive" && row.planRowId && (
            <button
              onClick={() => handleActivate(row.planRowId)}
              className="text-emerald-600 hover:text-emerald-800"
              title="Activate Plan"
            >
              <CheckCircle size={18} />
            </button>
          )}
          <button
            onClick={() => handleView(row.id)}
            className="text-green-500 hover:text-green-700"
            title="View"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => handleEdit(row.id)}
            className="text-blue-500 hover:text-blue-700"
            title="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-500 hover:text-red-700"
            title="Delete"
          >
            <Trash2 size={18} />
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
      <div className="mt-8 px-4 md:px-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">User List</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email or mobile..."
            className="w-full md:w-1/3 px-4 py-2 border rounded-md shadow-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          pagination
          highlightOnHover
          pointerOnHover
          responsive
          customStyles={{
            headCells: {
              style: {
                fontWeight: "bold",
                fontSize: "14px",
              },
            },
            rows: {
              style: {
                fontSize: "14px",
                paddingTop: "10px",
                paddingBottom: "10px",
              },
            },
          }}
        />

        {showModal && selectedUser && (
          <UserModal user={selectedUser} onClose={() => setShowModal(false)} />
        )}
      </div>
    </Wrapper>
  );
};

const UserModal = ({ user, onClose }: any) => {
  const [locationNames, setLocationNames] = useState({
    countryName: "",
    stateName: "",
    cityName: "",
  });

  useEffect(() => {
    const fetchLocationNames = async () => {
      try {
        const response = await fetch(
          `/api/location?countryId=${user.country_id}&stateId=${user.state_id}&cityId=${user.city_id}`
        );
        const data = await response.json();
        setLocationNames({
          countryName: data.countryName,
          stateName: data.stateName,
          cityName: data.cityName,
        });
      } catch (error) {
        console.error("Failed to fetch location names", error);
      }
    };

    if (user.country_id && user.state_id && user.city_id) {
      fetchLocationNames();
    }
  }, [user]);

  return (
    <div className="fixed top-0 left-64 right-0 bottom-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6">
        <h2 className="text-2xl font-semibold text-center mb-4">User Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div><span className="font-medium">Name:</span> {user.name}</div>
            <div><span className="font-medium">Email:</span> {user.email}</div>
            <div><span className="font-medium">Mobile:</span> {user.mobile}</div>
            <div><span className="font-medium">Address:</span> {user.address}</div>
            {user.planName && (
              <div><span className="font-medium">Plan:</span> {user.planName} ({user.planStatus})</div>
            )}
          </div>
          <div className="space-y-2">
            <div><span className="font-medium">Country:</span> {locationNames.countryName}</div>
            <div><span className="font-medium">State:</span> {locationNames.stateName}</div>
            <div><span className="font-medium">City:</span> {locationNames.cityName}</div>
            {user.image && (
              <img
                src={user.image}
                alt="User"
                className="w-24 h-24 rounded-full object-cover mt-4"
              />
            )}
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserListingPage;
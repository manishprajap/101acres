"use client";

import { useEffect, useState } from "react";
import Wrapper from "../components/wrapper";
import DataTable from "react-data-table-component";

type Payment = {
  id: number;
  amount: number;
  status: string;
  date: string;
};

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState("view");
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const dummyPayments: Payment[] = [
      { id: 1, amount: 200, status: "Success", date: "2025-05-01" },
      { id: 2, amount: 500, status: "Success", date: "2025-05-02" },
      { id: 3, amount: 300, status: "Failed", date: "2025-05-02" },
    ];

    const filtered = activeTab === "view"
      ? dummyPayments.filter(p => p.status === "Success")
      : dummyPayments.filter(p => p.status === "Failed");

    setPayments(filtered);
  }, [activeTab]);

  const columns = [
    { name: "ID", selector: (row: Payment) => row.id.toString(), sortable: true },
    { name: "Amount", selector: (row: Payment) => `$${row.amount}`, sortable: true },
    { name: "Status", selector: (row: Payment) => row.status, sortable: true },
    { name: "Date", selector: (row: Payment) => row.date, sortable: true },
  ];

  return (
    <Wrapper>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Payment Details</h1>

        <div className="mb-4 flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === "view" ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab("view")}
          >
            View Payment
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === "failed" ? "bg-red-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab("failed")}
          >
            Failed Payment
          </button>
        </div>

        <DataTable
          columns={columns}
          data={payments}
          pagination
          highlightOnHover
          noDataComponent={`No ${activeTab} payment data found.`}
        />
      </div>
    </Wrapper>
  );
}

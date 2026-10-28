"use client";

import { useEffect, useState } from "react";
import Wrapper from "../components/wrapper";
import DataTable, { TableColumn } from "react-data-table-component";

type Property = {
    id: number;
    title: string;
    price: number;
    commission: number;
    agent?: {
        name: string;
        email: string;
    };
};

export default function CommissionPage() {
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        const dummyData: Property[] = [
            {
                id: 1,
                title: "Luxury Villa in Goa",
                price: 15000000,
                commission: 300000,
                agent: {
                    name: "Rohit Sharma",
                    email: "rohit@example.com",
                },
            },
            {
                id: 2,
                title: "2BHK Flat in Mumbai",
                price: 8500000,
                commission: 150000,
                agent: {
                    name: "Priya Mehta",
                    email: "priya@example.com",
                },
            },
            {
                id: 3,
                title: "2BHK Flat in Lucknow",
                price: 6500000,
                commission: 110000,
                agent: {
                    name: "Sita Gupta",
                    email: "sita@example.com",
                },
            },
            {
                id: 4,
                title: "1BHK Flat in Delhi",
                price: 500000,
                commission: 100000,
                agent: {
                    name: "Sunita Mehta",
                    email: "sunita@example.com",
                },
            },
        ];

        setProperties(dummyData);
    }, []);

    const columns: TableColumn<Property>[] = [
        {
            name: "Property",
            selector: row => row.title,
            sortable: true,
        },
        {
            name: "Price",
            selector: row => `$${row.price.toLocaleString()}`,
            sortable: true,
        },
        {
            name: "Commission",
            selector: row => `$${row.commission.toLocaleString()}`,
            sortable: true,
        },
        {
            name: "Agent",
            cell: row => `${row.agent?.name ?? "N/A"} (${row.agent?.email ?? "-"})`,
            sortable: false,
        },
    ];

    return (
        <Wrapper>
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Commission Report</h1>

                <DataTable
                    columns={columns}
                    data={properties}
                    pagination
                    highlightOnHover
                    striped
                    responsive
                    noDataComponent="No commission data found."
                />
            </div>
        </Wrapper>
    );
}

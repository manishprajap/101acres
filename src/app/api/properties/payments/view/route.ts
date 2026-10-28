import { NextResponse } from "next/server";

export async function GET() {
    const dummyPayments = [
        { id: 1, amount: 250, status: "Success", date: "2025-05-01" },
        { id: 2, amount: 500, status: "Success", date: "2025-05-02" },
    ];

    return NextResponse.json(dummyPayments);
}

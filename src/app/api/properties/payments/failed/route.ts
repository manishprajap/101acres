import { NextResponse } from "next/server";

export async function GET() {
    const failedPayments = [
        { id: 3, amount: 150, status: "Failed", date: "2025-04-30" },
        { id: 4, amount: 100, status: "Failed", date: "2025-04-28" },
    ];

    return NextResponse.json(failedPayments);
}

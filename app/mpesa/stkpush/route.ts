import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone, amount, bookingId } = await request.json();

    const required = [
      process.env.MPESA_CONSUMER_KEY,
      process.env.MPESA_CONSUMER_SECRET,
      process.env.MPESA_PASSKEY,
      process.env.MPESA_SHORTCODE,
    ];

    if (required.some((value) => !value)) {
      return NextResponse.json(
        { error: "M-Pesa credentials are missing" },
        { status: 500 }
      );
    }

    if (!phone || !amount || !bookingId) {
      return NextResponse.json(
        { error: "Phone, amount and booking ID are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "M-Pesa credentials found. STK Push setup continues next.",
    });
  } catch {
    return NextResponse.json(
      { error: "Payment request failed" },
      { status: 500 }
    );
  }
}

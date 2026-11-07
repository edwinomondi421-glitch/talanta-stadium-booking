
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone, bookingId } = await request.json();

    if (!phone || !bookingId) {
      return NextResponse.json(
        { error: "Phone and booking ID are required" },
        { status: 400 }
      );
    }

    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE;

    if (!key || !secret || !passkey || !shortcode) {
      return NextResponse.json(
        { error: "M-Pesa credentials are missing" },
        { status: 500 }
      );
    }

    const normalizedPhone = String(phone).replace(/\s+/g, "")
      .replace(/^\+/, "")
      .replace(/^0/, "254");

    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan phone number" },
        { status: 400 }
      );
    }

    // Get the booking amount from the database.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id,total_amount_kes")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const amount = Math.round(Number(booking.total_amount_kes));

    if (!Number.isSafeInteger(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Invalid booking amount" },
        { status: 400 }
      );
    }

    // Get Daraja access token.
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error("Could not obtain M-Pesa access token");
    }

    // Generate Nairobi timestamp.
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

    const get = (type: string) =>
      parts.find((part) => part.type === type)!.value;

    const timestamp =
      get("year") + get("month") + get("day") +
      get("hour") + get("minute") + get("second");

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    // Create transaction record.
    const { data: transaction, error: insertError } =
      await supabase
        .from("mpesa_transactions")
        .insert({
          booking_id: booking.id,
          status: "pending",
        })
        .select("id")
        .single();

    if (insertError || !transaction) {
      throw new Error("Could not create payment record");
    }

    const callbackUrl =
      "https://talanta-stadium-booking.vercel.app/api/mpesa/callback";

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: normalizedPhone,
          PartyB: shortcode,
          PhoneNumber: normalizedPhone,
          CallBackURL: callbackUrl,
          AccountReference: "Talanta",
          TransactionDesc: "Stadium ticket payment",
        }),
      }
    );

    const stkData = await stkResponse.json();

    if (!stkResponse.ok || !stkData.CheckoutRequestID) {
      await supabase
        .from("mpesa_transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id);

      return NextResponse.json(
        { error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed" },
        { status: 502 }
      );
    }

    const { error: updateError } = await supabase
      .from("mpesa_transactions")
      .update({
        checkout_request_id: stkData.CheckoutRequestID,
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Transaction update failed:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Payment request sent to your phone",
      checkoutRequestId: stkData.CheckoutRequestID,
    });

  } catch (error) {
    console.error("M-Pesa STK error:", error);

    return NextResponse.json(
      { error: "Unable to initiate payment" },
      { status: 500 }
    );
  }
            }


import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callback = body.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Invalid callback" }
      );
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const metadata = callback.CallbackMetadata?.Item || [];

    const receipt = metadata.find(
      (item: any) => item.Name === "MpesaReceiptNumber"
    )?.Value;

    // Update the M-Pesa transaction and retrieve its booking ID.
    const { data: transaction, error: transactionError } =
      await supabase
        .from("mpesa_transactions")
        .update({
          status: resultCode === 0 ? "completed" : "failed",
          mpesa_receipt_number: receipt || null,
        })
        .eq("checkout_request_id", checkoutRequestId)
        .select("booking_id")
        .maybeSingle();

    if (transactionError || !transaction) {
      console.error(
        "M-Pesa transaction update failed:",
        transactionError
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // Only mark the booking as paid after successful payment.
    if (resultCode === 0) {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", transaction.booking_id);

      if (bookingError) {
        console.error(
          "Booking payment update failed:",
          bookingError
        );
      }
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });

  } catch (error) {
    console.error("M-Pesa callback error:", error);

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
}

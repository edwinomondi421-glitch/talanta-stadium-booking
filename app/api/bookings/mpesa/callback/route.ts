import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callback = body.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 1 });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    const metadata = callback.CallbackMetadata?.Item || [];

    const receipt = metadata.find(
      (item: any) => item.Name === "MpesaReceiptNumber"
    )?.Value;

    const { error } = await supabase
      .from("mpesa_transactions")
      .update({
        status: resultCode === 0 ? "completed" : "failed",
        mpesa_receipt_number: receipt || null,
      })
      .eq("checkout_request_id", checkoutRequestId);

    if (error) {
      console.error("M-Pesa database error:", error);
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

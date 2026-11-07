
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      customer_phone,
      event_id,
      items,
    } = body;

    if (
      !customer_name?.trim() ||
      !customer_email?.trim() ||
      !customer_phone?.trim() ||
      !event_id ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Please provide all booking details." },
        { status: 400 }
      );
    }

    const validItems = items.every(
      (item: any) =>
        typeof item.ticket_type_id === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 10
    );

    if (!validItems) {
      return NextResponse.json(
        { error: "Invalid ticket selection." },
        { status: 400 }
      );
    }

    const ids = items.map(
      (item: any) => item.ticket_type_id
    );

    if (new Set(ids).size !== ids.length) {
      return NextResponse.json(
        { error: "Duplicate ticket categories." },
        { status: 400 }
      );
    }

    const { data: tickets, error: ticketError } =
      await supabaseAdmin
        .from("ticket_types")
        .select(
          "id, name, price_kes, quantity_total, quantity_sold"
        )
        .eq("event_id", event_id)
        .in("id", ids);

    if (ticketError || !tickets || tickets.length !== items.length) {
      return NextResponse.json(
        { error: "Unable to verify selected tickets." },
        { status: 400 }
      );
    }

    let total = 0;
    const bookingItems = [];

    for (const item of items) {
      const ticket = tickets.find(
        (t) => t.id === item.ticket_type_id
      );

      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket not found." },
          { status: 400 }
        );
      }

      const available =
        Number(ticket.quantity_total) -
        Number(ticket.quantity_sold);

      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Not enough ${ticket.name} tickets available.` },
          { status: 400 }
        );
      }

      const price = Number(ticket.price_kes);
      total += price * item.quantity;

      bookingItems.push({
        ticket_type_id: ticket.id,
        quantity: item.quantity,
        unit_price_kes: price,
      });
    }

    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("bookings")
        .insert({
          customer_name: customer_name.trim(),
          customer_email: customer_email.trim(),
          customer_phone: customer_phone.trim(),
          total_amount_kes: total,
          status: "pending",
        })
        .select("id")
        .single();

    if (bookingError || !booking) {
      throw bookingError || new Error("Booking creation failed.");
    }

    const { error: itemsError } = await supabaseAdmin
      .from("booking_items")
      .insert(
        bookingItems.map((item) => ({
          ...item,
          booking_id: booking.id,
        }))
      );

    if (itemsError) {
      await supabaseAdmin
        .from("bookings")
        .delete()
        .eq("id", booking.id);

      throw itemsError;
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      total_amount_kes: total,
      status: "pending",
    });

  } catch (error) {
    console.error("Booking error:", error);

    return NextResponse.json(
      { error: "Unable to create booking. Please try again." },
      { status: 500 }
    );
  }
            }

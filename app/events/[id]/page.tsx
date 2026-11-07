
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  event_date: string | null;
};

type TicketType = {
  id: string;
  name: string;
  price_kes: number;
  quantity_total: number;
  quantity_sold: number;
};

export default function EventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    async function loadEvent() {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("status", "published")
        .single();

      if (eventError) {
        setErrorMessage("Unable to load this event. Please try again.");
        setLoading(false);
        return;
      }

      const { data: ticketData, error: ticketError } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("price_kes", { ascending: true });

      if (ticketError) {
        setErrorMessage("Unable to load ticket prices. Please try again.");
        setLoading(false);
        return;
      }

      setEvent(eventData as Event);
      setTicketTypes((ticketData || []) as TicketType[]);
      setLoading(false);
    }

    if (eventId) loadEvent();
  }, [eventId]);

  function updateQuantity(ticket: TicketType, amount: number) {
    const available = Math.max(
      0,
      ticket.quantity_total - ticket.quantity_sold
    );

    setQuantities((previous) => ({
      ...previous,
      [ticket.id]: Math.max(
        0,
        Math.min(10, available, (previous[ticket.id] || 0) + amount)
      ),
    }));
  }

  const total = ticketTypes.reduce(
    (sum, ticket) =>
      sum + (quantities[ticket.id] || 0) * Number(ticket.price_kes),
    0
  );

  async function submitBooking() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMessage("Please fill in all your details.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const items = ticketTypes
      .filter((ticket) => (quantities[ticket.id] || 0) > 0)
      .map((ticket) => ({
        ticket_type_id: ticket.id,
        quantity: quantities[ticket.id],
      }));

    if (items.length === 0) {
      setErrorMessage("Please select at least one ticket.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          event_id: eventId,
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Booking failed.");
      }

      setSuccessMessage(
        `Booking created successfully! Reference: ${result.booking_id}. Status: Pending payment. Total: KES ${Number(result.total_amount_kes).toLocaleString()}.`
      );

      setShowCheckout(false);
      setQuantities({});
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main style={{ padding: 30 }}>Loading event...</main>;
  }

  if (errorMessage && !event) {
    return (
      <main style={{ padding: 30 }}>
        <p>{errorMessage}</p>
        <a href="/">← Back to Events</a>
      </main>
    );
  }

  if (!event) return null;

  return (
    <main style={{
      minHeight: "100vh",
      padding: "30px 5%",
      background: "#f5f7f4"
    }}>
      <a href="/" style={{ color: "#123c2d" }}>
        ← Back to Events
      </a>

      <section style={{
        maxWidth: 750,
        margin: "35px auto",
        background: "white",
        padding: 25,
        borderRadius: 15
      }}>
        <h1>Choose Your Tickets</h1>

        <p style={{ marginTop: 12, color: "#69766e" }}>
          Talanta Stadium Booking
        </p>

        <div style={{
          background: "#123c2d",
          color: "white",
          padding: 25,
          borderRadius: 12,
          margin: "25px 0"
        }}>
          <h2>{event.name}</h2>
          <p style={{ marginTop: 12 }}>
            Venue: {event.venue || "Venue to be announced"}
          </p>
          <p style={{ marginTop: 8 }}>
            Date: {event.event_date
              ? new Date(event.event_date).toLocaleDateString()
              : "Coming Soon"}
          </p>
          <p style={{ marginTop: 8 }}>
            {event.description || "Event details coming soon"}
          </p>
        </div>

        <h2>Select Ticket Category</h2>

        {ticketTypes.length === 0 ? (
          <p style={{ marginTop: 15 }}>
            No tickets are currently available for this event.
          </p>
        ) : (
          ticketTypes.map((ticket) => {
            const available = Math.max(
              0,
              ticket.quantity_total - ticket.quantity_sold
            );

            return (
              <div key={ticket.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: "20px 0",
                borderBottom: "1px solid #eeeeee"
              }}>
                <div>
                  <h3>{ticket.name}</h3>
                  <p style={{ color: "#69766e" }}>
                    KES {Number(ticket.price_kes).toLocaleString()}
                  </p>
                  <small style={{ color: "#69766e" }}>
                    {available} tickets available
                  </small>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}>
                  <button
                    onClick={() => updateQuantity(ticket, -1)}
                    disabled={!quantities[ticket.id]}
                    style={{ padding: 8 }}
                  >
                    −
                  </button>

                  <strong>{quantities[ticket.id] || 0}</strong>

                  <button
                    onClick={() => updateQuantity(ticket, 1)}
                    disabled={
                      available === 0 ||
                      (quantities[ticket.id] || 0) >= Math.min(10, available)
                    }
                    style={{ padding: 8 }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}

        <div style={{
          marginTop: 25,
          padding: 20,
          background: "#f5f7f4",
          borderRadius: 10
        }}>
          <h2>Total: KES {total.toLocaleString()}</h2>

          <button
            disabled={total === 0 || submitting}
            onClick={() => {
              setErrorMessage("");
              setSuccessMessage("");
              setShowCheckout(true);
            }}
            style={{
              width: "100%",
              marginTop: 18,
              padding: 15,
              background: "#123c2d",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              opacity: total === 0 ? 0.5 : 1
            }}
          >
            Continue to Checkout
          </button>
        </div>

        {showCheckout && (
          <div style={{
            marginTop: 25,
            padding: 20,
            border: "1px solid #dddddd",
            borderRadius: 10
          }}>
            <h2>Customer Details</h2>

            <input
              placeholder="Full Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: "100%", padding: 13, marginTop: 15 }}
            />

            <input
              type="email"
              placeholder="Email Address"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{ width: "100%", padding: 13, marginTop: 12 }}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: "100%", padding: 13, marginTop: 12 }}
            />

            <button
              onClick={submitBooking}
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: 18,
                padding: 15,
                background: "#123c2d",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold"
              }}
            >
              {submitting ? "Submitting..." : "Submit Booking"}
            </button>

            <button
              onClick={() => setShowCheckout(false)}
              disabled={submitting}
              style={{ width: "100%", padding: 12, marginTop: 10 }}
            >
              Cancel
            </button>
          </div>
        )}

        {errorMessage && (
          <p style={{ color: "red", marginTop: 15 }}>{errorMessage}</p>
        )}

        {successMessage && (
          <p style={{ color: "green", marginTop: 15 }}>
            {successMessage}
          </p>
        )}
      </section>
    </main>
  );
                  }

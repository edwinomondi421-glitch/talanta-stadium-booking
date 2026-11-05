
"use client";

import { useState } from "react";

const ticketTypes = [
  { name: "Regular", price: 500 },
  { name: "VIP", price: 1500 },
  { name: "VVIP", price: 3000 },
];

export default function EventPage() {
  const [quantities, setQuantities] = useState([0, 0, 0]);

  const total = quantities.reduce(
    (sum, quantity, index) =>
      sum + quantity * ticketTypes[index].price,
    0
  );

  function updateQuantity(index: number, amount: number) {
    setQuantities((previous) =>
      previous.map((value, i) =>
        i === index
          ? Math.max(0, Math.min(10, value + amount))
          : value
      )
    );
  }

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
          <h2>Football Match</h2>
          <p style={{ marginTop: 12 }}>
            Venue: Talanta Stadium, Nairobi
          </p>
          <p style={{ marginTop: 8 }}>
            Date: Coming Soon
          </p>
          <p style={{ marginTop: 8 }}>
            Demonstration event
          </p>
        </div>

        <h2>Select Ticket Category</h2>

        {ticketTypes.map((ticket, index) => (
          <div key={ticket.name} style={{
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
                KES {ticket.price.toLocaleString()}
              </p>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <button
                onClick={() => updateQuantity(index, -1)}
                style={{ padding: 8 }}
              >
                −
              </button>

              <strong>{quantities[index]}</strong>

              <button
                onClick={() => updateQuantity(index, 1)}
                style={{ padding: 8 }}
              >
                +
              </button>
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 25,
          padding: 20,
          background: "#f5f7f4",
          borderRadius: 10
        }}>
          <h2>
            Total: KES {total.toLocaleString()}
          </h2>

          <button
            disabled={total === 0}
            onClick={() =>
              alert("Demonstration only. Checkout will be added later.")
            }
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
      </section>
    </main>
  );
          }

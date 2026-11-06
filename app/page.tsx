"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  event_date: string | null;
  status: string;
};

type TicketType = {
  event_id: string;
  price_kes: number;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data: eventData, error: eventError } =
        await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false });

      if (eventError) {
        console.error("Events error:", eventError);
        setLoading(false);
        return;
      }

      const { data: ticketData, error: ticketError } =
        await supabase
          .from("ticket_types")
          .select("event_id, price_kes");

      if (ticketError) {
        console.error("Ticket prices error:", ticketError);
        setLoading(false);
        return;
      }

      const priceMap: Record<string, number> = {};

      (ticketData as TicketType[]).forEach((ticket) => {
        priceMap[ticket.event_id] = Math.min(
          priceMap[ticket.event_id] ?? Infinity,
          Number(ticket.price_kes)
        );
      });

      setEvents(eventData as Event[]);
      setPrices(priceMap);
      setLoading(false);
    }

    loadEvents();
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="container nav-content">
          <a href="/" className="logo">
            TALANTA<span>BOOKING</span>
          </a>

          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="#events">Events</a>
            <a href="#about">About</a>
            <a href="#contact" className="login-button">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-content">
            <p>WELCOME TO TALANTA STADIUM BOOKING</p>

            <h1>
              Your Seat.
              <br />
              Your Experience.
            </h1>

            <p>
              Discover exciting sporting events, football
              matches and entertainment. Explore upcoming
              events and reserve your tickets online.
            </p>

            <a href="#events" className="gold-button">
              Explore Events →
            </a>
          </div>
        </section>

        <section className="section" id="events">
          <div className="container">
            <div className="section-heading">
              <h2>Upcoming Events</h2>
              <span>Discover what's happening</span>
            </div>

            {loading ? (
              <p>Loading events...</p>
            ) : events.length === 0 ? (
              <p>No published events are available yet.</p>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <article className="event-card" key={event.id}>
                    <div className="event-image">
                      {event.name.toUpperCase()}
                    </div>

                    <div className="event-details">
                      <p>{event.description?.split(".")[0] || "EVENT"}</p>
                      <h3>{event.name}</h3>

                      <p>
                        📅{" "}
                        {event.event_date
                          ? new Date(event.event_date).toLocaleDateString()
                          : "Coming Soon"}
                      </p>

                      <p>📍 {event.venue || "Venue to be announced"}</p>

                      <div className="event-price">
                        From{" "}
                        {prices[event.id] !== undefined
                          ? `KES ${prices[event.id].toLocaleString()}`
                          : "Price unavailable"}
                      </div>

                      <a
                        href={`/events/${event.id}`}
                        className="book-button"
                      >
                        Choose Tickets →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section" id="about">
          <div className="container">
            <h2>Experience Every Moment</h2>
            <p style={{ marginTop: 15, lineHeight: 1.8 }}>
              Talanta Stadium Booking is a demonstration
              ticketing platform designed to make event
              discovery and ticket booking simple.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="container">
          <h3>TALANTA STADIUM BOOKING</h3>
          <p>Discover events. Reserve your experience.</p>
          <p>
            © 2026 Talanta Stadium Booking. Demonstration
            platform.
          </p>
        </div>
      </footer>
    </>
  );
}

            

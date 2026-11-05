
const events = [
  {
    id: 1,
    name: "Football Match",
    category: "FOOTBALL",
    date: "Coming Soon",
    venue: "Talanta Stadium, Nairobi",
    price: "KES 500",
  },
  {
    id: 2,
    name: "Music Concert",
    category: "MUSIC",
    date: "Coming Soon",
    venue: "Talanta Stadium, Nairobi",
    price: "KES 1,000",
  },
  {
    id: 3,
    name: "Sports Tournament",
    category: "SPORTS",
    date: "Coming Soon",
    venue: "Talanta Stadium, Nairobi",
    price: "KES 300",
  },
];

export default function Home() {
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

            <div className="events-grid">
              {events.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-image">
                    {event.category}
                  </div>

                  <div className="event-details">
                    <p>{event.category}</p>
                    <h3>{event.name}</h3>

                    <p>📅 {event.date}</p>
                    <p>📍 {event.venue}</p>

                    <div className="event-price">
                      From {event.price}
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
          <p>
            Discover events. Reserve your experience.
          </p>
          <p>
            © 2026 Talanta Stadium Booking. Demonstration
            platform.
          </p>
        </div>
      </footer>
    </>
  );
            }

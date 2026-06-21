import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const items = document.querySelectorAll('.lp-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleBook = (classType?: string) => {
    if (user) {
      if (classType) {
        navigate(`/dashboard/classes?classType=${classType}`);
      } else {
        navigate('/dashboard/classes');
      }
    } else {
      navigate('/login');
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const logoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* ---------- NAV ---------- */}
      <header className="lp-nav" ref={navRef}>
        <button className="lp-logo" onClick={logoClick}>
          AURA<small>STUDIO</small>
        </button>
        <nav className={`lp-links ${menuOpen ? 'lp-open' : ''}`}>
          <button onClick={() => scrollTo('top')}>Home</button>
          <button onClick={() => scrollTo('pilates')}>Pilates</button>
          <button onClick={() => scrollTo('prenatal')}>Prenatal</button>
          <button onClick={() => scrollTo('postpartum')}>Postpartum</button>
          <button onClick={() => scrollTo('approach')}>About</button>
          <button onClick={() => scrollTo('footer')}>Contact</button>
        </nav>
        <button className="lp-btn lp-btn-light" onClick={() => handleBook()}>
          Book a Class
        </button>
        <button
          className="lp-nav-toggle"
          aria-label="Menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          &#9776;
        </button>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="lp-hero" id="top">
        <div className="lp-hero-content lp-reveal">
          <p className="lp-eyebrow">Move with intention</p>
          <h1>Aura Studio</h1>
          <p className="lp-subhead">Pilates for every stage of life</p>
          <button className="lp-btn lp-btn-light" onClick={() => handleBook()}>
            Book a Class
          </button>
        </div>
        <div className="lp-hero-art">
          <svg viewBox="0 0 700 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lp-bg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#352718" />
                <stop offset="100%" stopColor="#4d3b26" />
              </linearGradient>
              <linearGradient id="lp-archGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cdab85" />
                <stop offset="100%" stopColor="#a4815c" />
              </linearGradient>
              <radialGradient id="lp-sphereGrad" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#4a3a28" />
                <stop offset="100%" stopColor="#1c130a" />
              </radialGradient>
              <linearGradient id="lp-floorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a2c1c" />
                <stop offset="100%" stopColor="#241a10" />
              </linearGradient>
            </defs>
            <rect width="700" height="800" fill="url(#lp-bg1)" />
            <rect x="0" y="560" width="700" height="240" fill="url(#lp-floorGrad)" />
            <path
              d="M180 800 L180 360 Q180 180 380 180 Q580 180 580 360 L580 800 Z"
              fill="url(#lp-archGrad)"
              opacity="0.92"
            />
            <path
              d="M250 800 L250 380 Q250 240 380 240 Q510 240 510 380 L510 800 Z"
              fill="url(#lp-bg1)"
            />
            <ellipse cx="468" cy="700" rx="92" ry="92" fill="url(#lp-sphereGrad)" />
            <ellipse cx="468" cy="788" rx="100" ry="14" fill="#140d06" opacity="0.45" />
            <rect x="0" y="0" width="700" height="800" fill="#2a1d12" opacity="0.08" />
          </svg>
        </div>
      </section>

      {/* ---------- PILATES ---------- */}
      <section className="lp-offerings" id="pilates">
        <p className="lp-eyebrow">Our offerings</p>
        <div className="lp-divider" />
        <div className="lp-cards">
          <div className="lp-card lp-reveal">
            <div className="lp-card-image">
              <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lp-p1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3a2c1d" />
                    <stop offset="100%" stopColor="#6e5436" />
                  </linearGradient>
                </defs>
                <rect width="400" height="420" fill="url(#lp-p1)" />
                <circle cx="290" cy="120" r="120" fill="#a4815c" opacity="0.5" />
                <path d="M0 420 L0 300 Q150 250 400 340 L400 420 Z" fill="#241a10" opacity="0.55" />
              </svg>
            </div>
            <h3>Pilates</h3>
            <p>Strengthen, lengthen, and connect through mindful movement.</p>
            <button className="lp-learn" onClick={() => handleBook('PILATES')}>
              Book Pilates &rarr;
            </button>
          </div>

          <div className="lp-card lp-reveal" id="prenatal">
            <div className="lp-card-image">
              <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lp-p2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#46341f" />
                    <stop offset="100%" stopColor="#211609" />
                  </linearGradient>
                </defs>
                <rect width="400" height="420" fill="url(#lp-p2)" />
                <line x1="40" y1="0" x2="220" y2="420" stroke="#cdab85" strokeWidth="3" opacity="0.35" />
                <line x1="90" y1="0" x2="270" y2="420" stroke="#cdab85" strokeWidth="2" opacity="0.2" />
                <line x1="320" y1="0" x2="140" y2="420" stroke="#1a1106" strokeWidth="6" opacity="0.4" />
              </svg>
            </div>
            <h3>Prenatal</h3>
            <p>Support your body and mind through every step of your pregnancy.</p>
            <button className="lp-learn" onClick={() => handleBook('PRENATAL')}>
              Book Prenatal &rarr;
            </button>
          </div>

          <div className="lp-card lp-reveal" id="postpartum">
            <div className="lp-card-image">
              <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lp-p3" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5c4530" />
                    <stop offset="100%" stopColor="#2c2014" />
                  </linearGradient>
                </defs>
                <rect width="400" height="420" fill="url(#lp-p3)" />
                <circle cx="120" cy="320" r="160" fill="#cdab85" opacity="0.28" />
                <rect x="0" y="0" width="400" height="420" fill="#1a1106" opacity="0.15" />
              </svg>
            </div>
            <h3>Postpartum</h3>
            <p>Rebuild, restore and feel strong in your body again.</p>
            <button className="lp-learn" onClick={() => handleBook('POSTPARTUM')}>
              Book Postpartum &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ---------- APPROACH ---------- */}
      <section className="lp-approach" id="approach">
        <div className="lp-approach-text lp-reveal">
          <p className="lp-eyebrow">Our approach</p>
          <h2>
            Mindful movement.
            <br />
            Lasting strength.
            <br />
            Inner balance.
          </h2>
          <p>
            At Aura Studio, we believe Pilates is more than movement — it&apos;s a
            way to reconnect with yourself and create a stronger foundation for
            life.
          </p>
          <button className="lp-btn lp-btn-light" onClick={() => handleBook()}>
            About Aura
          </button>
        </div>
        <div className="lp-approach-art">
          <svg viewBox="0 0 700 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lp-wall" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4a3a26" />
                <stop offset="100%" stopColor="#241a10" />
              </linearGradient>
              <linearGradient id="lp-canvas" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8a6a45" />
                <stop offset="100%" stopColor="#5c4530" />
              </linearGradient>
            </defs>
            <rect width="700" height="700" fill="url(#lp-wall)" />
            <rect x="150" y="120" width="300" height="380" fill="url(#lp-canvas)" />
            <path
              d="M180 480 Q260 250 420 160"
              stroke="#cdab85"
              strokeWidth="10"
              fill="none"
              opacity="0.55"
              strokeLinecap="round"
            />
            <ellipse cx="330" cy="600" rx="60" ry="34" fill="#1a1106" />
            <rect x="300" y="540" width="60" height="70" fill="#1a1106" />
            <line x1="330" y1="540" x2="305" y2="430" stroke="#3a2c1d" strokeWidth="3" />
            <line x1="330" y1="540" x2="350" y2="420" stroke="#3a2c1d" strokeWidth="3" />
            <line x1="330" y1="540" x2="325" y2="450" stroke="#3a2c1d" strokeWidth="2" />
          </svg>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="lp-footer" id="footer">
        <div className="lp-footer-top">
          <div>
            <div className="lp-footer-logo">
              AURA<small>STUDIO</small>
            </div>
          </div>
          <div>
            <h4>Studio</h4>
            <button onClick={() => scrollTo('approach')}>About</button>
            <button onClick={() => scrollTo('approach')}>Our Approach</button>
            <button onClick={() => handleBook()}>Reviews</button>
            <button onClick={() => scrollTo('footer')}>Contact</button>
          </div>
          <div>
            <h4>Follow</h4>
            <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Facebook</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Email</a>
          </div>
          <div>
            <h4>Stay Connected</h4>
            <p>Join our mailing list for updates and offers.</p>
            <form
              className="lp-subscribe"
              onSubmit={(e) => e.preventDefault()}
            >
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" aria-label="Subscribe">
                &rarr;
              </button>
            </form>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Aura Studio. All rights reserved.</p>
          <p>Privacy Policy &middot; Terms &amp; Conditions</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

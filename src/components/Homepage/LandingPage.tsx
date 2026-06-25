import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useSEO();

  // Scroll reveal animation
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

  // Handle hash-based scrolling when navigating from other pages
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  const handleBook = (classType?: string) => {
    if (classType) {
      navigate(`/classes?classType=${classType}`);
    } else {
      navigate('/classes');
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
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
          <img
            src="/images/hero-right-image.PNG"
            alt="Aura Studio hero"
            className="lp-hero-img"
          />
        </div>
      </section>

      {/* ---------- PILATES ---------- */}
      <section className="lp-offerings" id="pilates">
        <p className="lp-eyebrow">Our offerings</p>
        <div className="lp-divider" />
        <div className="lp-cards">
          <div className="lp-card lp-reveal">
            <div className="lp-card-image">
              <img src="/images/Pilates.JPG" alt="Pilates" />
            </div>
            <h3>Pilates</h3>
            <p>Strengthen, lengthen, and connect through mindful movement.</p>
            <button className="lp-learn" onClick={() => handleBook('PILATES')}>
              Book Pilates &rarr;
            </button>
          </div>

          <div className="lp-card lp-reveal" id="prenatal">
            <div className="lp-card-image">
              <img src="/images/Prenatal.JPG" alt="Prenatal" />
            </div>
            <h3>Prenatal</h3>
            <p>Support your body and mind through every step of your pregnancy.</p>
            <button className="lp-learn" onClick={() => handleBook('PRENATAL')}>
              Book Prenatal &rarr;
            </button>
          </div>

          <div className="lp-card lp-reveal" id="postpartum">
            <div className="lp-card-image">
              <img src="/images/Postpartum.JPG" alt="Postpartum" />
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
          <button className="lp-btn lp-btn-light" onClick={() => scrollTo('approach')}>
            About Aura
          </button>
        </div>
        <div className="lp-approach-art">
          <img
            src="/images/about-right-image.PNG"
            alt="Aura Studio approach"
            className="lp-approach-img"
          />
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
          </div>
          <div>
            <h4>Follow</h4>
            <button className="link-button" onClick={(e) => e.preventDefault()}>Instagram</button>
            <button className="link-button" onClick={(e) => e.preventDefault()}>Facebook</button>
            <button className="link-button" onClick={(e) => e.preventDefault()}>Email</button>
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

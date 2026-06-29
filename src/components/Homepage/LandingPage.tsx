import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useSEO();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

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

  const handleBookClass = () => {
    navigate('/classes');
  };

  const handleViewPackages = () => {
    navigate('/packages');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterMessage(data.message || 'Thank you for subscribing!');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="landing-page">
      {/* ---------- HERO ---------- */}
      <section className="lp-hero" id="top">
        <div className="lp-hero-content lp-reveal">
          <p className="lp-subhead">Pilates for Women at every Stage of life</p>
          <button className="lp-btn lp-btn-light" onClick={() => handleBookClass()}>
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
        <p className="lp-eyebrow" style={{ fontWeight: 700 }}>Our Offerings</p>
        <div className="lp-divider" />
        <div className="lp-cards">
          <div className="lp-card lp-reveal">
            <div className="lp-card-image">
              <img src="/images/Pilates.JPG" alt="Pilates" />
            </div>
            <h3>Pilates</h3>
            <p>Strengthen, lengthen, and connect through mindful movement.</p>
            <button className="lp-learn" onClick={() => handleViewPackages()}>
              <strong>View Packages</strong> &rarr;
            </button>
          </div>

          <div className="lp-card lp-reveal" id="prenatal">
            <div className="lp-card-image">
              <img src="/images/Prenatal.JPG" alt="Prenatal" />
            </div>
            <h3>Prenatal</h3>
            <p>Support your body and mind through every step of your pregnancy.</p>
            <button className="lp-learn" onClick={() => handleViewPackages()}>
              <strong>View Packages</strong> &rarr;
            </button>
          </div>

          <div className="lp-card lp-reveal" id="postpartum">
            <div className="lp-card-image">
              <img src="/images/Postpartum.JPG" alt="Postpartum" />
            </div>
            <h3>Postpartum</h3>
            <p>Rebuild, restore and feel strong in your body again.</p>
            <button className="lp-learn" onClick={() => handleViewPackages()}>
              <strong>View Packages</strong> &rarr;
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
              <img src="/images/Aura-footers-head.jpg" alt="Aura Studio" className="lp-footer-logo-img" />
            </div>
          </div>
          <div>
            <h4>Studio</h4>
            <button onClick={() => scrollTo('approach')}>About</button>
            <button onClick={() => scrollTo('approach')}>Our Approach</button>
            <button onClick={() => handleViewPackages()}>Packages</button>
          </div>
          <div>
            <h4>Follow</h4>
            <a
              className="link-button"
              href="https://instagram.com/aurastudioet"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              className="link-button"
              href="https://facebook.com/aurastudio.et"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              className="link-button"
              href="mailto:helengebrehiwot999@gmail.com"
            >
              Email
            </a>
          </div>
          <div>
            <h4>Stay Connected</h4>
            <p>Join our mailing list for updates and offers.</p>
            <form
              className="lp-subscribe"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === 'loading'}
              />
              <button type="submit" aria-label="Subscribe" disabled={newsletterStatus === 'loading'}>
                {newsletterStatus === 'loading' ? '...' : '\u2192'}
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="lp-newsletter-feedback lp-newsletter-success">{newsletterMessage}</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="lp-newsletter-feedback lp-newsletter-error">{newsletterMessage}</p>
            )}
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

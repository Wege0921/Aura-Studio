import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Homepage.css';

interface NavState {
  mobileMenuOpen: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  classType: string;
  availableSpots: number;
  isFullyBooked: boolean;
  price?: number;
}

const classTypeLabels: Record<string, string> = {
  YOGA: 'Yoga',
  PILATES: 'Pilates',
  MEDITATION: 'Meditation',
};

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [navState, setNavState] = React.useState<NavState>({ mobileMenuOpen: false });
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch classes');
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .step, .feature-item, .testimonial-card, .pricing-card, .offer-card, .class-card').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [classes]);

  const scrollToClasses = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('classes');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMobileMenu = () => {
    setNavState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }));
  };

  const closeMobileMenu = () => {
    setNavState({ mobileMenuOpen: false });
  };

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-wrapper">
          <button onClick={() => navigate('/')} className="logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            AURA
          </button>
          <ul className="nav-links">
            <li><a href="#classes">Classes</a></li>
            <li><a href="#schedule">Schedule</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#about">About</a></li>
          </ul>
          <button
            className="cta-button"
            onClick={() => user ? navigate('/dashboard') : navigate('/login')}
          >
            {user ? 'Dashboard' : 'Book Now'}
          </button>
          <button className="hamburger" id="hamburgerBtn" onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div className={`mobile-menu ${navState.mobileMenuOpen ? 'active' : ''}`}>
          <a href="#classes" onClick={closeMobileMenu}>Classes</a>
          <a href="#schedule" onClick={closeMobileMenu}>Schedule</a>
          <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
          <a href="#about" onClick={closeMobileMenu}>About</a>
          <button
            className="cta-button"
            onClick={() => {
              user ? navigate('/dashboard') : navigate('/login');
              closeMobileMenu();
            }}
          >
            {user ? 'Dashboard' : 'Book Now'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <h1>Move. Breathe. Transform.</h1>
          <p>Book your perfect yoga and pilates class with ease. Join our women-only community.</p>
          <div className="hero-buttons">
            <a href="#classes" className="hero-button primary" onClick={scrollToClasses}>
              Book a Class
            </a>
            <a href="#classes" className="hero-button secondary" onClick={scrollToClasses}>
              View Schedule
            </a>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <div className="divider">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M 0 50 Q 300 0, 600 50 T 1200 50 L 1200 100 L 0 100 Z" fill="currentColor"/>
        </svg>
      </div>

      <section className="what-we-offer" id="what-we-offer">
        <div className="container">
          <h2>What We Offer</h2>
          <div className="offer-grid">
            <div className="offer-card fade-in">
              <div className="offer-card-icon">🧘‍♀️</div>
              <h3>Yoga Classes</h3>
              <p>From gentle Hatha to dynamic Vinyasa flows. All levels welcome. Find your rhythm and build strength with intention.</p>
            </div>
            <div className="offer-card fade-in">
              <div className="offer-card-icon">💪</div>
              <h3>Pilates Sessions</h3>
              <p>Reformer and mat pilates that sculpt and strengthen. Core conditioning designed for real results and lasting confidence.</p>
            </div>
            <div className="offer-card fade-in">
              <div className="offer-card-icon">✨</div>
              <h3>Private 1-on-1</h3>
              <p>Personalized sessions tailored to your goals. Work directly with expert instructors in a private, supportive setting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Browse Classes</h3>
                <p>Explore our full schedule of classes. Filter by type, time, and difficulty level to find what suits you best.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Book Your Spot</h3>
                <p>Reserve your place in seconds. Manage your bookings and get instant confirmation right in your account.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Show Up & Flow</h3>
                <p>Arrive, connect with our community, and transform. We handle the logistics so you can focus on you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Class Showcase */}
      <section className="class-showcase" id="classes">
        <div className="container">
          <h2>Explore Our Classes</h2>
          {classesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No upcoming classes available.</div>
          ) : (
            <div className="class-grid">
              {classes.slice(0, 4).map(cls => (
                <div className="class-card fade-in" key={cls.id} onClick={() => navigate('/classes')}>
                  <div className="class-card-image-wrapper">
                    <img
                      src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=300&fit=crop"
                      alt={cls.name}
                      className="class-card-img"
                    />
                  </div>
                  <div className="class-card-content">
                    <div className="class-card-tags">
                      <span className="tag">{classTypeLabels[cls.classType] || cls.classType}</span>
                      <span className="tag">{cls.duration} min</span>
                    </div>
                    <h3>{cls.name}</h3>
                    <p>{cls.description || 'Join us for this class.'}</p>
                    <div className="class-card-meta">
                      <span>🧘 {cls.instructor}</span>
                      <span>📅 {new Date(cls.date).toLocaleDateString()} at {cls.time}</span>
                    </div>
                    <div className="class-card-meta">
                      <span className={cls.isFullyBooked ? 'text-red-500' : ''}>
                        {cls.isFullyBooked ? '🔴 Fully Booked' : `🏃‍♀️ ${cls.availableSpots} spots left`}
                      </span>
                    </div>
                    <button
                      className="class-book-btn"
                      onClick={() => navigate('/classes')}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* App Features */}
      <section className="app-features" id="features">
        <div className="container">
          <h2>Why Choose AURA?</h2>
          <div className="features-list">
            <div className="feature-item fade-in">
              <div className="feature-icon">📱</div>
              <div>
                <h3>Online Booking</h3>
                <p>Book and manage your classes anytime, anywhere with our intuitive app.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">📅</div>
              <div>
                <h3>Schedule Management</h3>
                <p>View your schedule, get updates, and never miss a class you love.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">🔔</div>
              <div>
                <h3>Class Reminders</h3>
                <p>Smart notifications keep you on track and ready to flow.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">📊</div>
              <div>
                <h3>Progress Tracking</h3>
                <p>Track your journey with attendance history and personal milestones.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">👯‍♀️</div>
              <div>
                <h3>Women-Only Community</h3>
                <p>Connect with like-minded women in a supportive, judgment-free space.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">💳</div>
              <div>
                <h3>Flexible Membership</h3>
                <p>Choose from drop-in, monthly, or unlimited plans that fit your lifestyle.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <h2>What Our Members Say</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card fade-in">
              <p className="testimonial-quote">AURA has transformed my relationship with fitness. I feel stronger, calmer, and part of something beautiful.</p>
              <p className="testimonial-author">Sarah M.</p>
              <p className="testimonial-role">Pilates Enthusiast</p>
            </div>
            <div className="testimonial-card fade-in">
              <p className="testimonial-quote">The women-only environment makes all the difference. I can be myself and focus on my practice without distraction.</p>
              <p className="testimonial-author">Jessica L.</p>
              <p className="testimonial-role">Yoga Practitioner</p>
            </div>
            <div className="testimonial-card fade-in">
              <p className="testimonial-quote">Booking classes is so easy, and the instructors are incredibly knowledgeable. This is my happy place.</p>
              <p className="testimonial-author">Rachel T.</p>
              <p className="testimonial-role">Community Member</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="container">
          <h2>Simple, Transparent Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card fade-in">
              <h3>Drop-In</h3>
              <div className="price">3,000</div>
              <div className="price-period">ETB per class</div>
              <ul className="pricing-features">
                <li>✓ Single class access</li>
                <li>✓ All levels welcome</li>
                <li>✓ Book anytime</li>
                <li>✓ No commitment</li>
              </ul>
              <div className="pricing-cta">
                <button
                  className="cta-button"
                  onClick={() => navigate('/packages')}
                >
                  Get Started
                </button>
              </div>
            </div>
            <div className="pricing-card featured fade-in">
              <div className="featured-badge">Most Popular</div>
              <h3>Monthly</h3>
              <div className="price">5,000</div>
              <div className="price-period">ETB per month</div>
              <ul className="pricing-features">
                <li>✓ 8 classes per month</li>
                <li>✓ Roll-over credits</li>
                <li>✓ Priority booking</li>
                <li>✓ Member discounts</li>
              </ul>
              <div className="pricing-cta">
                <button
                  className="cta-button"
                  onClick={() => navigate('/packages')}
                >
                  Subscribe Now
                </button>
              </div>
            </div>
            <div className="pricing-card fade-in">
              <h3>Unlimited</h3>
              <div className="price">10,000</div>
              <div className="price-period">ETB per month</div>
              <ul className="pricing-features">
                <li>✓ Unlimited classes</li>
                <li>✓ Exclusive workshops</li>
                <li>✓ Priority support</li>
                <li>✓ 15% merchandise discount</li>
              </ul>
              <div className="pricing-cta">
                <button
                  className="cta-button"
                  onClick={() => navigate('/packages')}
                >
                  Go Unlimited
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <h2>Ready to Transform Your Practice?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: 0, fontWeight: 300 }}>Begin your journey with AURA today.</p>
        <button
          className="cta-banner-button"
          onClick={() => user ? navigate('/classes') : navigate('/login')}
        >
          Start Your Journey
        </button>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h3>AURA</h3>
            <p>Women-only yoga and pilates studio. Move. Breathe. Transform.</p>
            <div className="social-icons">
              <button className="social-icon" aria-label="Facebook">f</button>
              <button className="social-icon" aria-label="Twitter">𝕏</button>
              <button className="social-icon" aria-label="Instagram">i</button>
            </div>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#classes">Classes</a></li>
              <li><a href="#schedule">Schedule</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Studio</h3>
            <ul>
              <li><button className="footer-link">About Us</button></li>
              <li><button className="footer-link">Instructors</button></li>
              <li><button className="footer-link">Contact</button></li>
              <li><button className="footer-link">Careers</button></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Support</h3>
            <ul>
              <li><button className="footer-link">FAQ</button></li>
              <li><button className="footer-link">Privacy Policy</button></li>
              <li><button className="footer-link">Terms of Service</button></li>
              <li><button className="footer-link">Accessibility</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AURA Yoga & Pilates Studio. All rights reserved. Women-only wellness space.</p>
        </div>
      </footer>
    </>
  );
};

export default Homepage;

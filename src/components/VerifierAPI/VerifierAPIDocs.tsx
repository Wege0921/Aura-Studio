import React, { useEffect, useState } from 'react';
import { useSEO } from '../../hooks/useSEO';
import './VerifierAPIDocs.css';

const ENDPOINTS = [
  { method: 'POST', path: '/verify', auth: 'API Key', desc: 'Universal Verification (Smart Router) — auto-detects provider' },
  { method: 'POST', path: '/verify-cbe', auth: 'API Key', desc: 'Verifies CBE transactions via reference + suffix' },
  { method: 'POST', path: '/verify-telebirr', auth: 'API Key', desc: 'Verifies Telebirr mobile money via reference' },
  { method: 'POST', path: '/verify-dashen', auth: 'API Key', desc: 'Verifies Dashen Bank transactions via reference' },
  { method: 'POST', path: '/verify-abyssinia', auth: 'API Key', desc: 'Verifies Bank of Abyssinia via reference + suffix' },
  { method: 'POST', path: '/verify-cbebirr', auth: 'API Key', desc: 'Verifies CBE Birr via receipt + phone' },
  { method: 'POST', path: '/verify-mpesa', auth: 'API Key', desc: 'Verifies M-Pesa via receipt + phone' },
  { method: 'POST', path: '/verify-image', auth: 'API Key', desc: 'Uploads receipt image, uses OCR to verify' },
  { method: 'GET', path: '/health', auth: 'Free', desc: 'Health check — no auth required' },
  { method: 'GET', path: '/', auth: 'Free', desc: 'API metadata and version info' },
];

const ADMIN_ENDPOINTS = [
  { method: 'POST', path: '/admin/api-keys', auth: 'Admin', desc: 'Creates a new API key for a user' },
  { method: 'GET', path: '/admin/stats', auth: 'Admin', desc: 'Retrieves API usage statistics' },
];

const VerifierAPIDocs: React.FC = () => {
  useSEO({ title: 'Verifier API — Payment Verification for Ethiopia' });

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const items = document.querySelectorAll('.va-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('va-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="verifier-page">

      {/* ——— HERO ——— */}
      <section className="va-hero">
        <h1>Verifier API</h1>
        <p>
          Verify CBE, Telebirr, Dashen, Abyssinia, CBEBirr, and M-Pesa
          transactions with ease.
        </p>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#overview" className="va-btn va-btn-primary">
            Get an API Key
          </a>
          <a href="#endpoints" className="va-btn va-btn-outline">
            View Endpoints
          </a>
        </div>
        <div className="va-hero-badges">
          <span>CBE</span>
          <span>Telebirr</span>
          <span>Dashen</span>
          <span>Abyssinia</span>
          <span>CBEBirr</span>
          <span>M-Pesa</span>
        </div>
      </section>

      {/* ——— OVERVIEW ——— */}
      <section className="va-section va-reveal" id="overview">
        <p className="va-eyebrow">Overview</p>
        <h2>What is the Verifier API?</h2>
        <p className="va-subtitle">
          Automate payment verification for Ethiopian financial services.
        </p>
        <p>
          The Verifier API allows developers in Ethiopia to verify CBE, Telebirr, Dashen,
          Abyssinia, and CBEBirr payments via reference number or receipt image. It uses
          web scraping and AI-based OCR to extract transaction details, providing a reliable
          way to confirm payment status for your applications.
        </p>
        <p>
          With this API, you can automate payment verification processes, reduce manual checks,
          and integrate payment confirmation into your digital services, e-commerce platforms,
          or financial applications.
        </p>
      </section>

      {/* ——— AUTHENTICATION ——— */}
      <section className="va-section va-section-alt va-reveal" id="authentication">
        <p className="va-eyebrow">Authentication</p>
        <h2>API Key Authentication</h2>
        <p className="va-subtitle">
          All verification endpoints require an API key. Obtain yours from the dashboard.
        </p>
        <p>There are two ways to include your API key in requests:</p>
        <div className="va-info-card">
          <h4>1. HTTP Header (Recommended)</h4>
          <p><code>x-api-key: YOUR_API_KEY</code></p>
        </div>
        <div className="va-info-card">
          <h4>2. Query Parameter</h4>
          <p><code>https://verifyapi.leulzenebe.pro/verify-telebirr?apiKey=YOUR_API_KEY</code></p>
        </div>
      </section>

      {/* ——— ENDPOINTS ——— */}
      <section className="va-section va-reveal" id="endpoints">
        <p className="va-eyebrow">Endpoints</p>
        <h2>API Endpoints</h2>
        <p className="va-subtitle">
          All live endpoints available for payment verification.
        </p>
        <div className="va-endpoints">
          {ENDPOINTS.map((ep, i) => (
            <div className="va-endpoint" key={i}>
              <span className={`va-method va-method-${ep.method.toLowerCase()}`}>
                {ep.method}
              </span>
              <span className="va-endpoint-path">{ep.path}</span>
              <span className={`va-badge ${ep.auth === 'Free' ? 'va-badge-free' : ''}`}>
                {ep.auth}
              </span>
              <span className="va-endpoint-desc">{ep.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ——— SAMPLE REQUESTS ——— */}
      <section className="va-section va-section-alt va-reveal" id="samples">
        <p className="va-eyebrow">Sample Requests</p>
        <h2>Try It Out</h2>
        <p className="va-subtitle">
          Example cURL requests for different providers.
        </p>

        <div className="va-tabs">
          {['Universal', 'CBE', 'Telebirr', 'Image Upload', 'M-Pesa'].map((label, i) => (
            <button
              key={i}
              className={`va-tab ${activeTab === i ? 'va-active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="va-code">
{`<span class="va-cmd">curl -X POST</span> https://verifyapi.leulzenebe.pro/verify \
  -H <span class="va-str">"Content-Type: application/json"</span> \
  -H <span class="va-str">"x-api-key: YOUR_API_KEY"</span> \
  -d <span class="va-str">'{
    "reference": "FT253089F68Z",
    "suffix": "16825193"
  }'</span>`}
          </div>
        )}
        {activeTab === 1 && (
          <div className="va-code">
{`<span class="va-cmd">curl -X POST</span> https://verifyapi.leulzenebe.pro/verify-cbe \
  -H <span class="va-str">"Content-Type: application/json"</span> \
  -H <span class="va-str">"x-api-key: YOUR_API_KEY"</span> \
  -d <span class="va-str">'{
    "reference": "FT253089F68Z",
    "suffix": "16825193"
  }'</span>`}
          </div>
        )}
        {activeTab === 2 && (
          <div className="va-code">
{`<span class="va-cmd">curl -X POST</span> https://verifyapi.leulzenebe.pro/verify-telebirr \
  -H <span class="va-str">"Content-Type: application/json"</span> \
  -H <span class="va-str">"x-api-key: YOUR_API_KEY"</span> \
  -d <span class="va-str">'{
    "reference": "R-1234567890"
  }'</span>`}
          </div>
        )}
        {activeTab === 3 && (
          <div className="va-code">
{`<span class="va-cmd">curl -X POST</span> https://verifyapi.leulzenebe.pro/verify-image \
  -H <span class="va-str">"x-api-key: YOUR_API_KEY"</span> \
  -F <span class="va-str">"image=@/path/to/receipt.jpg"</span> \
  -F <span class="va-str">"suffix=16825193"</span>`}
          </div>
        )}
        {activeTab === 4 && (
          <div className="va-code">
{`<span class="va-cmd">curl -X POST</span> https://verifyapi.leulzenebe.pro/verify-mpesa \
  -H <span class="va-str">"Content-Type: application/json"</span> \
  -H <span class="va-str">"x-api-key: YOUR_API_KEY"</span> \
  -d <span class="va-str">'{
    "reference": "MPESA-REF-123",
    "phoneNumber": "251912345678"
  }'</span>`}
          </div>
        )}
      </section>

      {/* ——— ENVIRONMENT ——— */}
      <section className="va-section va-reveal" id="environment">
        <p className="va-eyebrow">Environment</p>
        <h2>Regional Configuration</h2>
        <p className="va-subtitle">
          The Verifier API interacts with Telebirr and CBE systems with regional restrictions.
        </p>
        <div className="va-info-card">
          <h4>Regional Restrictions</h4>
          <p>
            Telebirr verification only works reliably from Ethiopia. Foreign servers may be
            blocked by Telebirr endpoints. Use Ethio Telecom hosting or enable fallback proxy
            in your configuration.
          </p>
        </div>
        <div className="va-info-card">
          <h4>Configuration Options</h4>
          <p>Configure API behavior with environment variables:</p>
          <div className="va-code">
{`<span class="va-comment"># .env file example</span>
SKIP_PRIMARY_VERIFICATION=<span class="va-str">true</span>  <span class="va-comment"># Use fallback proxy for verification</span>
VERIFY_API_KEY=<span class="va-str">your_api_key</span>`}
          </div>
        </div>
      </section>

      {/* ——— ADMIN ENDPOINTS ——— */}
      <section className="va-section va-section-alt va-reveal" id="admin">
        <p className="va-eyebrow">Admin Endpoints</p>
        <h2>Administration</h2>
        <p className="va-subtitle">
          Restricted endpoints for API key and usage management.
        </p>
        <div className="va-endpoints">
          {ADMIN_ENDPOINTS.map((ep, i) => (
            <div className="va-endpoint" key={i}>
              <span className={`va-method va-method-${ep.method.toLowerCase()}`}>
                {ep.method}
              </span>
              <span className="va-endpoint-path">{ep.path}</span>
              <span className="va-badge va-badge-admin">{ep.auth}</span>
              <span className="va-endpoint-desc">{ep.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ——— SUPPORT ——— */}
      <section className="va-section va-reveal" id="support">
        <p className="va-eyebrow">Support</p>
        <h2>Get Help</h2>
        <p className="va-subtitle">
          Maintained by Leul Zenebe, Creofam LLC.
        </p>
        <div className="va-support-grid">
          <div className="va-support-card">
            <h4>Developer Website</h4>
            <p><a href="https://leulzenebe.pro" target="_blank" rel="noopener noreferrer">leulzenebe.pro</a></p>
          </div>
          <div className="va-support-card">
            <h4>Email Support</h4>
            <p><a href="mailto:me@leulzenebe.pro">me@leulzenebe.pro</a></p>
          </div>
          <div className="va-support-card">
            <h4>GitHub</h4>
            <p>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                View Repository
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="va-page-footer">
        <p>&copy; {new Date().getFullYear()} Verifier API — Creofam LLC. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VerifierAPIDocs;

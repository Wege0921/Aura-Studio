import React from 'react';
import { useSEO } from '../../hooks/useSEO';

const ContactPage: React.FC = () => {
  useSEO({ title: 'Contact — AURA Studio', description: 'Contact AURA Studio in Addis Ababa. Reach us via phone, Telegram, or TikTok.', canonicalPath: '/contact' });
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-umber p-6 md:p-8">
        <h1 className="text-2xl font-bold text-aura-cream mb-2">Contact Us</h1>
        <p className="text-aura-sand mb-6">Reach out to us directly. We would love to hear from you!</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Instagram */}
          <a
            href="https://instagram.com/aurastudioet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-aura-cream font-semibold text-sm">Instagram</h3>
              <p className="text-purple-400 text-xs">@aurastudioet</p>
            </div>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com/@aurastudioet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-black/40 to-red-900/20 border border-red-500/20 hover:border-red-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-aura-cream font-semibold text-sm">TikTok</h3>
              <p className="text-red-400 text-xs">@aurastudioet</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/251900410603"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/20 hover:border-green-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-aura-cream font-semibold text-sm">WhatsApp</h3>
              <p className="text-green-400 text-xs">+251 900 410 603</p>
            </div>
          </a>
        </div>
      </div>

      <div className="bg-aura-ink rounded-xl border border-aura-umber p-6">
        <h2 className="text-lg font-semibold text-aura-cream mb-3">Studio Info</h2>
        <div className="text-sm text-aura-sand space-y-2">
          <p>📍 Addis Ababa, Ethiopia</p>
          <p>📞 +251 900 410 603</p>
          <div className="flex gap-4 mt-3">
            <a href="https://instagram.com/aurastudioet" target="_blank" rel="noopener noreferrer" className="text-aura-sand hover:text-aura-cream transition-colors">
              Instagram
            </a>
            <a href="https://tiktok.com/@aurastudioet" target="_blank" rel="noopener noreferrer" className="text-aura-sand hover:text-aura-cream transition-colors">
              TikTok
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

import React, { useState, useEffect } from 'react';

type SectionTab = 'hero' | 'general' | 'footer' | 'approach' | 'offerings';

interface SectionState {
  data: Record<string, any>;
  loading: boolean;
  saving: boolean;
  message: string;
}

const initialSectionState: SectionState = {
  data: {},
  loading: true,
  saving: false,
  message: '',
};

const SiteContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SectionTab>('hero');
  const [sections, setSections] = useState<Record<SectionTab, SectionState>>({
    hero: { ...initialSectionState },
    general: { ...initialSectionState },
    footer: { ...initialSectionState },
    approach: { ...initialSectionState },
    offerings: { ...initialSectionState },
  });

  useEffect(() => {
    fetchSection(activeTab);
  }, [activeTab]);

  const fetchSection = async (tab: SectionTab) => {
    setSections((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], loading: true, message: '' },
    }));

    try {
      const res = await fetch(`/api/site-content/${tab}`);
      if (res.ok) {
        const data = await res.json();
        setSections((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], data, loading: false },
        }));
      } else {
        setSections((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], loading: false, data: {} },
        }));
      }
    } catch {
      setSections((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: false, data: {} },
      }));
    }
  };

  const updateField = (tab: SectionTab, field: string, value: any) => {
    setSections((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        data: { ...prev[tab].data, [field]: value },
      },
    }));
  };

  const handleSave = async (tab: SectionTab) => {
    setSections((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], saving: true, message: '' },
    }));

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/site-content/admin/${tab}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sections[tab].data),
      });

      if (res.ok) {
        setSections((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], saving: false, message: 'Saved successfully' },
        }));
      } else {
        const err = await res.json();
        setSections((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], saving: false, message: err.error || 'Failed to save' },
        }));
      }
    } catch {
      setSections((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], saving: false, message: 'Network error' },
      }));
    }
  };

  const handleImageUpload = async (tab: SectionTab, field: string, file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`/api/site-content/admin/${tab}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        updateField(tab, field, url);
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    }
  };

  const section = sections[activeTab];

  const tabs: { id: SectionTab; label: string }[] = [
    { id: 'hero', label: 'Hero' },
    { id: 'general', label: 'General' },
    { id: 'footer', label: 'Footer' },
    { id: 'approach', label: 'Approach' },
    { id: 'offerings', label: 'Offerings' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-aura-ivory font-serif">Site Content</h2>
        <p className="text-aura-sand/70 text-sm mt-1">
          Edit content displayed on the public landing page, header, and footer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-aura-umber mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-aura-ivory border-b-2 border-aura-umber'
                : 'text-aura-sand/60 hover:text-aura-sand'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section.loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-umber" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'hero' && (
            <HeroForm data={section.data} onChange={(f, v) => updateField('hero', f, v)} onImageUpload={(f, file) => handleImageUpload('hero', f, file)} />
          )}
          {activeTab === 'general' && (
            <GeneralForm data={section.data} onChange={(f, v) => updateField('general', f, v)} onImageUpload={(f, file) => handleImageUpload('general', f, file)} />
          )}
          {activeTab === 'footer' && (
            <FooterForm data={section.data} onChange={(f, v) => updateField('footer', f, v)} onImageUpload={(f, file) => handleImageUpload('footer', f, file)} />
          )}
          {activeTab === 'approach' && (
            <ApproachForm data={section.data} onChange={(f, v) => updateField('approach', f, v)} onImageUpload={(f, file) => handleImageUpload('approach', f, file)} />
          )}
          {activeTab === 'offerings' && (
            <OfferingsForm data={section.data} onChange={(f, v) => updateField('offerings', f, v)} onImageUpload={(f, file) => handleImageUpload('offerings', f, file)} />
          )}

          {section.message && (
            <p className={`text-sm ${section.message === 'Saved successfully' ? 'text-green-400' : 'text-red-400'}`}>
              {section.message}
            </p>
          )}

          <div className="pt-4 border-t border-aura-umber">
            <button
              onClick={() => handleSave(activeTab)}
              disabled={section.saving}
              className="px-6 py-2.5 bg-aura-sand text-aura-ink rounded-lg hover:bg-aura-sand/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              {section.saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-aura-ink" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Image Upload Field ─── */
const ImageField: React.FC<{
  label: string;
  value: string;
  onChange: (field: string, file: File) => void;
  field: string;
}> = ({ label, value, onChange, field }) => (
  <div>
    <label className="block text-sm font-medium text-aura-sand mb-1">{label}</label>
    {value && (
      <img src={value} alt={label} className="h-28 w-auto rounded-lg object-cover mb-2 border border-aura-umber" />
    )}
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onChange(field, file);
      }}
      className="block w-full text-sm text-aura-sand/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-aura-sand/10 file:text-aura-sand hover:file:bg-aura-sand/20"
    />
    {value && (
      <p className="text-xs text-aura-sand/50 mt-1 truncate">{value}</p>
    )}
  </div>
);

/* ─── Text Input ─── */
const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, multiline, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-aura-sand mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text focus:outline-none focus:ring-2 focus:ring-aura-sand text-sm"
      />
    ) : (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text focus:outline-none focus:ring-2 focus:ring-aura-sand text-sm"
      />
    )}
  </div>
);

/* ─── Forms ─── */

const HeroForm: React.FC<{
  data: any;
  onChange: (field: string, value: any) => void;
  onImageUpload: (field: string, file: File) => void;
}> = ({ data, onChange, onImageUpload }) => (
  <div className="space-y-4">
    <TextField label="Sub-headline" value={data.subhead || ''} onChange={(v) => onChange('subhead', v)} placeholder="e.g. Pilates for Women at every Stage of life" />
    <TextField label="CTA Text" value={data.ctaText || ''} onChange={(v) => onChange('ctaText', v)} placeholder="e.g. Book a Class" />
    <ImageField label="Hero Image" value={data.heroImageUrl || ''} onChange={onImageUpload} field="heroImageUrl" />
  </div>
);

const GeneralForm: React.FC<{
  data: any;
  onChange: (field: string, value: any) => void;
  onImageUpload: (field: string, file: File) => void;
}> = ({ data, onChange, onImageUpload }) => (
  <div className="space-y-4">
    <TextField label="Site Name" value={data.siteName || ''} onChange={(v) => onChange('siteName', v)} placeholder="e.g. AURA Studio" />
    <TextField label="Tagline" value={data.tagline || ''} onChange={(v) => onChange('tagline', v)} placeholder="e.g. Pilates for women at every stage of life" />
    <ImageField label="Header Logo" value={data.logoUrl || ''} onChange={onImageUpload} field="logoUrl" />
  </div>
);

const FooterForm: React.FC<{
  data: any;
  onChange: (field: string, value: any) => void;
  onImageUpload: (field: string, file: File) => void;
}> = ({ data, onChange, onImageUpload }) => {
  const socialLinks = data.socialLinks || [];
  const quickLinks = data.quickLinks || [];

  const updateSocial = (idx: number, field: string, value: string) => {
    const updated = [...socialLinks];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange('socialLinks', updated);
  };

  const addSocial = () => {
    onChange('socialLinks', [...socialLinks, { platform: '', url: '', label: '' }]);
  };

  const removeSocial = (idx: number) => {
    onChange('socialLinks', socialLinks.filter((_: any, i: number) => i !== idx));
  };

  const updateQuickLink = (idx: number, field: string, value: string) => {
    const updated = [...quickLinks];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange('quickLinks', updated);
  };

  const addQuickLink = () => {
    onChange('quickLinks', [...quickLinks, { label: '', sectionId: '' }]);
  };

  const removeQuickLink = (idx: number) => {
    onChange('quickLinks', quickLinks.filter((_: any, i: number) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <TextField label="About Text" value={data.aboutText || ''} onChange={(v) => onChange('aboutText', v)} multiline placeholder="Short description for the footer" />
      <TextField label="Copyright Text" value={data.copyright || ''} onChange={(v) => onChange('copyright', v)} placeholder="e.g. &copy; 2024 Aura Studio. All rights reserved." />
      <ImageField label="Footer Logo" value={data.footerLogoUrl || ''} onChange={onImageUpload} field="footerLogoUrl" />

      {/* Quick Links */}
      <div>
        <label className="block text-sm font-medium text-aura-sand mb-2">Quick Links</label>
        {quickLinks.map((link: any, idx: number) => (
          <div key={idx} className="flex gap-2 mb-2 items-start">
            <input
              type="text"
              value={link.label || ''}
              onChange={(e) => updateQuickLink(idx, 'label', e.target.value)}
              placeholder="Label"
              className="flex-1 px-3 py-1.5 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text text-sm focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
            <input
              type="text"
              value={link.sectionId || ''}
              onChange={(e) => updateQuickLink(idx, 'sectionId', e.target.value)}
              placeholder="Section ID (e.g. approach)"
              className="flex-1 px-3 py-1.5 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text text-sm focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
            <button onClick={() => removeQuickLink(idx)} className="text-red-400 hover:text-red-300 px-2 py-1 text-sm">Remove</button>
          </div>
        ))}
        <button onClick={addQuickLink} className="text-aura-sand hover:text-aura-ivory text-sm">+ Add Link</button>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium text-aura-sand mb-2">Social Links</label>
        {socialLinks.map((link: any, idx: number) => (
          <div key={idx} className="flex gap-2 mb-2 items-start">
            <input
              type="text"
              value={link.platform || ''}
              onChange={(e) => updateSocial(idx, 'platform', e.target.value)}
              placeholder="Platform (e.g. Instagram)"
              className="flex-1 px-3 py-1.5 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text text-sm focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
            <input
              type="text"
              value={link.url || ''}
              onChange={(e) => updateSocial(idx, 'url', e.target.value)}
              placeholder="URL"
              className="flex-1 px-3 py-1.5 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text text-sm focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
            <input
              type="text"
              value={link.label || ''}
              onChange={(e) => updateSocial(idx, 'label', e.target.value)}
              placeholder="Link text"
              className="flex-1 px-3 py-1.5 bg-aura-bg-card border border-aura-umber rounded-lg text-aura-text text-sm focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
            <button onClick={() => removeSocial(idx)} className="text-red-400 hover:text-red-300 px-2 py-1 text-sm">Remove</button>
          </div>
        ))}
        <button onClick={addSocial} className="text-aura-sand hover:text-aura-ivory text-sm">+ Add Social Link</button>
      </div>
    </div>
  );
};

const ApproachForm: React.FC<{
  data: any;
  onChange: (field: string, value: any) => void;
  onImageUpload: (field: string, file: File) => void;
}> = ({ data, onChange, onImageUpload }) => (
  <div className="space-y-4">
    <TextField label="Headline" value={data.headline || ''} onChange={(v) => onChange('headline', v)} multiline placeholder="Line 1\nLine 2\nLine 3" />
    <TextField label="Description" value={data.description || ''} onChange={(v) => onChange('description', v)} multiline placeholder="About your approach..." />
    <TextField label="CTA Text" value={data.ctaText || ''} onChange={(v) => onChange('ctaText', v)} placeholder="e.g. About Aura" />
    <ImageField label="Approach Image" value={data.imageUrl || ''} onChange={onImageUpload} field="imageUrl" />
  </div>
);

const OfferingsForm: React.FC<{
  data: any;
  onChange: (field: string, value: any) => void;
  onImageUpload: (field: string, file: File) => void;
}> = ({ data, onChange, onImageUpload }) => {
  const cards = data.cards || [];

  const updateCard = (idx: number, field: string, value: string) => {
    const updated = [...cards];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange('cards', updated);
  };

  const addCard = () => {
    onChange('cards', [...cards, { id: `card-${Date.now()}`, title: '', description: '', imageUrl: '', classType: '' }]);
  };

  const removeCard = (idx: number) => {
    onChange('cards', cards.filter((_: any, i: number) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {cards.map((card: any, idx: number) => (
        <div key={card.id || idx} className="border border-aura-umber rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-aura-ivory">Card {idx + 1}</h4>
            <button onClick={() => removeCard(idx)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
          </div>
          <TextField label="Title" value={card.title || ''} onChange={(v) => updateCard(idx, 'title', v)} placeholder="e.g. Pilates" />
          <TextField label="Description" value={card.description || ''} onChange={(v) => updateCard(idx, 'description', v)} multiline placeholder="Short description..." />
          <TextField label="Class Type" value={card.classType || ''} onChange={(v) => updateCard(idx, 'classType', v)} placeholder="e.g. PILATES" />
          <ImageField label="Card Image" value={card.imageUrl || ''} onChange={(f, file) => onImageUpload(`offerings-${idx}-image`, file)} field={`offerings-${idx}-image`} />
        </div>
      ))}
      <button onClick={addCard} className="text-aura-sand hover:text-aura-ivory text-sm">+ Add Offering Card</button>
    </div>
  );
};

export default SiteContentManagement;

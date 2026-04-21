import React from 'react';
import { Settings as SettingsIcon, Link2, User, Bell } from 'lucide-react';
import { MERCHANT_INFO } from '../data/mock';

export default function Settings() {
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#F8F9FA',
    borderRadius: 8,
    padding: '10px 12px',
    width: '100%',
    outline: 'none',
    fontSize: 14,
  };

  const sectionStyle: React.CSSProperties = {
    background: '#111318',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    overflow: 'hidden',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <div className="flex-1 overflow-y-auto h-full font-sans" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <header
        className="px-8 py-6 shrink-0"
        style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
      >
        <div className="flex items-center text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#4B5563' }}>
          <SettingsIcon className="w-4 h-4 mr-2" /> Configuration
        </div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#F8F9FA' }}>Profile &amp; Preferences</h1>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Business Profile */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <User className="w-4 h-4" style={{ color: '#00D1C1' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#F8F9FA' }}>Business Profile</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            {[
              { label: 'Business Name', value: MERCHANT_INFO.businessName, disabled: false },
              { label: 'Location', value: MERCHANT_INFO.location, disabled: false },
              { label: 'Sector', value: MERCHANT_INFO.sector, disabled: true },
              { label: 'Operational Phase', value: 'Run Phase', disabled: true },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#4B5563' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  style={{ ...inputStyle, opacity: field.disabled ? 0.5 : 1, cursor: field.disabled ? 'not-allowed' : 'text' }}
                  defaultValue={field.value}
                  disabled={field.disabled}
                  onFocus={e => { if (!field.disabled) { e.currentTarget.style.borderColor = 'rgba(0,209,193,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,209,193,0.1)'; } }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Link2 className="w-4 h-4" style={{ color: '#00D1C1' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#F8F9FA' }}>Connected Integrations</h2>
          </div>
          <div style={{ borderTop: 'none' }}>
            {[
              "POS System (StoreHub / Loyverse)",
              "Accounting Software (Xero)",
              "Supplier Email Extraction",
              "Bank Feed (Maybank / CIMB)"
            ].map((name, i) => (
              <div
                key={i}
                className="px-6 py-4 flex justify-between items-center"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="font-medium text-sm" style={{ color: '#9CA3AF' }}>{name}</span>
                <button
                  className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all"
                  style={{ color: '#00D1C1', border: '1px solid rgba(0,209,193,0.25)', background: 'rgba(0,209,193,0.07)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,209,193,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,209,193,0.07)'; }}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 text-sm" style={{ background: 'rgba(0,209,193,0.05)', borderTop: '1px solid rgba(0,209,193,0.15)', color: '#9CA3AF' }}>
            MerchantMind is running in <b style={{ color: '#00D1C1' }}>Simulation Mode</b>. Connect your POS or Bank account for real-time insights.
          </div>
        </section>

        {/* Notifications */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Bell className="w-4 h-4" style={{ color: '#00D1C1' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#F8F9FA' }}>Alert Preferences</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#4B5563' }}>WhatsApp Number</label>
              <input
                type="text"
                style={{ ...inputStyle, maxWidth: 320 }}
                placeholder="+60 1x-xxxxxxx"
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,209,193,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,209,193,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="block text-sm font-semibold mb-3" style={{ color: '#E5E7EB' }}>Send alerts directly to WhatsApp for:</span>
              <div className="space-y-3">
                {[
                  { label: 'Urgent Disruptions (Red)', checked: true },
                  { label: 'Market Opportunities (Amber)', checked: true },
                  { label: 'Daily Digest (Morning)', checked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#00D1C1' }}
                    />
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

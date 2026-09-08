import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, ShieldCheck, Layers, Filter } from 'lucide-react';
import { api } from '../services/api';

export const NewsIntelligenceView: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [news, setNews] = useState<any[]>([]);
  const [institutional, setInstitutional] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'institutional'>('news');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    Promise.all([api.getNews(), api.getInstitutional()])
      .then(([n, inst]) => {
        setNews(n);
        setInstitutional(inst);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', 'inflation', 'labor', 'monetary_policy', 'growth', 'commodities', 'geopolitics'];

  const filteredNews = selectedCategory === 'all'
    ? news
    : news.filter((item) => item.macro_category === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Macro News & Institutional Intelligence Feed
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Filtered, deduplicated, and classified by source reliability tier • Fact vs. Opinion distinction
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('news')}
            style={{
              background: activeTab === 'news' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'news' ? '#0f172a' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Verified News & Releases ({news.length})
          </button>
          <button
            onClick={() => setActiveTab('institutional')}
            style={{
              background: activeTab === 'institutional' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'institutional' ? '#0f172a' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Major Bank Research ({institutional.length})
          </button>
        </div>
      </div>

      {/* Category Pills for News */}
      {activeTab === 'news' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#38bdf8' : 'var(--text-secondary)',
                border: `1px solid ${selectedCategory === cat ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-subtle)'}`,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Items Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab === 'news' ? (
          filteredNews.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No articles recorded for this filter category.
            </div>
          ) : (
            filteredNews.map((item) => {
              const dt = new Date(item.published_at);
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: item.source_tier === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: item.source_tier === 1 ? '#34d399' : '#38bdf8',
                      }}>
                        Tier {item.source_tier} • {item.source_name}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                      }}>
                        {item.statement_type || 'FACT'}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                      }}>
                        {item.macro_category.replace('_', ' ')}
                      </span>
                      {item.is_simulated && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                        }}>
                          [SIMULATED SCENARIO]
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.summary}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Reliability Score: {item.source_reliability}%
                      </span>
                      {item.duplicate_count > 1 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                          {item.duplicate_count} syndicated copies clustered
                        </span>
                      )}
                    </div>
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--accent-cyan)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Inspect Primary Source <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Institutional Bank Research */
          institutional.map((inst) => {
            const dt = new Date(inst.published_at);
            return (
              <div
                key={inst.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {inst.institution_name}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                    }}>
                      {inst.view_type}
                    </span>
                    <span
                      onClick={() => onSelectAsset && onSelectAsset(inst.asset_symbol)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        background: 'rgba(56, 189, 248, 0.15)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {inst.asset_symbol}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Horizon: {inst.target_horizon} • Stance: <strong style={{ color: inst.stance === 'Bullish' ? '#10b981' : (inst.stance === 'Bearish' ? '#ef4444' : '#94a3b8') }}>{inst.stance}</strong>
                  </div>
                </div>

                <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {inst.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {inst.summary}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

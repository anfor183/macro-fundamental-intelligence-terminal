import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, RefreshCw, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CalendarEvent } from '../types/macro';
import { api } from '../services/api';

export const CalendarView: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterScope, setFilterScope] = useState<'upcoming' | 'today' | 'completed' | 'all'>('upcoming');
  const [filterImportance, setFilterImportance] = useState<string>('All');

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const data = await api.getCalendar();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await api.triggerLiveSync();
      await loadCalendar();
    } catch (err) {
      console.error('Error during calendar live sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Filter events by scope & importance
  const filtered = useMemo(() => {
    return events.filter((evt) => {
      const evtDate = new Date(evt.event_time);
      const isPast = evt.status === 'COMPLETED' || evtDate.getTime() < now.getTime();
      const isToday = evt.event_time.slice(0, 10) === todayStr;

      // Scope filter
      if (filterScope === 'upcoming') {
        // Upcoming includes today and future events
        if (isPast && !isToday) return false;
      } else if (filterScope === 'today') {
        if (!isToday) return false;
      } else if (filterScope === 'completed') {
        if (!isPast) return false;
      }

      // Importance filter
      if (filterImportance !== 'All') {
        if (evt.importance.toLowerCase() !== filterImportance.toLowerCase()) return false;
      }

      return true;
    });
  }, [events, filterScope, filterImportance, todayStr]);

  // Telemetry counts
  const stats = useMemo(() => {
    const total = events.length;
    let upcomingCount = 0;
    let todayCount = 0;
    let completedCount = 0;
    let beats = 0;
    let misses = 0;

    events.forEach((e) => {
      const isPast = e.status === 'COMPLETED' || new Date(e.event_time).getTime() < now.getTime();
      const isToday = e.event_time.slice(0, 10) === todayStr;
      if (isToday) todayCount++;
      if (isPast && !isToday) {
        completedCount++;
      } else {
        upcomingCount++;
      }
      if (e.surprise === 'BEAT') beats++;
      if (e.surprise === 'MISS') misses++;
    });

    return { total, upcomingCount, todayCount, completedCount, beats, misses };
  }, [events, todayStr]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with Title & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              High-Impact Macro Economic Calendar
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              LIVE FOREXFACTORY FEED
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Scheduled macroeconomic releases with consensus expectations, live actual prints, and directional sensitivity guidelines
          </div>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            color: isSyncing ? 'var(--accent-cyan)' : 'var(--text-primary)',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'Syncing Live Feeds...' : 'Sync Calendar Now'}</span>
        </button>
      </div>

      {/* Quick Summary Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming Catalysts</div>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
            {stats.upcomingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>Scheduled forward events</div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today's Scheduled</div>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {stats.todayCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>Events for today ({todayStr})</div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Prints</div>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
            {stats.completedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.beats} Beats</span> • <span style={{ color: '#f43f5e', fontWeight: 700 }}>{stats.misses} Misses</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pipeline Verification</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Active & Synced</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>Zero Lookahead • Verified Tier 1</div>
        </div>
      </div>

      {/* Filter Toolbar: Scope Tabs & Importance Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Scope Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'upcoming', label: 'Upcoming & Today' },
            { id: 'today', label: 'Today Only' },
            { id: 'completed', label: 'Completed Prints' },
            { id: 'all', label: 'All Releases (Week)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterScope(tab.id as any)}
              style={{
                background: filterScope === tab.id ? 'var(--surface-elevated)' : 'transparent',
                color: filterScope === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: filterScope === tab.id ? '1px solid var(--border-subtle)' : 'none',
                padding: '5px 14px',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: filterScope === tab.id ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Importance Filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Impact:</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((imp) => (
            <button
              key={imp}
              onClick={() => setFilterImportance(imp)}
              style={{
                background: filterImportance === imp ? 'var(--accent-cyan)' : 'var(--surface-2)',
                color: filterImportance === imp ? '#0f172a' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <th style={{ padding: '10px 16px' }}>Time (UTC)</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
              <th style={{ padding: '10px 12px' }}>Country</th>
              <th style={{ padding: '10px 16px' }}>Event</th>
              <th style={{ padding: '10px 12px' }}>Importance</th>
              <th style={{ padding: '10px 12px' }}>Actual</th>
              <th style={{ padding: '10px 12px' }}>Consensus</th>
              <th style={{ padding: '10px 12px' }}>Previous</th>
              <th style={{ padding: '10px 16px' }}>Affected Assets & Directional Sensitivity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading live macroeconomic releases...</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No economic releases match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((evt) => {
                const eventDate = new Date(evt.event_time);
                const isCritical = evt.importance === 'Critical';
                const isHigh = evt.importance === 'High';
                const isPast = evt.status === 'COMPLETED' || eventDate.getTime() < now.getTime();
                const isToday = evt.event_time.slice(0, 10) === todayStr;

                return (
                  <tr
                    key={evt.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isCritical ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                    }}
                  >
                    {/* Time */}
                    <td className="mono" style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color={isToday ? '#f59e0b' : 'var(--accent-cyan)'} />
                        <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      {isPast ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'rgba(100, 116, 139, 0.15)',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={11} color="var(--text-muted)" />
                          COMPLETED
                        </span>
                      ) : isToday ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Zap size={11} color="#f59e0b" />
                          TODAY
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'rgba(6, 182, 212, 0.12)',
                            color: 'var(--accent-cyan)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          UPCOMING
                        </span>
                      )}
                    </td>

                    {/* Country & Currency */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {evt.country}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        marginLeft: 6,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: 'rgba(148, 163, 184, 0.1)',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}>
                        {evt.currency}
                      </span>
                    </td>

                    {/* Event Name */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {evt.event}
                    </td>

                    {/* Importance */}
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: isCritical
                          ? 'rgba(239, 68, 68, 0.2)'
                          : isHigh
                          ? 'rgba(245, 158, 11, 0.18)'
                          : 'rgba(100, 116, 139, 0.15)',
                        color: isCritical ? '#f87171' : isHigh ? '#fbbf24' : 'var(--text-muted)',
                      }}>
                        {evt.importance}
                      </span>
                    </td>

                    {/* Actual Value */}
                    <td className="mono" style={{ padding: '12px 12px' }}>
                      {evt.actual && evt.actual !== 'Pending' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{evt.actual}</span>
                          {evt.surprise === 'BEAT' && (
                            <span style={{ fontSize: '0.75rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700 }}>
                              Beat
                            </span>
                          )}
                          {evt.surprise === 'MISS' && (
                            <span style={{ fontSize: '0.75rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', fontWeight: 700 }}>
                              Miss
                            </span>
                          )}
                          {evt.surprise === 'IN_LINE' && (
                            <span style={{ fontSize: '0.75rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)', fontWeight: 700 }}>
                              In-Line
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Pending</span>
                      )}
                    </td>

                    {/* Consensus */}
                    <td className="mono" style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {evt.consensus}
                    </td>

                    {/* Previous */}
                    <td className="mono" style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>
                      {evt.previous}
                    </td>

                    {/* Affected Assets & Sensitivity */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        {evt.affected_assets.map((a) => (
                          <span
                            key={a}
                            onClick={() => onSelectAsset && onSelectAsset(a)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              cursor: 'pointer',
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {evt.sensitivity}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { CalendarEvent } from '../types/macro';
import { api } from '../services/api';

export const CalendarView: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterImportance, setFilterImportance] = useState<string>('All');

  useEffect(() => {
    api.getCalendar()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterImportance === 'All'
    ? events
    : events.filter((e) => e.importance.toLowerCase() === filterImportance.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            High-Impact Macro Economic Calendar
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Scheduled economic releases with consensus expectations and model sensitivity guidelines
          </div>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Critical', 'High', 'Medium'].map((imp) => (
            <button
              key={imp}
              onClick={() => setFilterImportance(imp)}
              style={{
                background: filterImportance === imp ? 'var(--accent-cyan)' : 'var(--bg-card)',
                color: filterImportance === imp ? '#0f172a' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 12px',
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
              <th style={{ padding: '10px 12px' }}>Country</th>
              <th style={{ padding: '10px 16px' }}>Event</th>
              <th style={{ padding: '10px 12px' }}>Importance</th>
              <th style={{ padding: '10px 12px' }}>Consensus</th>
              <th style={{ padding: '10px 12px' }}>Previous</th>
              <th style={{ padding: '10px 16px' }}>Affected Assets & Directional Sensitivity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((evt) => {
              const eventDate = new Date(evt.event_time);
              const isCritical = evt.importance === 'Critical';

              return (
                <tr
                  key={evt.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isCritical ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                  }}
                >
                  <td className="mono" style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} color="var(--accent-cyan)" />
                      <span>{eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 12px' }}>
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

                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {evt.event}
                  </td>

                  <td style={{ padding: '12px 12px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                      color: isCritical ? '#f87171' : '#fbbf24',
                    }}>
                      {evt.importance}
                    </span>
                  </td>

                  <td className="mono" style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {evt.consensus}
                  </td>

                  <td className="mono" style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>
                    {evt.previous}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

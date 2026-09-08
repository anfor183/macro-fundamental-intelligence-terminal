import React, { useState } from 'react';
import { X, PlayCircle, CheckCircle, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationSuccess: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationSuccess,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'cpi_downside_surprise',
      title: 'US CPI Downside Surprise (Disinflationary Shock)',
      description: 'US Headline CPI prints 2.6% YoY vs 3.0% expected. Triggers 75bps of Fed cut repricing, yields plummet, EURUSD surges to Strong Bullish (+72).',
      badge: 'BULLISH EURUSD / GOLD',
      color: '#10b981',
    },
    {
      id: 'cpi_upside_surprise',
      title: 'US Core CPI Re-acceleration Spike',
      description: 'US Core CPI surges 0.48% MoM vs 0.20% forecast. Near-term Fed easing eliminated, US 2Y yields jump 22bps, USD strengthens aggressively.',
      badge: 'BULLISH USD',
      color: '#38bdf8',
    },
    {
      id: 'nfp_employment_shock',
      title: 'US Nonfarm Payrolls Massive Cooling Miss',
      description: 'Payrolls miss drastically at +35K vs +160K expected; unemployment jumps to 4.5%. Recessionary concerns escalate Fed easing urgency.',
      badge: 'DOVISH FED REPRICING',
      color: '#f59e0b',
    },
    {
      id: 'boj_hawkish_hike',
      title: 'Bank of Japan Surprise 50bps Rate Hike',
      description: 'BoJ hikes uncollateralized call rate by 50bps to 1.00%. Rapid liquidation of global yen carry-trade positions, USDJPY plunges.',
      badge: 'HAWKISH JPY SHOCK',
      color: '#ec4899',
    },
    {
      id: 'oil_supply_shock',
      title: 'Middle East Maritime Transit Disruption',
      description: 'Crude tanker transit suspended through key choke-point. WTI spikes +8.5%, boosting petro-currencies (CAD) while imposing stagflation risks.',
      badge: 'COMMODITY SUPPLY SHOCK',
      color: '#ef4444',
    },
    {
      id: 'global_risk_off',
      title: 'Geopolitical Risk-Off Safe Haven Flight',
      description: 'Sharp equity liquidation across global bourses (-2.8%). Safe-haven flows flood into Gold (XAUUSD), Swiss Franc (CHF), and Treasuries.',
      badge: 'SAFE HAVEN SURGE',
      color: '#8b5cf6',
    },
  ];

  const handleRun = async (scenarioId: string) => {
    setRunningId(scenarioId);
    setResultMessage(null);
    try {
      const res = await api.runSimulation(scenarioId);
      setResultMessage(res.message);
      onSimulationSuccess();
    } catch (err: any) {
      setResultMessage(`Simulation Error: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-active)',
        borderRadius: 12,
        width: '100%',
        maxWidth: 780,
        maxHeight: '88vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(11, 17, 28, 0.95)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PlayCircle size={20} color="#fbbf24" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Macro Scenario Simulator
              </h2>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}>
                TESTING & VERIFICATION MODE
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Inject verified synthetic macro shocks to observe quantitative factor updates and bias flips live
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Message if just run */}
        {resultMessage && (
          <div style={{
            margin: '16px 24px 0 24px',
            padding: '12px 16px',
            background: resultMessage.includes('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${resultMessage.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.8rem',
            color: resultMessage.includes('Error') ? '#f87171' : '#34d399',
          }}>
            <CheckCircle size={18} />
            <div>{resultMessage}</div>
          </div>
        )}

        {/* Scenarios Grid */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {scenarios.map((sc) => {
            const isRunning = runningId === sc.id;
            return (
              <div
                key={sc.id}
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                      {sc.title}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: sc.color,
                    }}>
                      {sc.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {sc.description}
                  </div>
                </div>

                <button
                  onClick={() => handleRun(sc.id)}
                  disabled={isRunning}
                  style={{
                    background: isRunning ? '#334155' : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                  {isRunning ? 'Injecting...' : 'Inject Event'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          background: 'rgba(11, 17, 28, 0.5)',
        }}>
          Notice: All injected scenario items are explicitly tagged with <code style={{ color: '#fbbf24' }}>is_simulated = True</code> and labeled <code style={{ color: '#fbbf24' }}>[DEMO / SIMULATION]</code> across data stores and audit logs.
        </div>
      </div>
    </div>
  );
};

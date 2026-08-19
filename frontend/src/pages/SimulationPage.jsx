import React, { useState, useEffect } from 'react';
import { getScenarios, runScenario, runBenchmark } from '../services/simulationService';

export default function SimulationPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);

  // Benchmark State
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkReport, setBenchmarkReport] = useState(null);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const data = await getScenarios();
      setScenarios(data || []);
    } catch (err) {
      console.warn('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleRunScenario = async (scId) => {
    try {
      setRunningId(scId);
      const res = await runScenario(scId);
      setScenarioResult(res);
    } catch (err) {
      alert(`Scenario execution failed: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setBenchmarkRunning(true);
      setBenchmarkReport(null);
      const report = await runBenchmark();
      setBenchmarkReport(report);
    } catch (err) {
      alert(`Benchmark failed: ${err.message}`);
    } finally {
      setBenchmarkRunning(false);
    }
  };

  return (
    <div className="simulation-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Network Chaos Engineering & Scenario Simulator
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Inject real-time fiber cuts, DDoS attacks, and network congestion to evaluate multi-area routing resilience
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRunBenchmark}
          disabled={benchmarkRunning}
          type="button"
        >
          {benchmarkRunning ? '⏳ Executing Automated Test Suite...' : '🧪 Run Full Campus Benchmark'}
        </button>
      </div>

      {/* Benchmark Report Card (if run) */}
      {benchmarkReport && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-cyan)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Campus Network Health Diagnostic Report</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Automated test suite run at {benchmarkReport.timestamp}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: benchmarkReport.health_score_percent >= 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {benchmarkReport.health_score_percent}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Network Health Score</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div className="stat-label">Tests Passed</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                {benchmarkReport.passed_tests} / {benchmarkReport.total_tests}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div className="stat-label">Tests Failed</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: benchmarkReport.failed_tests > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                {benchmarkReport.failed_tests}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div className="stat-label">Avg Benchmark Latency</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                {benchmarkReport.avg_latency_ms} ms
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Source &rarr; Target</th>
                  <th>Protocol</th>
                  <th>Latency</th>
                  <th>Hops</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkReport.results.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{r.test_name}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {r.source} &rarr; {r.destination}
                    </td>
                    <td>
                      <span className="code-badge">{r.protocol}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.latency_ms} ms</td>
                    <td>{r.hops}</td>
                    <td>
                      <span className={`status-badge ${r.passed ? 'active' : 'inactive'}`}>
                        ● {r.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scenario Execution Result Alert */}
      {scenarioResult && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Scenario Execution: {scenarioResult.scenario_title}
            </h4>
            <button
              type="button"
              onClick={() => setScenarioResult(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
            {scenarioResult.summary}
          </p>
          <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {scenarioResult.logs.map((log, i) => (
              <div key={i} style={{ color: 'var(--text-secondary)' }}>&gt; {log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Chaos Scenarios Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {scenarios.map((sc) => {
          const isRestore = sc.id === 'scenario-restore-all';

          return (
            <div
              key={sc.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isRestore ? 'rgba(16, 185, 129, 0.3)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="code-badge" style={{ fontSize: '0.7rem', color: isRestore ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {sc.category}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {sc.title}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {sc.description}
                </p>

                <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  <strong>Expected:</strong> {sc.expected_outcome}
                </div>
              </div>

              <button
                type="button"
                className={`btn ${isRestore ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleRunScenario(sc.id)}
                disabled={runningId === sc.id}
                style={{ width: '100%' }}
              >
                {runningId === sc.id ? '⚡ Injecting Scenario...' : isRestore ? '🟢 Restore All Nominal States' : '⚠️ Trigger Fault Scenario'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

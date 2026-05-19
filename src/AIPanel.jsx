// src/AIPanel.jsx
// Dashboard shown below the header when AI Mode is active.
// Displays episode stats, win rate, exploration rate, score sparkline,
// last decision, speed controls, and a scrollable per-episode run log.

const C = {
  cyan:   "#00fff7",
  green:  "#00ff88",
  yellow: "#ffcc00",
  red:    "#ff003c",
  purple: "#8855ff",
};

const SPARK_W = 220;
const SPARK_H = 36;

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AIPanel({ stats, aiSpeed, onSpeedChange, onReset, lastDecision }) {
  const { episodes, wins, scoreHistory, episodeLog = [], epsilon } = stats;

  const winRate        = episodes > 0 ? wins / episodes : 0;
  const winPct         = Math.round(winRate * 100);
  const explorationPct = Math.round(epsilon * 100);

  // Build SVG sparkline from last 30 scores
  const spark = scoreHistory.slice(-30);
  const maxS  = Math.max(...spark, 1);
  const minS  = Math.min(...spark, 0);
  const range = maxS - minS || 1;

  const sparkPoints = spark.length >= 2
    ? spark.map((s, i) => {
        const x = (i / (spark.length - 1)) * SPARK_W;
        const y = SPARK_H - ((s - minS) / range) * SPARK_H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ")
    : null;

  const lastDotX = SPARK_W;
  const lastDotY = spark.length >= 1
    ? SPARK_H - ((spark[spark.length - 1] - minS) / range) * SPARK_H
    : SPARK_H / 2;

  // Show newest episodes first
  const logRows = [...episodeLog].reverse();

  return (
    <div style={styles.outerWrap}>
      {/* ── Logo sidebar ─────────────────────────────────────────── */}
      <div style={styles.logoSidebar}>
        <img
          src="/CyberSec-Sentinel/SentinelCerberus.png"
          alt="Sentinel Cerberus"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "drop-shadow(0 0 14px rgba(136,85,255,0.9))" }}
        />
      </div>

      {/* ── Main panel ───────────────────────────────────────────── */}
      <div style={styles.panel}>
      {/* ── Header row ──────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>SENTINEL CERBERUS — AI MODE</span>
          <span style={styles.epLabel}>Episode <span style={styles.epNum}>{episodes}</span></span>
          <span style={{ ...styles.epLabel, color: C.green }}>Wins <span style={{ fontWeight: 700 }}>{wins}</span></span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.speedRow}>
            <span style={styles.speedLabel}>SPEED</span>
            {[1, 2, 5].map(s => (
              <button
                key={s}
                style={{ ...styles.speedBtn, ...(aiSpeed === s ? styles.speedBtnActive : {}) }}
                onClick={() => onSpeedChange(s)}
              >{s}×</button>
            ))}
          </div>
          <button style={styles.resetBtn} onClick={onReset}>↺ RESET LEARNING</button>
        </div>
      </div>

      {/* ── Metrics + Log row ────────────────────────────────────── */}
      <div style={styles.bodyRow}>

        {/* Left: metrics */}
        <div style={styles.metrics}>
          {/* Win rate */}
          <div style={styles.metric}>
            <span style={styles.metricLabel}>WIN RATE</span>
            <div style={styles.barRow}>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${winPct}%`, background: C.green }} />
              </div>
              <span style={{ ...styles.metricVal, color: C.green }}>{winPct}%</span>
            </div>
          </div>

          {/* Exploration */}
          <div style={styles.metric}>
            <span style={styles.metricLabel}>EXPLORING ε</span>
            <div style={styles.barRow}>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${explorationPct}%`, background: C.yellow }} />
              </div>
              <span style={{ ...styles.metricVal, color: C.yellow }}>{explorationPct}%</span>
            </div>
            <span style={styles.metricHint}>
              {epsilon > 0.6 ? "random" : epsilon > 0.25 ? "learning" : "smart"}
            </span>
          </div>

          {/* Score sparkline */}
          <div style={styles.metric}>
            <span style={styles.metricLabel}>SCORE TREND</span>
            <div style={styles.sparkBox}>
              {spark.length < 2 ? (
                <span style={styles.sparkEmpty}>play more episodes…</span>
              ) : (
                <svg width={SPARK_W} height={SPARK_H} style={{ overflow: "visible", display: "block" }}>
                  <line x1="0" y1={SPARK_H} x2={SPARK_W} y2={SPARK_H}
                    stroke="rgba(0,255,247,0.1)" strokeWidth="1" />
                  <polyline
                    points={sparkPoints}
                    fill="none"
                    stroke={C.cyan}
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  <circle cx={lastDotX} cy={lastDotY} r="3" fill={C.cyan} opacity="0.9" />
                </svg>
              )}
            </div>
          </div>

          {/* Last decision */}
          <div style={styles.decisionBox}>
            <span style={styles.metricLabel}>LAST ACTION</span>
            {lastDecision ? (
              <div style={styles.decisionContent}>
                <span style={{ color: C.cyan, fontWeight: 700 }}>{lastDecision.mitigationId}</span>
                <span style={styles.decisionArrow}>→</span>
                <span style={{ color: "#c8dde8" }}>{lastDecision.hostName}</span>
                <span style={{ ...styles.decisionReward, color: lastDecision.reward >= 0 ? C.green : C.red }}>
                  {lastDecision.reward >= 0 ? "+" : ""}{lastDecision.reward}
                </span>
              </div>
            ) : (
              <span style={styles.sparkEmpty}>waiting for first action…</span>
            )}
          </div>
        </div>

        {/* Right: episode run log */}
        <div style={styles.logSection}>
          <div style={styles.logHeader}>
            <span style={styles.metricLabel}>RUN LOG</span>
            <span style={{ ...styles.metricLabel, marginLeft: "auto", opacity: 0.5 }}>newest first</span>
          </div>
          <div style={styles.logTable}>
            {/* Column headers */}
            <div style={{ ...styles.logRow, ...styles.logHeaderRow }}>
              <span style={styles.logColEp}>EP</span>
              <span style={styles.logColResult}>RESULT</span>
              <span style={styles.logColScore}>SCORE</span>
              <span style={styles.logColTime}>TIME</span>
            </div>
            {/* Rows */}
            {logRows.length === 0 ? (
              <div style={styles.logEmpty}>No episodes yet — Sentinel is warming up…</div>
            ) : (
              logRows.map(row => (
                <div
                  key={row.ep}
                  style={{
                    ...styles.logRow,
                    background: row.won
                      ? "rgba(0,255,136,0.04)"
                      : "rgba(255,0,60,0.04)",
                    borderLeft: `2px solid ${row.won ? "rgba(0,255,136,0.35)" : "rgba(255,0,60,0.35)"}`,
                  }}
                >
                  <span style={styles.logColEp}>{row.ep}</span>
                  <span style={{ ...styles.logColResult, color: row.won ? C.green : C.red, fontWeight: 700 }}>
                    {row.won ? "WIN" : "LOSS"}
                  </span>
                  <span style={{ ...styles.logColScore, color: "#c8dde8" }}>{row.score}</span>
                  <span style={{ ...styles.logColTime, color: "rgba(187,153,255,0.7)" }}>
                    {fmtDuration(row.durationSec)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}

const styles = {
  outerWrap: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    margin: "0 10px 4px",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  logoSidebar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    flexShrink: 0,
    padding: 0,
    overflow: "hidden",
    background: "rgba(136,85,255,0.06)",
    border: "1px solid rgba(136,85,255,0.3)",
    borderTop: "3px solid #8855ff",
    borderRight: "none",
    boxShadow: "-4px 0 16px rgba(136,85,255,0.08)",
  },
  panel: {
    flex: 1,
    border: "1px solid rgba(136,85,255,0.3)",
    borderTop: "3px solid #8855ff",
    background: "rgba(136,85,255,0.04)",
    boxShadow: "0 0 24px rgba(136,85,255,0.08)",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 10px",
    borderBottom: "1px solid rgba(136,85,255,0.18)",
    background: "rgba(136,85,255,0.05)",
    flexWrap: "wrap",
    gap: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    color: "#bb99ff",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    textShadow: "0 0 12px rgba(136,85,255,0.55)",
  },
  epLabel: {
    fontSize: 11,
    color: "rgba(187,153,255,0.65)",
    letterSpacing: "0.06em",
  },
  epNum: {
    fontWeight: 700,
    color: "#bb99ff",
  },
  speedRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  speedLabel: {
    fontSize: 9,
    color: "rgba(187,153,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginRight: 2,
  },
  speedBtn: {
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 700,
    border: "1px solid rgba(136,85,255,0.25)",
    background: "rgba(136,85,255,0.06)",
    color: "rgba(187,153,255,0.5)",
    letterSpacing: "0.06em",
    cursor: "pointer",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  speedBtnActive: {
    background: "rgba(136,85,255,0.25)",
    color: "#cc88ff",
    borderColor: "rgba(136,85,255,0.65)",
    boxShadow: "0 0 8px rgba(136,85,255,0.3)",
  },
  resetBtn: {
    padding: "3px 10px",
    fontSize: 10,
    fontWeight: 700,
    border: "1px solid rgba(255,0,60,0.3)",
    background: "rgba(255,0,60,0.05)",
    color: "rgba(255,120,120,0.7)",
    letterSpacing: "0.06em",
    cursor: "pointer",
    fontFamily: "'Courier New', Consolas, monospace",
  },

  // ── Body: metrics left + log right ─────────────────────────────────────────
  bodyRow: {
    display: "flex",
    gap: 0,
    alignItems: "stretch",
  },
  metrics: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 20,
    padding: "8px 16px",
    flex: "1 1 auto",
    borderRight: "1px solid rgba(136,85,255,0.15)",
  },
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "rgba(187,153,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  barTrack: {
    width: 90,
    height: 6,
    background: "rgba(136,85,255,0.1)",
    border: "1px solid rgba(136,85,255,0.18)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    transition: "width 0.5s ease",
  },
  metricVal: {
    fontSize: 10,
    fontWeight: 700,
    width: 30,
    textAlign: "right",
    letterSpacing: "0.04em",
  },
  metricHint: {
    fontSize: 9,
    color: "rgba(187,153,255,0.35)",
    fontStyle: "italic",
    letterSpacing: "0.06em",
  },
  sparkBox: {
    height: SPARK_H,
    display: "flex",
    alignItems: "center",
  },
  sparkEmpty: {
    fontSize: 10,
    color: "rgba(187,153,255,0.3)",
    fontStyle: "italic",
  },
  decisionBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "6px 12px",
    border: "1px solid rgba(0,255,247,0.1)",
    background: "rgba(0,0,0,0.25)",
    minWidth: 240,
  },
  decisionContent: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 11,
  },
  decisionArrow: {
    color: "rgba(154,180,192,0.4)",
    fontSize: 10,
  },
  decisionReward: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
  },

  // ── Run log ─────────────────────────────────────────────────────────────────
  logSection: {
    width: 320,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
  },
  logHeader: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px 4px",
    borderBottom: "1px solid rgba(136,85,255,0.12)",
  },
  logTable: {
    overflowY: "auto",
    maxHeight: 160,
    display: "flex",
    flexDirection: "column",
  },
  logHeaderRow: {
    background: "rgba(136,85,255,0.08)",
    borderBottom: "1px solid rgba(136,85,255,0.15)",
    position: "sticky",
    top: 0,
  },
  logRow: {
    display: "flex",
    alignItems: "center",
    padding: "4px 12px",
    fontSize: 11,
    borderBottom: "1px solid rgba(136,85,255,0.07)",
  },
  logEmpty: {
    padding: "10px 12px",
    fontSize: 10,
    color: "rgba(187,153,255,0.3)",
    fontStyle: "italic",
  },
  logColEp:     { width: 36,  flexShrink: 0, color: "rgba(187,153,255,0.5)", fontSize: 10 },
  logColResult: { width: 50,  flexShrink: 0, fontSize: 10, letterSpacing: "0.08em" },
  logColScore:  { width: 60,  flexShrink: 0, fontSize: 11 },
  logColTime:   { flex: 1,    fontSize: 11, textAlign: "right" },
};

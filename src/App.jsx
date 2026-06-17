import { useState, useEffect } from "react";
import { Undo2, Settings, X } from "lucide-react";

const SCORE_FONT_STACK = "'Anton', sans-serif";

function evaluateGameWinner(pointsA, pointsB, noDeuce) {
  // Reaching 40 is the 3rd point won (index 3) and does not win by itself.
  // The game is only won on the point AFTER that, so the threshold is
  // always 4 points won. Sudden death vs deuce only changes the required lead.
  const lead = noDeuce ? 1 : 2;
  const threshold = 4;
  if (pointsA >= threshold && pointsA - pointsB >= lead) return "A";
  if (pointsB >= threshold && pointsB - pointsA >= lead) return "B";
  return null;
}

function pointLabel(points, oppPoints, noDeuce) {
  if (noDeuce) {
    return ["Love", "15", "30", "40"][Math.min(points, 3)];
  }
  if (points < 3) return ["Love", "15", "30"][points];
  if (oppPoints < 3) return "40";
  if (points === oppPoints) return "Deuce";
  if (points > oppPoints) return "Ad";
  return "40";
}

export default function TennisScoreCounter() {
  const [config, setConfig] = useState({
    noDeuce: true,
    racesTo: 4,
    teamAName: "Team A",
    teamBName: "Team B",
  });
  const [score, setScore] = useState({
    pointsA: 0,
    pointsB: 0,
    gamesA: 0,
    gamesB: 0,
    winner: null,
  });
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [nameDraft, setNameDraft] = useState({ a: "Team A", b: "Team B" });
  const [flash, setFlash] = useState(null); // { team: 'A' | 'B', key: number }

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1100);
    return () => clearTimeout(t);
  }, [flash]);

  const addPoint = (team) => {
    if (score.winner) return;
    setHistory((h) => [...h, score]);

    let { pointsA, pointsB, gamesA, gamesB } = score;
    if (team === "A") pointsA += 1;
    else pointsB += 1;

    const gameWinner = evaluateGameWinner(pointsA, pointsB, config.noDeuce);
    if (gameWinner === "A") {
      gamesA += 1;
      pointsA = 0;
      pointsB = 0;
    } else if (gameWinner === "B") {
      gamesB += 1;
      pointsA = 0;
      pointsB = 0;
    }

    let winner = null;
    if (gamesA >= config.racesTo) winner = "A";
    if (gamesB >= config.racesTo) winner = "B";

    setScore({ pointsA, pointsB, gamesA, gamesB, winner });

    if (gameWinner && !winner) {
      setFlash({ team: gameWinner, key: Date.now() });
    }
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setScore(last);
      return h.slice(0, -1);
    });
  };

  const newMatch = () => {
    setScore({ pointsA: 0, pointsB: 0, gamesA: 0, gamesB: 0, winner: null });
    setHistory([]);
  };

  const openSettings = () => {
    setNameDraft({ a: config.teamAName, b: config.teamBName });
    setShowSettings(true);
  };

  const saveSettings = () => {
    setConfig((c) => ({
      ...c,
      teamAName: nameDraft.a.trim() || "Team A",
      teamBName: nameDraft.b.trim() || "Team B",
    }));
    setShowSettings(false);
  };

  const winnerName = score.winner === "A" ? config.teamAName : config.teamBName;
  const labelA = pointLabel(score.pointsA, score.pointsB, config.noDeuce);
  const labelB = pointLabel(score.pointsB, score.pointsA, config.noDeuce);

  return (
    <div
      className="tsc-shell relative flex flex-col bg-zinc-950 overflow-hidden"
      style={{
        "--font-display": SCORE_FONT_STACK,
        touchAction: "manipulation",
        userSelect: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Outfit:wght@400;500;600;700;800&display=swap');

        .tsc-shell {
          height: 100dvh;
          --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
          --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
          --accent: #d7f205;
          --team-a: #c2410c;
          --team-b: #15803d;
          --safe-top: env(safe-area-inset-top, 0px);
          --safe-bottom: env(safe-area-inset-bottom, 0px);
          /* dark mode (default) */
          --bar-bg: #09090b;
          --bar-border: #27272a;
          --bar-text-secondary: #a1a1aa;
          --btn-bg: #27272a;
          --modal-bg: #18181b;
          --input-bg: #27272a;
          --modal-text: #ffffff;
          --modal-text-secondary: #a1a1aa;
          font-family: 'Outfit', system-ui, sans-serif;
        }

        @media (prefers-color-scheme: light) {
          .tsc-shell {
            --accent: #84b800;
            --bar-bg: #ffffff;
            --bar-border: #e4e4e7;
            --bar-text-secondary: #71717a;
            --btn-bg: #f4f4f5;
            --modal-bg: #ffffff;
            --input-bg: #f4f4f5;
            --modal-text: #09090b;
            --modal-text-secondary: #71717a;
          }
        }

        .tsc-zone-a {
          padding-top: var(--safe-top);
        }

        .tsc-zone-b {
          padding-bottom: var(--safe-bottom);
        }

        .font-display { font-family: var(--font-display); }

        .tsc-zone {
          transition: transform 140ms var(--ease-out), filter 140ms ease;
        }
        .tsc-zone:active:not(:disabled) {
          transform: scale(0.985);
          filter: brightness(0.9);
        }

        .tsc-score-digit {
          animation: tscDigitPop 140ms var(--ease-out);
        }
        @keyframes tscDigitPop {
          from { transform: scale(0.92); opacity: 0.6; }
          to { transform: scale(1); opacity: 1; }
        }

        .tsc-tag {
          display: inline-block;
          transform: skewX(-10deg);
          padding: 0.3rem 0.85rem;
        }
        .tsc-tag__inner {
          display: inline-block;
          transform: skewX(10deg);
        }

        .tsc-icon-btn {
          transition: transform 120ms var(--ease-out), background-color 150ms ease;
        }
        .tsc-icon-btn:active:not(:disabled) {
          transform: scale(0.88);
        }

        .tsc-chip {
          transition: transform 120ms var(--ease-out), background-color 150ms ease, color 150ms ease;
        }
        .tsc-chip:active {
          transform: scale(0.96);
        }

        .tsc-wash {
          animation: tscWash 950ms var(--ease-in-out) forwards;
        }
        @keyframes tscWash {
          0% { opacity: 0.45; }
          100% { opacity: 0; }
        }

        .tsc-banner {
          animation: tscBanner 1050ms var(--ease-out) forwards;
        }
        @keyframes tscBanner {
          0% { opacity: 0; transform: translateY(-50%) scale(0.85); }
          18% { opacity: 1; transform: translateY(-50%) scale(1.06); }
          30% { transform: translateY(-50%) scale(1); }
          78% { opacity: 1; transform: translateY(-50%) scale(1); }
          100% { opacity: 0; transform: translateY(-50%) scale(0.96); }
        }

        .tsc-winner-pop {
          animation: tscWinnerPop 380ms var(--ease-out);
        }
        @keyframes tscWinnerPop {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }

        .tsc-ribbon {
          clip-path: polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%);
        }
      `}</style>

      {/* Team A zone */}
      <button
        onClick={() => addPoint("A")}
        disabled={!!score.winner}
        className="tsc-zone tsc-zone-a relative flex-1 flex items-center justify-center disabled:opacity-40"
        style={{ backgroundColor: "var(--team-a)" }}
      >
        <span className="absolute tsc-tag" style={{ top: "calc(var(--safe-top) + 1rem)", left: "1rem", backgroundColor: "rgba(0,0,0,0.28)" }}>
          <span className="tsc-tag__inner text-xs uppercase tracking-widest text-white font-semibold">
            {config.teamAName}
          </span>
        </span>
        <span
          key={`a-${labelA}`}
          className="font-display tsc-score-digit text-8xl text-white leading-none tabular-nums"
        >
          {labelA}
        </span>
      </button>

      {/* Net / scoreboard bar */}
      <div
        className="relative flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: "var(--bar-bg)", borderTop: "1px solid var(--bar-border)", borderBottom: "1px solid var(--bar-border)" }}
      >
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="tsc-icon-btn p-2 rounded-full disabled:opacity-30"
          style={{ backgroundColor: "var(--btn-bg)" }}
        >
          <Undo2 className="w-5 h-5" style={{ color: "var(--accent)" }} />
        </button>

        <div className="flex flex-col items-center">
          <span
            className="font-display text-3xl tabular-nums leading-none"
            style={{ color: "var(--accent)" }}
          >
            {score.gamesA} – {score.gamesB}
          </span>
          <span className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--bar-text-secondary)" }}>
            race to {config.racesTo} · {config.noDeuce ? "sudden death" : "deuce"}
          </span>
        </div>

        <button
          onClick={openSettings}
          className="tsc-icon-btn p-2 rounded-full"
          style={{ backgroundColor: "var(--btn-bg)" }}
        >
          <Settings className="w-5 h-5" style={{ color: "var(--accent)" }} />
        </button>
      </div>

      {/* Team B zone */}
      <button
        onClick={() => addPoint("B")}
        disabled={!!score.winner}
        className="tsc-zone tsc-zone-b relative flex-1 flex items-center justify-center disabled:opacity-40"
        style={{ backgroundColor: "var(--team-b)" }}
      >
        <span
          key={`b-${labelB}`}
          className="font-display tsc-score-digit text-8xl text-white leading-none tabular-nums"
        >
          {labelB}
        </span>
        <span className="absolute tsc-tag" style={{ bottom: "calc(var(--safe-bottom) + 1rem)", right: "1rem", backgroundColor: "rgba(0,0,0,0.28)" }}>
          <span className="tsc-tag__inner text-xs uppercase tracking-widest text-white font-semibold">
            {config.teamBName}
          </span>
        </span>
      </button>

      {/* Game-win flash */}
      {flash && (
        <>
          <div
            key={`wash-${flash.key}`}
            className="absolute inset-0 z-30 pointer-events-none tsc-wash"
            style={{
              backgroundColor: flash.team === "A" ? "var(--team-a)" : "var(--team-b)",
            }}
          />
          <div
            key={`banner-${flash.key}`}
            className="absolute inset-x-0 top-1/2 z-40 flex items-center justify-center pointer-events-none tsc-banner"
          >
            <div className="bg-white px-10 py-6 rounded-3xl shadow-2xl text-center">
              <span
                className="font-display block text-4xl tracking-wide"
                style={{
                  color: flash.team === "A" ? "var(--team-a)" : "var(--team-b)",
                }}
              >
                GAME!
              </span>
              <span className="block text-lg font-bold text-zinc-700 uppercase tracking-widest mt-1">
                {flash.team === "A" ? config.teamAName : config.teamBName}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Match-winner overlay */}
      {score.winner && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 tsc-winner-pop" style={{ backgroundColor: "var(--accent)" }}>
          <div className="tsc-ribbon px-10 pt-4 pb-7" style={{ backgroundColor: "var(--bar-bg)" }}>
            <span className="block text-xs uppercase tracking-widest text-center" style={{ color: "var(--bar-text-secondary)" }}>
              Match winner
            </span>
            <span className="font-display block text-4xl text-center mt-1" style={{ color: "var(--modal-text)" }}>
              {winnerName}
            </span>
          </div>
          <span className="font-display text-2xl text-zinc-900">
            {score.gamesA} – {score.gamesB}
          </span>
          <button
            onClick={newMatch}
            className="tsc-chip mt-2 px-8 py-3 rounded-full font-bold uppercase tracking-widest"
            style={{ backgroundColor: "var(--bar-bg)", color: "var(--modal-text)" }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50 px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="rounded-2xl w-full max-w-sm p-5 flex flex-col gap-5 overflow-y-auto"
            style={{ maxHeight: "90%", backgroundColor: "var(--modal-bg)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xl" style={{ color: "var(--modal-text)" }}>Match Settings</span>
              <button onClick={() => setShowSettings(false)} className="tsc-icon-btn">
                <X className="w-5 h-5" style={{ color: "var(--modal-text-secondary)" }} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest" style={{ color: "var(--modal-text-secondary)" }}>
                Team A Name
              </label>
              <input
                value={nameDraft.a}
                onChange={(e) =>
                  setNameDraft((d) => ({ ...d, a: e.target.value }))
                }
                className="rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--modal-text)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest" style={{ color: "var(--modal-text-secondary)" }}>
                Team B Name
              </label>
              <input
                value={nameDraft.b}
                onChange={(e) =>
                  setNameDraft((d) => ({ ...d, b: e.target.value }))
                }
                className="rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--modal-text)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--modal-text-secondary)" }}>
                Deuce Mode
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig((c) => ({ ...c, noDeuce: true }))}
                  className="tsc-chip flex-1 py-2 rounded-lg font-semibold"
                  style={{
                    backgroundColor: config.noDeuce ? "var(--accent)" : "var(--btn-bg)",
                    color: config.noDeuce ? "#09090b" : "var(--modal-text)",
                  }}
                >
                  Sudden Death
                </button>
                <button
                  onClick={() => setConfig((c) => ({ ...c, noDeuce: false }))}
                  className="tsc-chip flex-1 py-2 rounded-lg font-semibold"
                  style={{
                    backgroundColor: !config.noDeuce ? "var(--accent)" : "var(--btn-bg)",
                    color: !config.noDeuce ? "#09090b" : "var(--modal-text)",
                  }}
                >
                  Standard Deuce
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-zinc-400">
                First to win
              </span>
              <div className="flex gap-2">
                {[4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setConfig((c) => ({ ...c, racesTo: n }))}
                    className="tsc-chip flex-1 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: config.racesTo === n ? "var(--accent)" : "var(--btn-bg)",
                      color: config.racesTo === n ? "#09090b" : "var(--modal-text)",
                    }}
                  >
                    {n} games
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveSettings}
              className="tsc-chip mt-2 py-3 rounded-lg font-bold uppercase tracking-widest"
              style={{ backgroundColor: "var(--accent)", color: "#09090b" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

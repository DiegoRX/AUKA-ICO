import React, { useState, CSSProperties } from "react";

// ── Card props ──────────────────────────────────────────────────────────────
interface CardFlipProps {
  imageUrl?: string;
  cardNumber?: string;
  holderName?: string;
  expiry?: string;
  cvv?: string;
}

// ── SVG helpers ─────────────────────────────────────────────────────────────
function NfcIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M8.5 12c0-1.9 1.6-3.5 3.5-3.5" />
      <path d="M6 12c0-3.3 2.7-6 6-6" />
      <path d="M11.5 12.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function CardFlip({
  imageUrl = "/card-bg.png",
  cardNumber = "4532 8841 9203 6769",
  holderName = "JAMES RODRÍGUEZ",
  expiry = "12/28",
  cvv = "123",
}: CardFlipProps) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const maskedNumber = cardNumber.replace(/\d(?=.{4})/g, "•");
  const maskedCVV = "•••";

  // ── Background style ───────────────────────────────────────────────────────
  const faceStyle: CSSProperties = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(135deg, #B8860B, #FFE566, #A67800)",
      };

  return (
    <div style={s.wrapper}>
      {/* ── 3-D Scene ── */}
      <div style={s.scene} onClick={() => setFlipped((f) => !f)} title="Click para voltear">
        <div
          style={{
            ...s.inner,
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── FRENTE ── */}
          <div style={{ ...s.face, ...s.front, ...faceStyle }}>
            {/* Gold overlay so image blends nicely */}
            <div style={s.goldOverlay} />
            {/* Shine */}
            <div style={s.shine} />

            <div style={s.content}>
              {/* Top row */}
              <div style={s.topRow}>
                <span style={s.logoText}>◎ Orden Global</span>
                <NfcIcon />
              </div>

              {/* Chip */}
              <div style={s.chipArea}>
                <div style={s.chip}>
                  <div style={s.chipLine} />
                  <div style={{ ...s.chipLine, ...s.chipCross }} />
                </div>
              </div>

              {/* Card number */}
              <div style={s.numberBlock}>
                <div style={s.cardNumber}>
                  {revealed ? cardNumber : maskedNumber}
                </div>
                <div style={s.expiryRow}>
                  <div>
                    <div style={s.label}>EXPIRA</div>
                    <div style={s.expiry}>{expiry}</div>
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div style={s.bottomRow}>
                <div>
                  <div style={s.label}>TITULAR</div>
                  <div style={s.holderName}>{holderName}</div>
                </div>
                <span style={s.visaLogo}>VISA</span>
              </div>
            </div>
          </div>

          {/* ── REVERSO ── */}
          <div style={{ ...s.face, ...s.back, ...faceStyle }}>
            <div style={s.goldOverlay} />
            <div style={s.shine} />

            {/* Banda magnética */}
            <div style={s.magStripe} />

            {/* Área de firma + CVV */}
            <div style={s.signatureArea}>
              <div style={s.signatureStripe}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ ...s.stripeLine, background: i % 2 === 0 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)" }} />
                ))}
              </div>
              <div style={s.cvvBox}>
                <div style={s.cvvLabel}>CVV</div>
                <div style={s.cvvNumber}>{revealed ? cvv : maskedCVV}</div>
              </div>
            </div>

            {/* Back bottom */}
            <div style={s.backBottom}>
              <span style={{ ...s.visaLogo, opacity: 0.9 }}>VISA</span>
              <span style={s.backNote}>Orden Global ◎</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={s.controls}>
        <button style={s.btn} onClick={() => setRevealed((r) => !r)}>
          {revealed ? "🙈 Ocultar datos" : "👁 Ver datos"}
        </button>
        <button style={s.btn} onClick={() => setFlipped((f) => !f)}>
          🔄 Voltear tarjeta
        </button>
      </div>

      <p style={s.hint}>Haz clic en la tarjeta para voltearla</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CardPage() {
  return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>Mi Tarjeta</h1>
      <CardFlip
        imageUrl="/card-bg.png"
        cardNumber="4532 8841 9203 6769"
        holderName="JAMES RODRÍGUEZ"
        expiry="12/28"
        cvv="123"
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at 60% 30%, #1a0d00 0%, #0a0a0a 100%)",
    padding: "40px 20px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  pageTitle: {
    color: "#FFD700",
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: 40,
    textShadow: "0 2px 18px rgba(255,200,0,0.35)",
  },

  // ── wrapper / scene ──
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 32,
  },
  scene: {
    width: 420,
    height: 260,
    perspective: "1200px",
    cursor: "pointer",
  },
  inner: {
    width: "100%",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
    transition: "transform 0.75s cubic-bezier(0.23, 1, 0.32, 1)",
  },

  // ── faces ──
  face: {
    position: "absolute",
    inset: 0,
    borderRadius: 18,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
    boxShadow:
      "0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,215,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
  },
  front: {},
  back: {
    transform: "rotateY(180deg)",
  },

  // ── overlays ──
  goldOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(180,130,0,0.38) 0%, rgba(255,220,80,0.18) 50%, rgba(140,90,0,0.42) 100%)",
    zIndex: 1,
  },
  shine: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 55%, rgba(255,255,255,0.06) 100%)",
    zIndex: 2,
    pointerEvents: "none",
  },

  // ── front content ──
  content: {
    position: "absolute",
    inset: 0,
    zIndex: 3,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "22px 26px 20px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: 800,
    fontSize: "1rem",
    letterSpacing: "0.06em",
    textShadow: "0 1px 6px rgba(0,0,0,0.5)",
    fontFamily: "'Inter', sans-serif",
  },

  // chip
  chipArea: { display: "flex" },
  chip: {
    width: 44,
    height: 34,
    borderRadius: 6,
    background: "linear-gradient(135deg, #E8CC6A 0%, #C9A227 40%, #F5E390 100%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
    position: "relative",
    overflow: "hidden",
  },
  chipLine: {
    position: "absolute",
    top: "50%",
    left: 4,
    right: 4,
    height: 1,
    background: "rgba(0,0,0,0.2)",
    transform: "translateY(-50%)",
  },
  chipCross: {
    top: 4,
    bottom: 4,
    left: "50%",
    right: "auto",
    width: 1,
    height: "auto",
    transform: "translateX(-50%)",
  },

  // number block
  numberBlock: { display: "flex", flexDirection: "column", gap: 4 },
  cardNumber: {
    color: "#fff",
    fontSize: "1.4rem",
    letterSpacing: "0.22em",
    fontFamily: "'Courier New', monospace",
    fontWeight: 700,
    textShadow: "0 1px 8px rgba(0,0,0,0.6)",
    transition: "opacity 0.3s",
  },
  expiryRow: { display: "flex" },
  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.57rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  expiry: {
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
  },

  // bottom row
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  holderName: {
    color: "#fff",
    fontSize: "0.88rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
  },
  visaLogo: {
    color: "#fff",
    fontSize: "1.6rem",
    fontWeight: 900,
    fontStyle: "italic",
    letterSpacing: "-0.02em",
    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
    fontFamily: "Georgia, serif",
  },

  // ── back content ──
  magStripe: {
    position: "absolute",
    top: 36,
    left: 0,
    right: 0,
    height: 46,
    background:
      "linear-gradient(180deg, #111 0%, #222 50%, #111 100%)",
    zIndex: 3,
    opacity: 0.9,
  },
  signatureArea: {
    position: "absolute",
    zIndex: 4,
    top: 108,
    left: 26,
    right: 26,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  signatureStripe: {
    flex: 1,
    height: 40,
    display: "flex",
    overflow: "hidden",
    borderRadius: 4,
  },
  stripeLine: {
    flex: 1,
    height: "100%",
  },
  cvvBox: {
    background: "#fff",
    borderRadius: 4,
    padding: "4px 12px",
    minWidth: 48,
    textAlign: "center",
  },
  cvvLabel: {
    fontSize: "0.48rem",
    color: "#999",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  cvvNumber: {
    color: "#222",
    fontSize: "1rem",
    fontWeight: 700,
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.12em",
  },
  backBottom: {
    position: "absolute",
    zIndex: 4,
    bottom: 22,
    left: 26,
    right: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backNote: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.76rem",
    letterSpacing: "0.06em",
  },

  // ── controls ──
  controls: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  btn: {
    background: "linear-gradient(135deg, #B8860B, #FFD700, #A67800)",
    color: "#1a0d00",
    border: "none",
    borderRadius: 30,
    padding: "12px 28px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
    boxShadow: "0 4px 18px rgba(200,150,0,0.38)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  hint: {
    color: "rgba(255,255,255,0.3)",
    fontSize: "0.78rem",
    letterSpacing: "0.06em",
    marginTop: -16,
  },
};

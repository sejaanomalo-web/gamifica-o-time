import confetti from "canvas-confetti";

const GOLD = ["#C9953A", "#E0B25A", "#FFFFFF"];

export function fireGoldConfetti(intensity: "low" | "mid" | "high" = "mid") {
  const duration = intensity === "high" ? 2200 : intensity === "mid" ? 1600 : 900;
  const particles = intensity === "high" ? 6 : intensity === "mid" ? 4 : 2;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: particles,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: GOLD,
      gravity: 0.8,
      scalar: 0.9,
      ticks: 220,
    });
    confetti({
      particleCount: particles,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: GOLD,
      gravity: 0.8,
      scalar: 0.9,
      ticks: 220,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

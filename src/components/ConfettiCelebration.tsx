import { useEffect } from "react";
import confetti from "canvas-confetti";

export const ConfettiCelebration = () => {
  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["#a855f7", "#22d3ee", "#f59e0b", "#ec4899", "#10b981"];

    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });

    const interval = window.setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors,
      });
    }, 350);

    return () => clearInterval(interval);
  }, []);

  return null;
};

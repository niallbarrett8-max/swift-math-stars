import { useEffect, useState } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { GameScreen } from "@/components/GameScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { Difficulty, STORAGE_KEYS, TimerOption } from "@/lib/game";

type Screen = "setup" | "game" | "results";

const readNum = (key: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => (localStorage.getItem(STORAGE_KEYS.difficulty) as Difficulty) || "easy",
  );
  const [timer, setTimer] = useState<TimerOption>(
    () => (readNum(STORAGE_KEYS.timer, 60) as TimerOption) || 60,
  );
  const [soundOn, setSoundOn] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEYS.sound) !== "false",
  );
  const [highScore, setHighScore] = useState<number>(() => readNum(STORAGE_KEYS.highScore, 0));
  const [result, setResult] = useState<{ score: number; total: number; accuracy: number } | null>(
    null,
  );
  const [isNewHigh, setIsNewHigh] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.difficulty, difficulty), [difficulty]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.timer, String(timer)), [timer]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.sound, String(soundOn)), [soundOn]);

  const start = () => {
    setResult(null);
    setIsNewHigh(false);
    setScreen("game");
  };

  const handleEnd = (r: { score: number; total: number; accuracy: number }) => {
    setResult(r);
    const beat = r.score > highScore;
    if (beat) {
      setHighScore(r.score);
      localStorage.setItem(STORAGE_KEYS.highScore, String(r.score));
    }
    setIsNewHigh(beat && r.score > 0);
    setScreen("results");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      {screen === "setup" && (
        <SetupScreen
          difficulty={difficulty}
          timer={timer}
          soundOn={soundOn}
          highScore={highScore}
          onDifficulty={setDifficulty}
          onTimer={setTimer}
          onToggleSound={() => setSoundOn((s) => !s)}
          onStart={start}
        />
      )}
      {screen === "game" && (
        <GameScreen
          difficulty={difficulty}
          timer={timer}
          soundOn={soundOn}
          onEnd={handleEnd}
          onQuit={() => setScreen("setup")}
        />
      )}
      {screen === "results" && result && (
        <ResultsScreen
          score={result.score}
          total={result.total}
          accuracy={result.accuracy}
          highScore={highScore}
          isNewHighScore={isNewHigh}
          onPlayAgain={start}
          onHome={() => setScreen("setup")}
        />
      )}
    </main>
  );
};

export default Index;

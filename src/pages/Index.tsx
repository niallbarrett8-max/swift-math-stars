import { useEffect, useState } from "react";
import { SetupScreen, TimerChoice } from "@/components/SetupScreen";
import { GameScreen, GameResult } from "@/components/GameScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import {
  Difficulty,
  Operation,
  STORAGE_KEYS,
  TimerOption,
  highScoreKey,
} from "@/lib/game";

type Screen = "setup" | "game" | "results";

const readNum = (key: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("setup");
  const [operation, setOperation] = useState<Operation>(
    () => (localStorage.getItem(STORAGE_KEYS.operation) as Operation) || "mul",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => (localStorage.getItem(STORAGE_KEYS.difficulty) as Difficulty) || "easy",
  );
  const [timer, setTimer] = useState<TimerChoice>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.timer);
    if (v === "practice") return "practice";
    const n = Number(v);
    return ([30, 60, 120].includes(n) ? n : 60) as TimerOption;
  });
  const [soundOn, setSoundOn] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEYS.sound) !== "false",
  );
  const [highScore, setHighScore] = useState<number>(() =>
    readNum(highScoreKey(operation, difficulty), 0),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.operation, operation), [operation]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.difficulty, difficulty), [difficulty]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.timer, String(timer)), [timer]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.sound, String(soundOn)), [soundOn]);
  useEffect(() => {
    setHighScore(readNum(highScoreKey(operation, difficulty), 0));
  }, [operation, difficulty]);

  const start = () => {
    setResult(null);
    setIsNewHigh(false);
    setScreen("game");
  };

  const handleEnd = (r: GameResult) => {
    setResult(r);
    if (!r.practice) {
      const beat = r.score > highScore;
      if (beat) {
        setHighScore(r.score);
        localStorage.setItem(highScoreKey(operation, difficulty), String(r.score));
      }
      setIsNewHigh(beat && r.score > 0);
    } else {
      setIsNewHigh(false);
    }
    setScreen("results");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      {screen === "setup" && (
        <SetupScreen
          operation={operation}
          difficulty={difficulty}
          timer={timer}
          soundOn={soundOn}
          highScore={highScore}
          onOperation={setOperation}
          onDifficulty={setDifficulty}
          onTimer={setTimer}
          onToggleSound={() => setSoundOn((s) => !s)}
          onStart={start}
        />
      )}
      {screen === "game" && (
        <GameScreen
          operation={operation}
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
          practice={result.practice}
          onPlayAgain={start}
          onHome={() => setScreen("setup")}
        />
      )}
    </main>
  );
};

export default Index;

import { useEffect, useState } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { PracticeSetupScreen } from "@/components/PracticeSetupScreen";
import { GameScreen, GameResult } from "@/components/GameScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import {
  Difficulty,
  Operation,
  STORAGE_KEYS,
  TimerOption,
  highScoreKey,
} from "@/lib/game";

type Screen = "setup" | "practiceSetup" | "game" | "practice" | "results";

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
  const [timer, setTimer] = useState<TimerOption>(() => {
    const n = Number(localStorage.getItem(STORAGE_KEYS.timer));
    return ([30, 60, 120].includes(n) ? n : 60) as TimerOption;
  });
  const [soundOn, setSoundOn] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEYS.sound) !== "false",
  );

  const [practiceOp, setPracticeOp] = useState<Operation>(
    () => (localStorage.getItem(STORAGE_KEYS.practiceOp) as Operation) || "mul",
  );
  const [practiceFamily, setPracticeFamily] = useState<number>(
    () => readNum(STORAGE_KEYS.practiceFamily, 2),
  );

  const [highScore, setHighScore] = useState<number>(() =>
    readNum(highScoreKey(operation, difficulty, timer), 0),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.operation, operation), [operation]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.difficulty, difficulty), [difficulty]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.timer, String(timer)), [timer]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.sound, String(soundOn)), [soundOn]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.practiceOp, practiceOp), [practiceOp]);
  useEffect(
    () => localStorage.setItem(STORAGE_KEYS.practiceFamily, String(practiceFamily)),
    [practiceFamily],
  );
  useEffect(() => {
    setHighScore(readNum(highScoreKey(operation, difficulty, timer), 0));
  }, [operation, difficulty, timer]);

  const startGame = () => {
    setResult(null);
    setIsNewHigh(false);
    setScreen("game");
  };

  const startPractice = (op: Operation, family: number) => {
    setPracticeOp(op);
    setPracticeFamily(family);
    setResult(null);
    setIsNewHigh(false);
    setScreen("practice");
  };

  const handleEnd = (r: GameResult) => {
    setResult(r);
    if (!r.practice) {
      const beat = r.score > highScore;
      if (beat) {
        setHighScore(r.score);
        localStorage.setItem(highScoreKey(operation, difficulty, timer), String(r.score));
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
          onStart={startGame}
          onPracticeMode={() => setScreen("practiceSetup")}
        />
      )}
      {screen === "practiceSetup" && (
        <PracticeSetupScreen
          initialOperation={practiceOp}
          initialFamily={practiceFamily}
          onBack={() => setScreen("setup")}
          onStart={startPractice}
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
      {screen === "practice" && (
        <GameScreen
          operation={practiceOp}
          difficulty={difficulty}
          timer="practice"
          practiceFamily={practiceFamily}
          soundOn={soundOn}
          onEnd={handleEnd}
          onQuit={() => setScreen("practiceSetup")}
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
          operation={result.operation}
          family={result.family}
          onPlayAgain={() => {
            if (result.practice) {
              startPractice(result.operation, result.family || 1);
            } else {
              startGame();
            }
          }}
          onChooseAnother={
            result.practice ? () => setScreen("practiceSetup") : undefined
          }
          onHome={() => setScreen("setup")}
        />
      )}
    </main>
  );
};

export default Index;

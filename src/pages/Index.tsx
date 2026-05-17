import { useEffect, useState } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { PracticeSetupScreen } from "@/components/PracticeSetupScreen";
import { GameScreen, GameResult } from "@/components/GameScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { LearnScreen } from "@/components/LearnScreen";
import {
  Difficulty,
  Operation,
  STORAGE_KEYS,
  TimerOption,
  highScoreKey,
} from "@/lib/game";
import { getActiveProfileId, pkey, setActiveProfileId } from "@/lib/profiles";

type Screen = "setup" | "practiceSetup" | "game" | "practice" | "learn" | "results";

const readNum = (key: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const readStr = (key: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("setup");
  const [profileId, setProfileId] = useState<string>(() => getActiveProfileId());

  // Profile-scoped state (re-init when profile changes via effect below)
  const [operation, setOperation] = useState<Operation>(
    () => (readStr(pkey(profileId, STORAGE_KEYS.operation), "mul") as Operation),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => (readStr(pkey(profileId, STORAGE_KEYS.difficulty), "easy") as Difficulty),
  );
  const [timer, setTimer] = useState<TimerOption>(() => {
    const n = readNum(pkey(profileId, STORAGE_KEYS.timer), 60);
    return ([30, 60, 120].includes(n) ? n : 60) as TimerOption;
  });
  const [soundOn, setSoundOn] = useState<boolean>(
    () => readStr(pkey(profileId, STORAGE_KEYS.sound), "true") !== "false",
  );
  const [practiceOp, setPracticeOp] = useState<Operation>(
    () => (readStr(pkey(profileId, STORAGE_KEYS.practiceOp), "mul") as Operation),
  );
  const [practiceFamily, setPracticeFamily] = useState<number>(
    () => readNum(pkey(profileId, STORAGE_KEYS.practiceFamily), 2),
  );

  const [highScore, setHighScore] = useState<number>(() =>
    readNum(pkey(profileId, highScoreKey(operation, difficulty, timer)), 0),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Persist active profile + reload all profile-scoped state when profile changes.
  useEffect(() => {
    setActiveProfileId(profileId);
    const op = (readStr(pkey(profileId, STORAGE_KEYS.operation), "mul") as Operation);
    const diff = (readStr(pkey(profileId, STORAGE_KEYS.difficulty), "easy") as Difficulty);
    const tn = readNum(pkey(profileId, STORAGE_KEYS.timer), 60);
    const t = ([30, 60, 120].includes(tn) ? tn : 60) as TimerOption;
    setOperation(op);
    setDifficulty(diff);
    setTimer(t);
    setSoundOn(readStr(pkey(profileId, STORAGE_KEYS.sound), "true") !== "false");
    setPracticeOp(readStr(pkey(profileId, STORAGE_KEYS.practiceOp), "mul") as Operation);
    setPracticeFamily(readNum(pkey(profileId, STORAGE_KEYS.practiceFamily), 2));
    setHighScore(readNum(pkey(profileId, highScoreKey(op, diff, t)), 0));
  }, [profileId]);

  useEffect(
    () => localStorage.setItem(pkey(profileId, STORAGE_KEYS.operation), operation),
    [profileId, operation],
  );
  useEffect(
    () => localStorage.setItem(pkey(profileId, STORAGE_KEYS.difficulty), difficulty),
    [profileId, difficulty],
  );
  useEffect(
    () => localStorage.setItem(pkey(profileId, STORAGE_KEYS.timer), String(timer)),
    [profileId, timer],
  );
  useEffect(
    () => localStorage.setItem(pkey(profileId, STORAGE_KEYS.sound), String(soundOn)),
    [profileId, soundOn],
  );
  useEffect(
    () => localStorage.setItem(pkey(profileId, STORAGE_KEYS.practiceOp), practiceOp),
    [profileId, practiceOp],
  );
  useEffect(
    () =>
      localStorage.setItem(
        pkey(profileId, STORAGE_KEYS.practiceFamily),
        String(practiceFamily),
      ),
    [profileId, practiceFamily],
  );
  useEffect(() => {
    setHighScore(
      readNum(pkey(profileId, highScoreKey(operation, difficulty, timer)), 0),
    );
  }, [profileId, operation, difficulty, timer]);

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

  const openLearn = (op: Operation, family: number) => {
    setPracticeOp(op);
    setPracticeFamily(family);
    setScreen("learn");
  };

  const handleEnd = (r: GameResult) => {
    setResult(r);
    if (!r.practice) {
      const beat = r.score > highScore;
      if (beat) {
        setHighScore(r.score);
        localStorage.setItem(
          pkey(profileId, highScoreKey(operation, difficulty, timer)),
          String(r.score),
        );
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
          activeProfileId={profileId}
          onProfileChange={setProfileId}
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
          onLearn={openLearn}
        />
      )}
      {screen === "learn" && (
        <LearnScreen
          operation={practiceOp}
          family={practiceFamily}
          onBack={() => setScreen("practiceSetup")}
          onStartPractice={() => startPractice(practiceOp, practiceFamily)}
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

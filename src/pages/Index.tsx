import { useEffect, useState } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { PracticeSetupScreen } from "@/components/PracticeSetupScreen";
import { GameScreen, GameResult } from "@/components/GameScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { LearnScreen } from "@/components/LearnScreen";
import { AdventureScreen } from "@/components/AdventureScreen";
import {
  ADVENTURE_DURATION,
  AdventureDifficulty,
  Difficulty,
  Operation,
  STORAGE_KEYS,
  TargetScore,
  TimerOption,
  adventureDayKey,
  highScoreKey,
  todayKey,
} from "@/lib/game";
import { getActiveProfileId, pkey, setActiveProfileId } from "@/lib/profiles";

type Screen =
  | "setup"
  | "practiceSetup"
  | "game"
  | "practice"
  | "learn"
  | "adventure"
  | "challenge"
  | "results";

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

const readTimer = (profileId: string): TimerOption => {
  const v = readStr(pkey(profileId, STORAGE_KEYS.timer), "60");
  if (v === "endless") return "endless";
  const n = Number(v);
  if ([30, 60, 120, 300, 600].includes(n)) return n as TimerOption;
  return 60;
};

const readTarget = (profileId: string): TargetScore => {
  const v = readStr(pkey(profileId, STORAGE_KEYS.target), "endless");
  if (v === "endless") return "endless";
  const n = Number(v);
  if ([10, 25, 50, 100].includes(n)) return n as TargetScore;
  return "endless";
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("setup");
  const [profileId, setProfileId] = useState<string>(() => getActiveProfileId());

  const [operation, setOperation] = useState<Operation>(
    () => readStr(pkey(profileId, STORAGE_KEYS.operation), "mul") as Operation,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => readStr(pkey(profileId, STORAGE_KEYS.difficulty), "easy") as Difficulty,
  );
  const [timer, setTimer] = useState<TimerOption>(() => readTimer(profileId));
  const [target, setTarget] = useState<TargetScore>(() => readTarget(profileId));
  const [soundOn, setSoundOn] = useState<boolean>(
    () => readStr(pkey(profileId, STORAGE_KEYS.sound), "true") !== "false",
  );
  const [practiceOp, setPracticeOp] = useState<Operation>(
    () => readStr(pkey(profileId, STORAGE_KEYS.practiceOp), "mul") as Operation,
  );
  const [practiceFamily, setPracticeFamily] = useState<number>(
    () => readNum(pkey(profileId, STORAGE_KEYS.practiceFamily), 2),
  );
  const [challengeDiff, setChallengeDiff] = useState<AdventureDifficulty>("easy");

  const [highScore, setHighScore] = useState<number>(() =>
    readNum(pkey(profileId, highScoreKey(operation, difficulty, timer)), 0),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [continueScore, setContinueScore] = useState(0);
  const [bumpKey, setBumpKey] = useState(0); // force AdventureScreen re-read

  useEffect(() => {
    setActiveProfileId(profileId);
    setOperation(readStr(pkey(profileId, STORAGE_KEYS.operation), "mul") as Operation);
    setDifficulty(readStr(pkey(profileId, STORAGE_KEYS.difficulty), "easy") as Difficulty);
    setTimer(readTimer(profileId));
    setTarget(readTarget(profileId));
    setSoundOn(readStr(pkey(profileId, STORAGE_KEYS.sound), "true") !== "false");
    setPracticeOp(readStr(pkey(profileId, STORAGE_KEYS.practiceOp), "mul") as Operation);
    setPracticeFamily(readNum(pkey(profileId, STORAGE_KEYS.practiceFamily), 2));
  }, [profileId]);

  useEffect(() => {
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.operation), operation);
  }, [profileId, operation]);
  useEffect(() => {
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.difficulty), difficulty);
  }, [profileId, difficulty]);
  useEffect(() => {
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.timer), String(timer));
  }, [profileId, timer]);
  useEffect(() => {
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.target), String(target));
  }, [profileId, target]);
  useEffect(() => {
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.sound), String(soundOn));
  }, [profileId, soundOn]);
  useEffect(() => {
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.practiceOp), practiceOp);
  }, [profileId, practiceOp]);
  useEffect(() => {
    localStorage.setItem(
      pkey(profileId, STORAGE_KEYS.practiceFamily),
      String(practiceFamily),
    );
  }, [profileId, practiceFamily]);
  useEffect(() => {
    setHighScore(readNum(pkey(profileId, highScoreKey(operation, difficulty, timer)), 0));
  }, [profileId, operation, difficulty, timer]);

  const startGame = () => {
    setResult(null);
    setIsNewHigh(false);
    setContinueScore(0);
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

  const startChallenge = (diff: AdventureDifficulty) => {
    setChallengeDiff(diff);
    setResult(null);
    setIsNewHigh(false);
    setScreen("challenge");
  };

  const handleEnd = (r: GameResult) => {
    setResult(r);
    if (r.challenge) {
      // Save best stars for the day for this profile.
      const key = pkey(profileId, adventureDayKey(todayKey(), r.challenge));
      const prev = readNum(key, 0);
      const next = Math.max(prev, r.starsEarned ?? 0);
      if (next !== prev) localStorage.setItem(key, String(next));
      setBumpKey((k) => k + 1);
      setIsNewHigh(false);
    } else if (!r.practice) {
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
          target={target}
          soundOn={soundOn}
          highScore={highScore}
          activeProfileId={profileId}
          onProfileChange={setProfileId}
          onOperation={setOperation}
          onDifficulty={setDifficulty}
          onTimer={setTimer}
          onTarget={setTarget}
          onToggleSound={() => setSoundOn((s) => !s)}
          onStart={startGame}
          onPracticeMode={() => setScreen("practiceSetup")}
          onAdventure={() => setScreen("adventure")}
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
      {screen === "adventure" && (
        <AdventureScreen
          key={bumpKey}
          profileId={profileId}
          onBack={() => setScreen("setup")}
          onStartChallenge={startChallenge}
        />
      )}
      {screen === "game" && (
        <GameScreen
          operation={operation}
          difficulty={difficulty}
          timer={timer}
          targetScore={target}
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
      {screen === "challenge" && (
        <GameScreen
          operation={"add"}
          difficulty={"easy"}
          timer={ADVENTURE_DURATION as TimerOption}
          challenge={challengeDiff}
          targetScore="endless"
          soundOn={soundOn}
          onEnd={handleEnd}
          onQuit={() => setScreen("adventure")}
        />
      )}
      {screen === "results" && result && (
        <ResultsScreen
          score={result.score + continueScore}
          total={result.total}
          accuracy={result.accuracy}
          bestStreak={result.bestStreak}
          highScore={highScore}
          isNewHighScore={isNewHigh}
          practice={result.practice}
          operation={result.operation}
          family={result.family}
          targetReached={result.targetReached}
          targetScore={result.targetScore}
          challenge={result.challenge}
          starsEarned={result.starsEarned}
          onContinue={
            result.targetReached
              ? () => {
                  // Continue playing — restart same game but keep the target as endless to avoid re-triggering
                  setContinueScore(result.score);
                  setTarget("endless");
                  setScreen("game");
                }
              : undefined
          }
          onPlayAgain={() => {
            if (result.challenge) {
              startChallenge(result.challenge);
            } else if (result.practice) {
              startPractice(result.operation, result.family || 1);
            } else {
              startGame();
            }
          }}
          onChooseAnother={
            result.practice ? () => setScreen("practiceSetup") : undefined
          }
          onHome={() => {
            setContinueScore(0);
            setScreen(result.challenge ? "adventure" : "setup");
          }}
        />
      )}
    </main>
  );
};

export default Index;

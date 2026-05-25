import { useEffect, useState } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { PracticeSetupScreen } from "@/components/PracticeSetupScreen";
import { GameScreen, GameResult } from "@/components/GameScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { LearnScreen } from "@/components/LearnScreen";
import { AdventureScreen } from "@/components/AdventureScreen";
import { CalendarScreen } from "@/components/CalendarScreen";
import { ClassroomScreen } from "@/components/ClassroomScreen";
import {
  ADVENTURE_DURATION,
  AdventureDifficulty,
  Difficulty,
  Operation,
  STORAGE_KEYS,
  StarTier,
  TargetScore,
  TimerOption,
  highScoreKey,
  hsAccKey,
  hsScoreKey,
  starTimeKey,
  tierUnlockedKey,
  todayKey,
} from "@/lib/game";
import {
  getActiveProfileId,
  isClassroomStudentId,
  pkey,
  setActiveProfileId,
} from "@/lib/profiles";

type Screen =
  | "setup"
  | "classroom"
  | "practiceSetup"
  | "game"
  | "practice"
  | "learn"
  | "adventure"
  | "calendar"
  | "starChallenge"
  | "hsChallenge"
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

const readAdvDiff = (profileId: string): AdventureDifficulty => {
  const v = readStr(pkey(profileId, STORAGE_KEYS.adventureDiff), "easy");
  if (v === "medium" || v === "hard") return v;
  return "easy";
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
  const [practiceFamily, setPracticeFamily] = useState<number>(() =>
    readNum(pkey(profileId, STORAGE_KEYS.practiceFamily), 2),
  );
  const [adventureDiff, setAdventureDiff] = useState<AdventureDifficulty>(() =>
    readAdvDiff(profileId),
  );
  const [activeStarTier, setActiveStarTier] = useState<StarTier>("bronze");

  const [highScore, setHighScore] = useState<number>(() =>
    readNum(pkey(profileId, highScoreKey(operation, difficulty, timer)), 0),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [continueScore, setContinueScore] = useState(0);

  // Sync profile-scoped settings when active profile changes
  useEffect(() => {
    setActiveProfileId(profileId);
    setOperation(readStr(pkey(profileId, STORAGE_KEYS.operation), "mul") as Operation);
    setDifficulty(readStr(pkey(profileId, STORAGE_KEYS.difficulty), "easy") as Difficulty);
    setTimer(readTimer(profileId));
    setTarget(readTarget(profileId));
    setSoundOn(readStr(pkey(profileId, STORAGE_KEYS.sound), "true") !== "false");
    setPracticeOp(readStr(pkey(profileId, STORAGE_KEYS.practiceOp), "mul") as Operation);
    setPracticeFamily(readNum(pkey(profileId, STORAGE_KEYS.practiceFamily), 2));
    setAdventureDiff(readAdvDiff(profileId));
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
    localStorage.setItem(pkey(profileId, STORAGE_KEYS.adventureDiff), adventureDiff);
  }, [profileId, adventureDiff]);
  useEffect(() => {
    setHighScore(readNum(pkey(profileId, highScoreKey(operation, difficulty, timer)), 0));
  }, [profileId, operation, difficulty, timer]);

  const handleProfileChange = (id: string) => {
    if (id === "classroom") {
      setScreen("classroom");
      return;
    }
    setProfileId(id);
  };

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

  const startStar = (diff: AdventureDifficulty, tier: StarTier) => {
    setAdventureDiff(diff);
    setActiveStarTier(tier);
    setResult(null);
    setIsNewHigh(false);
    setScreen("starChallenge");
  };

  const startHighScore = (diff: AdventureDifficulty) => {
    setAdventureDiff(diff);
    setResult(null);
    setIsNewHigh(false);
    setScreen("hsChallenge");
  };

  const handleEnd = (r: GameResult) => {
    setResult(r);
    const today = todayKey();
    if (r.starTier) {
      if (r.starEarned && r.elapsedSeconds !== undefined) {
        // Record best (lowest) time
        const k = pkey(profileId, starTimeKey(today, r.starTier));
        const prev = window.localStorage.getItem(k);
        const prevN = prev ? Number(prev) : Infinity;
        if (r.elapsedSeconds < prevN) {
          localStorage.setItem(k, String(r.elapsedSeconds));
        }
        // Mark tier unlocked all-time
        localStorage.setItem(pkey(profileId, tierUnlockedKey(r.starTier)), "1");
      }
      setIsNewHigh(false);
    } else if (r.highScoreChallenge) {
      const k = pkey(profileId, hsScoreKey(today));
      const prev = readNum(k, 0);
      if (r.score > prev) {
        localStorage.setItem(k, String(r.score));
        localStorage.setItem(pkey(profileId, hsAccKey(today)), String(r.accuracy));
        setIsNewHigh(true);
      } else {
        setIsNewHigh(false);
      }
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
          onProfileChange={handleProfileChange}
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
      {screen === "classroom" && (
        <ClassroomScreen
          onBack={() => setScreen("setup")}
          onPickStudent={(id) => {
            setProfileId(id);
            setScreen("setup");
          }}
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
          profileId={profileId}
          difficulty={adventureDiff}
          onDifficultyChange={setAdventureDiff}
          onBack={() => setScreen("setup")}
          onStartStar={startStar}
          onStartHighScore={startHighScore}
          onOpenCalendar={() => setScreen("calendar")}
        />
      )}
      {screen === "calendar" && (
        <CalendarScreen profileId={profileId} onBack={() => setScreen("adventure")} />
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
      {screen === "starChallenge" && (
        <GameScreen
          operation={"add"}
          difficulty={"easy"}
          timer={ADVENTURE_DURATION as TimerOption}
          challenge={adventureDiff}
          starTier={activeStarTier}
          targetScore="endless"
          soundOn={soundOn}
          onEnd={handleEnd}
          onQuit={() => setScreen("adventure")}
        />
      )}
      {screen === "hsChallenge" && (
        <GameScreen
          operation={"add"}
          difficulty={"easy"}
          timer={ADVENTURE_DURATION as TimerOption}
          challenge={adventureDiff}
          isHighScoreChallenge
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
          starTier={result.starTier}
          starEarned={result.starEarned}
          highScoreChallenge={result.highScoreChallenge}
          elapsedSeconds={result.elapsedSeconds}
          onContinue={
            result.targetReached
              ? () => {
                  setContinueScore(result.score);
                  setTarget("endless");
                  setScreen("game");
                }
              : undefined
          }
          onPlayAgain={() => {
            if (result.starTier) {
              startStar(result.challenge ?? adventureDiff, result.starTier);
            } else if (result.highScoreChallenge) {
              startHighScore(result.challenge ?? adventureDiff);
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
            const isAdventure = result.starTier || result.highScoreChallenge || result.challenge;
            setScreen(isAdventure ? "adventure" : "setup");
          }}
        />
      )}
    </main>
  );
};

export default Index;

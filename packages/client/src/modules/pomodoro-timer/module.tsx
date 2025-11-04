import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Target, TrendingUp } from "lucide-react";
import { buttonInteraction } from "@/utils/animation-presets";

interface PomodoroSession {
  id: string;
  type: "work" | "break";
  duration: number;
  completedAt: string;
}

interface PomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  todaySessions: number;
}

const WORK_DURATION = 25 * 60; // 25 分钟
const BREAK_DURATION = 5 * 60; // 5 分钟
const LONG_BREAK_DURATION = 15 * 60; // 15 分钟

export default function PomodoroTimerModule() {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break" | "longBreak">("work");
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 计算统计数据
  const stats: PomodoroStats = {
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
    todaySessions: sessions.filter((s) => {
      const today = new Date().toDateString();
      return new Date(s.completedAt).toDateString() === today;
    }).length,
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 获取当前模式的总时长
  const getTotalDuration = (): number => {
    switch (mode) {
      case "work":
        return WORK_DURATION;
      case "break":
        return BREAK_DURATION;
      case "longBreak":
        return LONG_BREAK_DURATION;
    }
  };

  // 计算进度百分比
  const progress = ((getTotalDuration() - timeLeft) / getTotalDuration()) * 100;

  // 完成会话
  const completeSession = useCallback(() => {
    if (mode === "work") {
      const newSession: PomodoroSession = {
        id: `session-${Date.now()}`,
        type: "work",
        duration: WORK_DURATION / 60,
        completedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setSessionCount((prev) => prev + 1);

      // 决定休息类型
      if ((sessionCount + 1) % 4 === 0) {
        setMode("longBreak");
        setTimeLeft(LONG_BREAK_DURATION);
      } else {
        setMode("break");
        setTimeLeft(BREAK_DURATION);
      }
    } else {
      // 休息结束，回到工作模式
      setMode("work");
      setTimeLeft(WORK_DURATION);
    }
    setIsRunning(false);

    // 播放提示音
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // 忽略自动播放错误
      });
    }
  }, [mode, sessionCount]);

  // 计时器逻辑
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, completeSession]);

  // 开始/暂停
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // 重置计时器
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalDuration());
  };

  // 切换模式
  const switchMode = (newMode: "work" | "break" | "longBreak") => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case "work":
        setTimeLeft(WORK_DURATION);
        break;
      case "break":
        setTimeLeft(BREAK_DURATION);
        break;
      case "longBreak":
        setTimeLeft(LONG_BREAK_DURATION);
        break;
    }
  };

  // 获取模式配置
  const getModeConfig = () => {
    switch (mode) {
      case "work":
        return {
          label: "专注工作",
          icon: <Target className="h-5 w-5" />,
          color: "from-red-400 to-rose-500",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          textColor: "text-red-600 dark:text-red-400",
        };
      case "break":
        return {
          label: "短休息",
          icon: <Coffee className="h-5 w-5" />,
          color: "from-green-400 to-emerald-500",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          textColor: "text-green-600 dark:text-green-400",
        };
      case "longBreak":
        return {
          label: "长休息",
          icon: <Coffee className="h-5 w-5" />,
          color: "from-blue-400 to-cyan-500",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          textColor: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  const modeConfig = getModeConfig();

  return (
    <div className="flex h-full flex-col gap-6 rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)] p-6 text-[var(--text-primary)]">
      {/* 音频元素 */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGm98OScTgwPUKnl8LNnHAU2kdfzyn0vBSR3yPDck0QKFF7A6OyrWBUIQ5zd8r9xJAYsfsr0240+CRZiuO7mnFoODU+q5/O1aR0FOJLb88p/MAUlec3w3JVFCxVfwunrr1oWCEGZ3PK3cSUGLH7M9N2OQAkWYrru6KJfEAxPqujzsmseBTeT3fPMgjEFJnvQ8N2XSAsUX7zn66tWFQc9kdnyo24iBS2AzvTdjUEJFmG56+mhXBANT67p9LRuHwU4lN7zzIQzBSZ80fDdmUoLFWC96+yqVxYHP5Hb8qNvIgYtgM703Y5ACRZhuerpoV8RDE+u6/SzbCEFN5Te88yFNAUnfdLw3ppLCxVgve7sqVoWCECS2/OjcSQGLYDP9N6OQQkWYrrr6qNfEAxOrunzsmsjBTiU3vPMhTQFJ37T8N6bTAsVYL7u7KxbGAhAktzzoXEkBy2Az/XekUMJFmK66+miYBEMTq7p9LNrJAU4lN/zzIY0BSd+0/DdnU0LFV++7uytWxgIQJPd86RyJActgM/13pFDCRVhuuvqo2ARC06u6vSza1gFOJTe88yGNAUofNPw3Z1OCxZfv+7srFsYCECT3fOkciYHLYHQ9d6RRAoVYrrs6qNgEgxPrvry7akUCDiU3vPNhjQFJ3zT8N6dTgsWX7/u7KxbGQdBk9zzpHImBy2A0PXekUQKFWK56+qjYRIMT671i=" />

      {/* 标题栏 */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
            Pomodoro Timer
          </p>
          <h1 className="mt-1 text-2xl font-semibold">番茄钟计时器</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            专注 25 分钟，休息 5 分钟，保持高效节奏
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-soft)] px-4 py-3 text-center text-sm">
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">今日</p>
            <p className="text-lg font-semibold">{stats.todaySessions}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">总计</p>
            <p className="text-lg font-semibold">{stats.totalSessions}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">时长 (min)</p>
            <p className="text-lg font-semibold">{stats.totalMinutes}</p>
          </div>
        </div>
      </header>

      {/* 主计时器 */}
      <section className="flex flex-col items-center gap-6 rounded-2xl border border-[var(--shell-border)] bg-gradient-to-br from-[var(--shell-soft)] to-[var(--shell-surface)] p-8">
        {/* 模式标签 */}
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 ${modeConfig.bgColor} ${modeConfig.textColor}`}
        >
          {modeConfig.icon}
          <span className="text-sm font-semibold">{modeConfig.label}</span>
        </div>

        {/* 时间显示 */}
        <div className="relative">
          {/* 进度环 */}
          <svg className="h-64 w-64 -rotate-90 transform">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="var(--shell-border)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke={`url(#gradient-${mode})`}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id={`gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  className={mode === "work" ? "text-red-400" : mode === "break" ? "text-green-400" : "text-blue-400"}
                  stopColor="currentColor"
                />
                <stop
                  offset="100%"
                  className={mode === "work" ? "text-rose-500" : mode === "break" ? "text-emerald-500" : "text-cyan-500"}
                  stopColor="currentColor"
                />
              </linearGradient>
            </defs>
          </svg>

          {/* 时间文字 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-6xl font-bold tabular-nums">{formatTime(timeLeft)}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {isRunning ? "专注进行中..." : "准备开始"}
            </p>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-3">
          <motion.button
            {...buttonInteraction}
            onClick={toggleTimer}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-[background,transform] duration-250 ease-swift ${
              isRunning
                ? "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600"
                : "bg-gradient-to-r " + modeConfig.color
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                暂停
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                开始
              </>
            )}
          </motion.button>

          <button
            onClick={resetTimer}
            className="flex items-center gap-2 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-surface)] px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--shell-soft)]"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
        </div>
      </section>

      {/* 模式切换 */}
      <section className="grid grid-cols-3 gap-3">
        <motion.button
          {...buttonInteraction}
          onClick={() => switchMode("work")}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-250 ease-swift ${
            mode === "work"
              ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              : "border-[var(--shell-border)] bg-[var(--shell-soft)] hover:bg-[var(--shell-surface)]"
          }`}
        >
          <Target className="mx-auto mb-1 h-5 w-5" />
          工作 25min
        </motion.button>

        <motion.button
          {...buttonInteraction}
          onClick={() => switchMode("break")}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-250 ease-swift ${
            mode === "break"
              ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
              : "border-[var(--shell-border)] bg-[var(--shell-soft)] hover:bg-[var(--shell-surface)]"
          }`}
        >
          <Coffee className="mx-auto mb-1 h-5 w-5" />
          短休息 5min
        </motion.button>

        <motion.button
          {...buttonInteraction}
          onClick={() => switchMode("longBreak")}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-250 ease-swift ${
            mode === "longBreak"
              ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
              : "border-[var(--shell-border)] bg-[var(--shell-soft)] hover:bg-[var(--shell-surface)]"
          }`}
        >
          <Coffee className="mx-auto mb-1 h-5 w-5" />
          长休息 15min
        </motion.button>
      </section>

      {/* 历史记录 */}
      <section className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-soft)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--text-secondary)]" />
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">完成记录</h2>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-2 text-sm">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-transparent bg-[var(--shell-surface)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-gradient-to-r from-red-400 to-rose-500 p-1.5">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium">专注时段</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {new Date(session.completedAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                    {session.duration} 分钟
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--text-secondary)]">
            还没有完成记录，开始第一个番茄钟吧！🍅
          </p>
        )}
      </section>
    </div>
  );
}

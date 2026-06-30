import {
  Archive,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Edit3,
  ListPlus,
  Plus,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent, ReactNode } from "react";

type ActivityType = string;

type ExerciseEntry = {
  id: string;
  exerciseName: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  notes?: string;
};

type ActivityLog = {
  id: string;
  date: string;
  activityType: ActivityType;
  customActivityName?: string;
  activityColor?: string;
  durationMinutes?: number;
  notes?: string;
  exercises: ExerciseEntry[];
};

type WeeklyPlanItem = {
  id: string;
  activityType: ActivityType;
  customActivityName?: string;
  activityColor?: string;
  weekdays: number[];
  durationMinutes?: number;
  notes?: string;
};

type OneOffPlanItem = {
  id: string;
  date: string;
  activityType: ActivityType;
  customActivityName?: string;
  activityColor?: string;
  durationMinutes?: number;
  notes?: string;
};

type ActivityPlanItem = WeeklyPlanItem | OneOffPlanItem;

type PastActivityOption = {
  name: string;
  activityColor?: string;
};

type TabKey = "today" | "week" | "gym" | "archive";

type ArchiveWeek = {
  key: string;
  label: string;
  logs: ActivityLog[];
  start: Date;
};

type ActivityDetail =
  | {
      kind: "log";
      log: ActivityLog;
    }
  | {
      kind: "plan";
      planItem: ActivityPlanItem;
      date: string;
    };

type CalendarActivityChip =
  | {
      id: string;
      activityType: ActivityType;
      customActivityName?: string;
      activityColor?: string;
      status: "done";
      log: ActivityLog;
    }
  | {
      id: string;
      activityType: ActivityType;
      customActivityName?: string;
      activityColor?: string;
      status: "scheduled";
      planItem: ActivityPlanItem;
    };

const storageKey = "activity-tracker.logs.v1";
const scheduleStorageKey = "activity-tracker.weekly-plan.v1";
const oneOffPlanStorageKey = "activity-tracker.one-off-plan.v1";

const weekdays = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
];

type ActivityColorOption = {
  name: string;
  value: string;
  soft?: string;
  text?: string;
};

const activityColorOptions: ActivityColorOption[] = [
  { name: "Black", value: "#000000" },
  { name: "Charcoal", value: "#444444" },
  { name: "Grey", value: "#666666" },
  { name: "Silver", value: "#999999" },
  { name: "Light grey", value: "#b7b7b7" },
  { name: "Pale grey", value: "#cccccc" },
  { name: "Soft grey", value: "#dddddd" },
  { name: "Mist", value: "#eeeeee" },
  { name: "White", value: "#ffffff" },
  { name: "Deep red", value: "#990000" },
  { name: "Red", value: "#b23b43" },
  { name: "Orange", value: "#ff9900" },
  { name: "Yellow", value: "#ffff00" },
  { name: "Lime", value: "#00ff00" },
  { name: "Cyan", value: "#00ffff" },
  { name: "Sky blue", value: "#4a86e8" },
  { name: "Blue", value: "#0000ff" },
  { name: "Violet", value: "#9900ff" },
  { name: "Magenta", value: "#ff00ff" },
  { name: "Blush", value: "#ead1dc" },
  { name: "Light coral", value: "#f4cccc" },
  { name: "Peach", value: "#fce5cd" },
  { name: "Cream", value: "#fff2cc" },
  { name: "Mint", value: "#d9ead3" },
  { name: "Pale teal", value: "#d0e0e3" },
  { name: "Pale blue", value: "#cfe2f3" },
  { name: "Lavender", value: "#d9d2e9" },
  { name: "Salmon", value: "#e06666" },
  { name: "Apricot", value: "#f6b26b" },
  { name: "Light gold", value: "#ffd966" },
  { name: "Sage", value: "#93c47d" },
  { name: "Slate teal", value: "#76a5af" },
  { name: "Cornflower", value: "#6d9eeb" },
  { name: "Periwinkle", value: "#8e7cc3" },
  { name: "Mauve", value: "#c27ba0" },
  { name: "Tomato", value: "#cc4125" },
  { name: "Crimson", value: "#cc0000" },
  { name: "Tangerine", value: "#e69138" },
  { name: "Amber", value: "#f1c232" },
  { name: "Green", value: "#1f7a55", soft: "#e1f1e8", text: "#135e3f" },
  { name: "Steel teal", value: "#45818e" },
  { name: "Royal blue", value: "#3c78d8" },
  { name: "Medium blue", value: "#3d85c6" },
  { name: "Purple", value: "#7457a6", soft: "#eee9f6", text: "#584080" },
  { name: "Berry", value: "#a64d79" },
  { name: "Brick", value: "#85200c" },
  { name: "Burnt orange", value: "#b45f06" },
  { name: "Mustard", value: "#bf9000" },
  { name: "Forest", value: "#38761d" },
  { name: "Deep teal", value: "#134f5c" },
  { name: "Navy", value: "#1155cc" },
  { name: "Ocean", value: "#0b5394" },
  { name: "Indigo", value: "#351c75" },
  { name: "Plum", value: "#741b47" },
  { name: "Espresso", value: "#5b0f00" },
  { name: "Maroon", value: "#660000" },
  { name: "Brown", value: "#783f04" },
  { name: "Olive", value: "#7f6000" },
  { name: "Moss", value: "#274e13" },
  { name: "Ink teal", value: "#0c343d" },
  { name: "Dark navy", value: "#1c4587" },
  { name: "Midnight", value: "#073763" },
  { name: "Deep purple", value: "#20124d" },
  { name: "Wine", value: "#4c1130" },
  { name: "Teal", value: "#14808a", soft: "#def2f3", text: "#0d626a" },
  { name: "Squash orange", value: "#ad6532", soft: "#f5e8dc", text: "#8f4e23" },
  { name: "Badminton blue", value: "#1d5e8c", soft: "#e7f0f7", text: "#16496e" },
];

const fallbackActivityColor = "#1f7a55";

const defaultActivityColors: Record<string, string> = {
  Gym: "#1f7a55",
  "Personal Training": "#7457a6",
  Handstand: "#14808a",
  Squash: "#ad6532",
  Badminton: "#1d5e8c",
};

const todayInputValue = () => formatDateInput(new Date());

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? new Date().getFullYear(), (month ?? 1) - 1, day ?? 1);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string | Date) {
  const date = typeof value === "string" ? parseInputDate(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const startLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(end);
  return `${startLabel} - ${endLabel}`;
}

function getWeekKey(date: Date) {
  return formatDateInput(startOfWeek(date));
}

function defaultActivityColor(activityType: ActivityType) {
  return defaultActivityColors[activityType] ?? fallbackActivityColor;
}

function resolveActivityColor(activity: { activityType: ActivityType; activityColor?: string }) {
  return activity.activityColor ?? defaultActivityColor(activity.activityType);
}

function colorMixSoft(value: string) {
  return `color-mix(in srgb, ${value} 16%, #ffffff)`;
}

function colorMixText(value: string) {
  return `color-mix(in srgb, ${value} 76%, #111111)`;
}

function findActivityColorOption(value: string) {
  return (
    activityColorOptions.find((option) => option.value === value) ??
    activityColorOptions.find((option) => option.value === fallbackActivityColor) ??
    activityColorOptions[0]!
  );
}

function activityColorMeta(activity: { activityType: ActivityType; activityColor?: string }) {
  const color = resolveActivityColor(activity);
  return findActivityColorOption(color);
}

function activityColorStyle(activity: { activityType: ActivityType; activityColor?: string }) {
  const color = activityColorMeta(activity);
  return {
    "--activity-color": color.value,
    "--activity-color-soft": color.soft ?? colorMixSoft(color.value),
    "--activity-color-text": color.text ?? colorMixText(color.value),
  } as CSSProperties;
}

function activityDisplayName(activity: { activityType: ActivityType; customActivityName?: string }) {
  if (activity.activityType === "Other" && activity.customActivityName?.trim()) {
    return normalizeActivityName(activity.customActivityName);
  }
  return normalizeActivityName(activity.activityType);
}

function activityShortLabel(activity: { activityType: ActivityType; customActivityName?: string }) {
  const displayName = activityDisplayName(activity);

  switch (displayName) {
    case "Personal Training":
      return "PT";
    case "Handstand":
      return "Hand";
    case "Badminton":
      return "Badm";
    default:
      return displayName.length > 6 ? displayName.slice(0, 6) : displayName;
  }
}

function normalizeActivityName(value = "") {
  return value.trim().replace(/\s+/g, " ");
}

function isGymActivityName(value: string) {
  return normalizeActivityName(value).toLowerCase() === "gym";
}

function activitiesMatch(
  first: { activityType: ActivityType; customActivityName?: string },
  second: { activityType: ActivityType; customActivityName?: string },
) {
  return activityDisplayName(first).toLowerCase() === activityDisplayName(second).toLowerCase();
}

function getActivityBreakdown(logs: ActivityLog[]) {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const name = activityDisplayName(log);
    if (name) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  });

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function getPastActivityOptions(
  logs: ActivityLog[],
  schedule: WeeklyPlanItem[],
  oneOffPlans: OneOffPlanItem[],
) {
  const options = new Map<string, { name: string; activityColor?: string }>();
  const addActivity = (activity: { activityType: ActivityType; customActivityName?: string; activityColor?: string }) => {
    const name = activityDisplayName(activity);
    const key = name.toLowerCase();
    if (name && !options.has(key)) {
      options.set(key, { name, activityColor: activity.activityColor });
    }
  };

  [...logs].reverse().forEach(addActivity);
  schedule.forEach(addActivity);
  oneOffPlans.forEach(addActivity);

  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function isOneOffPlanItem(item: ActivityPlanItem): item is OneOffPlanItem {
  return "date" in item;
}

function sortLogs(logs: ActivityLog[]) {
  return [...logs].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return activityDisplayName(a).localeCompare(activityDisplayName(b));
  });
}

function makeExercise(exerciseName = ""): ExerciseEntry {
  return {
    id: createId(),
    exerciseName,
    sets: undefined,
    reps: undefined,
    weightKg: undefined,
    notes: "",
  };
}

function seedLogs(): ActivityLog[] {
  const weekStart = startOfWeek(new Date());
  const previousWeekStart = addDays(weekStart, -7);

  return [
    {
      id: createId(),
      date: formatDateInput(weekStart),
      activityType: "Gym",
      activityColor: defaultActivityColor("Gym"),
      durationMinutes: 60,
      notes: "Steady strength session.",
      exercises: [
        {
          id: createId(),
          exerciseName: "Bench Press",
          sets: 3,
          reps: 8,
          weightKg: 60,
          notes: "Last set felt solid.",
        },
        {
          id: createId(),
          exerciseName: "Romanian Deadlift",
          sets: 3,
          reps: 10,
          weightKg: 80,
          notes: "Controlled tempo.",
        },
      ],
    },
    {
      id: createId(),
      date: formatDateInput(addDays(weekStart, 2)),
      activityType: "Squash",
      activityColor: defaultActivityColor("Squash"),
      durationMinutes: 45,
      notes: "Match play.",
      exercises: [],
    },
    {
      id: createId(),
      date: formatDateInput(addDays(previousWeekStart, 3)),
      activityType: "Badminton",
      activityColor: defaultActivityColor("Badminton"),
      durationMinutes: 60,
      notes: "Doubles games.",
      exercises: [],
    },
    {
      id: createId(),
      date: formatDateInput(addDays(previousWeekStart, 5)),
      activityType: "Handstand",
      activityColor: defaultActivityColor("Handstand"),
      durationMinutes: 30,
      notes: "Wall holds and kick-ups.",
      exercises: [],
    },
  ];
}

function seedSchedule(): WeeklyPlanItem[] {
  return [
    {
      id: createId(),
      activityType: "Personal Training",
      activityColor: defaultActivityColor("Personal Training"),
      weekdays: [0],
      durationMinutes: 60,
      notes: "Weekly PT slot.",
    },
    {
      id: createId(),
      activityType: "Squash",
      activityColor: defaultActivityColor("Squash"),
      weekdays: [6],
      durationMinutes: 45,
      notes: "Sunday squash.",
    },
  ];
}

function getStoredLogs() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return seedLogs();
  }

  try {
    const parsed = JSON.parse(stored) as ActivityLog[];
    return Array.isArray(parsed) ? parsed : seedLogs();
  } catch {
    return seedLogs();
  }
}

function getStoredSchedule() {
  const stored = localStorage.getItem(scheduleStorageKey);
  if (!stored) {
    return seedSchedule();
  }

  try {
    const parsed = JSON.parse(stored) as WeeklyPlanItem[];
    return Array.isArray(parsed) ? parsed : seedSchedule();
  } catch {
    return seedSchedule();
  }
}

function getStoredOneOffPlans() {
  const stored = localStorage.getItem(oneOffPlanStorageKey);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as OneOffPlanItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPlansForWeekday(schedule: WeeklyPlanItem[], weekdayIndex: number) {
  return schedule.filter((item) => item.weekdays.includes(weekdayIndex));
}

function getOneOffPlansForDate(oneOffPlans: OneOffPlanItem[], date: string) {
  return oneOffPlans.filter((item) => item.date === date);
}

function App() {
  const [logs, setLogs] = useState<ActivityLog[]>(getStoredLogs);
  const [schedule, setSchedule] = useState<WeeklyPlanItem[]>(getStoredSchedule);
  const [oneOffPlans, setOneOffPlans] = useState<OneOffPlanItem[]>(getStoredOneOffPlans);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [editingPlanItem, setEditingPlanItem] = useState<ActivityPlanItem | null>(null);
  const [activityDetail, setActivityDetail] = useState<ActivityDetail | null>(null);
  const [selectedArchiveWeek, setSelectedArchiveWeek] = useState<ArchiveWeek | null>(null);
  const lockedScrollTop = useRef(0);
  const isPopupOpen = Boolean(editingLog || editingPlanItem || activityDetail);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(scheduleStorageKey, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem(oneOffPlanStorageKey, JSON.stringify(oneOffPlans));
  }, [oneOffPlans]);

  useEffect(() => {
    if (!isPopupOpen) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousBodyOverflow = body.style.overflow;

    lockedScrollTop.current = window.scrollY;
    html.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollTop.current}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      body.style.overflow = previousBodyOverflow;
      window.scrollTo(0, lockedScrollTop.current);
    };
  }, [isPopupOpen]);

  const sortedLogs = useMemo(() => sortLogs(logs), [logs]);
  const pastActivityOptions = useMemo(
    () => getPastActivityOptions(sortedLogs, schedule, oneOffPlans),
    [oneOffPlans, schedule, sortedLogs],
  );
  const currentWeekStart = useMemo(() => startOfWeek(new Date()), []);
  const currentWeekKey = getWeekKey(currentWeekStart);
  const currentWeekLogs = sortedLogs.filter((log) => getWeekKey(parseInputDate(log.date)) === currentWeekKey);

  const archiveWeeks = useMemo(() => {
    const groups = new Map<string, ActivityLog[]>();
    sortedLogs.forEach((log) => {
      const weekKey = getWeekKey(parseInputDate(log.date));
      if (weekKey === currentWeekKey) {
        return;
      }

      groups.set(weekKey, [...(groups.get(weekKey) ?? []), log]);
    });

    const weekKeys = new Set<string>();
    for (let index = 1; index <= 12; index += 1) {
      weekKeys.add(formatDateInput(addDays(currentWeekStart, index * -7)));
    }
    groups.forEach((_weekLogs, weekKey) => weekKeys.add(weekKey));

    return [...weekKeys]
      .map((key) => {
        const start = parseInputDate(key);
        const weekLogs = groups.get(key) ?? [];
        return {
          key,
          label: formatWeekRange(start),
          logs: sortLogs(weekLogs),
          start,
        };
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [currentWeekKey, currentWeekStart, sortedLogs]);

  const upsertLog = (log: ActivityLog) => {
    setLogs((currentLogs) => {
      const exists = currentLogs.some((currentLog) => currentLog.id === log.id);
      if (exists) {
        return currentLogs.map((currentLog) => (currentLog.id === log.id ? log : currentLog));
      }
      return [...currentLogs, log];
    });
    setSelectedArchiveWeek((week) => {
      if (!week) {
        return null;
      }

      const logWeekKey = getWeekKey(parseInputDate(log.date));
      const withoutCurrentLog = week.logs.filter((weekLog) => weekLog.id !== log.id);
      const nextLogs = logWeekKey === week.key ? sortLogs([...withoutCurrentLog, log]) : withoutCurrentLog;
      return nextLogs.length ? { ...week, logs: nextLogs } : null;
    });
    setActivityDetail(null);
    setEditingLog(null);
  };

  const deleteLog = (logId: string) => {
    setLogs((currentLogs) => currentLogs.filter((log) => log.id !== logId));
    setEditingLog(null);
    setActivityDetail(null);
    setSelectedArchiveWeek((week) => {
      if (!week) {
        return null;
      }
      const nextLogs = week.logs.filter((log) => log.id !== logId);
      return nextLogs.length ? { ...week, logs: nextLogs } : null;
    });
  };

  const updateLogExerciseWeight = (logId: string, exerciseId: string, weightKg?: number) => {
    const updateLog = (log: ActivityLog): ActivityLog =>
      log.id === logId
        ? {
            ...log,
            exercises: log.exercises.map((exercise) =>
              exercise.id === exerciseId ? { ...exercise, weightKg } : exercise,
            ),
          }
        : log;

    setLogs((currentLogs) => currentLogs.map(updateLog));
    setSelectedArchiveWeek((week) => (week ? { ...week, logs: week.logs.map(updateLog) } : null));
    setEditingLog((log) => (log ? updateLog(log) : null));
    setActivityDetail((detail) =>
      detail?.kind === "log" && detail.log.id === logId ? { kind: "log", log: updateLog(detail.log) } : detail,
    );
  };

  const addScheduleItem = (item: WeeklyPlanItem) => {
    setSchedule((currentSchedule) => [...currentSchedule, item]);
  };

  const addOneOffPlanItem = (item: OneOffPlanItem) => {
    setOneOffPlans((currentPlans) => [...currentPlans, item]);
  };

  const updateScheduleItem = (item: WeeklyPlanItem) => {
    setSchedule((currentSchedule) =>
      currentSchedule.map((currentItem) => (currentItem.id === item.id ? item : currentItem)),
    );
    setActivityDetail((detail) =>
      detail?.kind === "plan" && detail.planItem.id === item.id
        ? { kind: "plan", planItem: item, date: detail.date }
        : detail,
    );
  };

  const updateOneOffPlanItem = (item: OneOffPlanItem) => {
    setOneOffPlans((currentPlans) =>
      currentPlans.map((currentItem) => (currentItem.id === item.id ? item : currentItem)),
    );
    setActivityDetail((detail) =>
      detail?.kind === "plan" && detail.planItem.id === item.id
        ? { kind: "plan", planItem: item, date: item.date }
        : detail,
    );
  };

  const deleteScheduleItem = (itemId: string) => {
    setSchedule((currentSchedule) => currentSchedule.filter((item) => item.id !== itemId));
    setActivityDetail((detail) => (detail?.kind === "plan" && detail.planItem.id === itemId ? null : detail));
    setEditingPlanItem((item) => (item?.id === itemId ? null : item));
  };

  const deleteOneOffPlanItem = (itemId: string) => {
    setOneOffPlans((currentPlans) => currentPlans.filter((item) => item.id !== itemId));
    setActivityDetail((detail) => (detail?.kind === "plan" && detail.planItem.id === itemId ? null : detail));
    setEditingPlanItem((item) => (item?.id === itemId ? null : item));
  };

  const logPlannedActivity = (planItem: ActivityPlanItem, date: string) => {
    upsertLog({
      id: createId(),
      date,
      activityType: planItem.activityType,
      customActivityName: planItem.customActivityName,
      activityColor: resolveActivityColor(planItem),
      durationMinutes: planItem.durationMinutes,
      notes: planItem.notes ?? "",
      exercises: [],
    });
    if (isOneOffPlanItem(planItem)) {
      deleteOneOffPlanItem(planItem.id);
    }
  };

  const handleEdit = (log: ActivityLog) => {
    setEditingLog(log);
  };

  const activeTitle =
    activeTab === "today"
      ? "Today / Log"
      : activeTab === "week"
        ? "Week"
        : activeTab === "gym"
          ? "Gym Progress"
          : "Archive";

  return (
    <div className="app-shell">
      <header className="app-header">
        <img
          className="app-logo"
          src={`${import.meta.env.BASE_URL}icons/activity-icon-192.png`}
          alt=""
          aria-hidden="true"
        />
        <div>
          <p className="eyebrow">Sessions</p>
          <h1>{activeTitle}</h1>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "today" && <TodayLog pastActivityOptions={pastActivityOptions} onSave={upsertLog} />}
        {activeTab === "week" && (
          <WeekView
            weekStart={currentWeekStart}
            logs={currentWeekLogs}
            schedule={schedule}
            oneOffPlans={oneOffPlans}
            pastActivityOptions={pastActivityOptions}
            onAddScheduleItem={addScheduleItem}
            onAddOneOffPlanItem={addOneOffPlanItem}
            onDeleteScheduleItem={deleteScheduleItem}
            onDeleteOneOffPlanItem={deleteOneOffPlanItem}
            onEditPlanItem={setEditingPlanItem}
            onOpenActivityDetail={setActivityDetail}
          />
        )}
        {activeTab === "gym" && <GymProgress logs={sortedLogs} onEdit={handleEdit} />}
        {activeTab === "archive" && (
          <ArchiveView
            weeks={archiveWeeks}
            selectedWeek={selectedArchiveWeek}
            onSelectWeek={setSelectedArchiveWeek}
            onBack={() => setSelectedArchiveWeek(null)}
            onEdit={handleEdit}
            onDelete={deleteLog}
          />
        )}
      </main>

      {editingLog ? (
        <EditSheet
          log={editingLog}
          pastActivityOptions={pastActivityOptions}
          onSave={upsertLog}
          onDelete={deleteLog}
          onCancel={() => setEditingLog(null)}
        />
      ) : null}

      {editingPlanItem ? (
        <PlanEditSheet
          planItem={editingPlanItem}
          pastActivityOptions={pastActivityOptions}
          onSaveScheduleItem={updateScheduleItem}
          onSaveOneOffPlanItem={updateOneOffPlanItem}
          onDeleteScheduleItem={deleteScheduleItem}
          onDeleteOneOffPlanItem={deleteOneOffPlanItem}
          onCancel={() => setEditingPlanItem(null)}
        />
      ) : null}

      {activityDetail ? (
        <ActivityDetailSheet
          detail={activityDetail}
          onClose={() => setActivityDetail(null)}
          onEdit={(log) => {
            setActivityDetail(null);
            setEditingLog(log);
          }}
          onEditPlanActivity={(planItem) => {
            setActivityDetail(null);
            setEditingPlanItem(planItem);
          }}
          onLogPlannedActivity={(planItem, date) => {
            logPlannedActivity(planItem, date);
            setActivityDetail(null);
          }}
          onUpdateExerciseWeight={updateLogExerciseWeight}
        />
      ) : null}

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

function TodayLog({
  pastActivityOptions,
  onSave,
}: {
  pastActivityOptions: PastActivityOption[];
  onSave: (log: ActivityLog) => void;
}) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <section className="stack">
      <LogEditor
        key={resetKey}
        mode="create"
        pastActivityOptions={pastActivityOptions}
        onSave={(log) => {
          onSave(log);
          setResetKey((key) => key + 1);
        }}
      />
    </section>
  );
}

function LogEditor({
  mode,
  initialLog,
  pastActivityOptions,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  initialLog?: ActivityLog;
  pastActivityOptions: PastActivityOption[];
  onSave: (log: ActivityLog) => void;
  onCancel?: () => void;
}) {
  const initialActivityName = initialLog ? activityDisplayName(initialLog) : "";
  const [date, setDate] = useState(initialLog?.date ?? todayInputValue());
  const [activityName, setActivityName] = useState(initialActivityName);
  const [activityColor, setActivityColor] = useState(
    initialLog?.activityColor ?? defaultActivityColor(initialActivityName),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialLog?.durationMinutes ? String(initialLog.durationMinutes) : "",
  );
  const [notes, setNotes] = useState(initialLog?.notes ?? "");
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    initialLog?.exercises.length ? initialLog.exercises : [makeExercise()],
  );

  const isGym = isGymActivityName(activityName);

  const updateExercise = (exerciseId: string, nextExercise: Partial<ExerciseEntry>) => {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...nextExercise } : exercise,
      ),
    );
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((currentExercises) => currentExercises.filter((exercise) => exercise.id !== exerciseId));
  };

  const addExercise = () => {
    setExercises((currentExercises) => [...currentExercises, makeExercise()]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanActivityName = normalizeActivityName(activityName);
    if (!cleanActivityName) {
      return;
    }

    const cleanExercises = isGym
      ? exercises
          .filter((exercise) => exercise.exerciseName.trim())
          .map((exercise) => ({
            ...exercise,
            exerciseName: exercise.exerciseName.trim(),
            notes: exercise.notes?.trim() ?? "",
          }))
      : [];

    onSave({
      id: initialLog?.id ?? createId(),
      date,
      activityType: cleanActivityName,
      customActivityName: undefined,
      activityColor,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      notes: notes.trim(),
      exercises: cleanExercises,
    });
  };

  return (
    <form className="card editor-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Date</span>
          <input value={date} onChange={(event) => setDate(event.target.value)} type="date" required />
        </label>

        <label className="field">
          <span>Duration</span>
          <div className="input-with-unit">
            <input
              min="0"
              inputMode="numeric"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              type="number"
              placeholder="Optional"
            />
            <span>min</span>
          </div>
        </label>
      </div>

      <ActivityNamePicker
        value={activityName}
        pastActivityOptions={pastActivityOptions}
        onChange={setActivityName}
        onSelectPastActivity={(activity) => {
          setActivityName(activity.name);
          setActivityColor(activity.activityColor ?? defaultActivityColor(activity.name));
        }}
      />

      <ColorPicker value={activityColor} onChange={setActivityColor} />

      {isGym ? (
        <section className="exercise-stack">
          <div className="section-heading">
            <h2>Exercises</h2>
            <button className="icon-text-button compact" type="button" onClick={addExercise}>
              <Plus size={17} aria-hidden="true" />
              Add
            </button>
          </div>

          {exercises.map((exercise, index) => (
            <ExerciseEditor
              exercise={exercise}
              index={index}
              key={exercise.id}
              onChange={(nextExercise) => updateExercise(exercise.id, nextExercise)}
              onRemove={() => removeExercise(exercise.id)}
              canRemove={exercises.length > 1}
            />
          ))}
        </section>
      ) : null}

      <label className="field">
        <span>Notes</span>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Optional" />
      </label>

      <div className="action-row">
        {onCancel ? (
          <button className="secondary-button" type="button" onClick={onCancel}>
            <X size={17} aria-hidden="true" />
            Cancel
          </button>
        ) : null}
        <button className="primary-button" type="submit">
          <Check size={17} aria-hidden="true" />
          {mode === "edit" ? "Save changes" : "Save log"}
        </button>
      </div>
    </form>
  );
}

function ActivityNamePicker({
  value,
  pastActivityOptions,
  onChange,
  onSelectPastActivity,
}: {
  value: string;
  pastActivityOptions: PastActivityOption[];
  onChange: (activityName: string) => void;
  onSelectPastActivity: (activity: PastActivityOption) => void;
}) {
  return (
    <div className="activity-name-grid">
      <label className="field">
        <span>Activity</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type activity"
          required
        />
      </label>

      <label className="field">
        <span>Past activities</span>
        <select
          aria-label="Past activities"
          disabled={!pastActivityOptions.length}
          value=""
          onChange={(event) => {
            const activity = pastActivityOptions.find((option) => option.name === event.target.value);
            if (activity) {
              onSelectPastActivity(activity);
            }
          }}
        >
          <option value="">{pastActivityOptions.length ? "Choose activity" : "None yet"}</option>
          {pastActivityOptions.map((activity) => (
            <option key={activity.name} value={activity.name}>
              {activity.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedColor = findActivityColorOption(value);

  const chooseColor = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <fieldset className="color-picker">
      <legend>Colour</legend>
      <div className="color-picker-shell">
        <button
          aria-expanded={isOpen}
          aria-label={`Choose colour. Selected ${selectedColor.name}`}
          className="selected-color-button"
          onClick={() => setIsOpen((current) => !current)}
          style={{ "--selected-color": selectedColor.value } as CSSProperties}
          type="button"
        >
          <span className="selected-color-main">
            <span className="selected-color-swatch" aria-hidden="true" />
            <span>{selectedColor.name}</span>
          </span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>

        {isOpen ? (
          <div className="color-palette" role="grid" aria-label="Colour palette">
            {activityColorOptions.map((color) => {
              const isSelected = value === color.value;
              return (
                <button
                  aria-label={`Use ${color.name}`}
                  aria-pressed={isSelected}
                  className={isSelected ? "palette-swatch selected" : "palette-swatch"}
                  key={color.value}
                  onClick={() => chooseColor(color.value)}
                  style={{ "--palette-color": color.value } as CSSProperties}
                  title={color.name}
                  type="button"
                >
                  {isSelected ? <Check size={18} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

function ExerciseEditor({
  exercise,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  exercise: ExerciseEntry;
  index: number;
  onChange: (nextExercise: Partial<ExerciseEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="exercise-card">
      <div className="exercise-title-row">
        <span>Exercise {index + 1}</span>
        {canRemove ? (
          <button className="icon-button ghost" type="button" onClick={onRemove} aria-label="Remove exercise">
            <Trash2 size={17} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <label className="field">
        <span>Name</span>
        <input
          value={exercise.exerciseName}
          onChange={(event) => onChange({ exerciseName: event.target.value })}
          placeholder="Bench press"
        />
      </label>

      <div className="exercise-number-grid">
        <label className="field">
          <span>Sets</span>
          <input
            min="0"
            inputMode="numeric"
            value={exercise.sets ?? ""}
            onChange={(event) => onChange({ sets: event.target.value ? Number(event.target.value) : undefined })}
            type="number"
          />
        </label>
        <label className="field">
          <span>Reps</span>
          <input
            min="0"
            inputMode="numeric"
            value={exercise.reps ?? ""}
            onChange={(event) => onChange({ reps: event.target.value ? Number(event.target.value) : undefined })}
            type="number"
          />
        </label>
        <label className="field">
          <span>kg</span>
          <input
            min="0"
            inputMode="decimal"
            step="0.5"
            value={exercise.weightKg ?? ""}
            onChange={(event) => onChange({ weightKg: event.target.value ? Number(event.target.value) : undefined })}
            type="number"
          />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <input
          value={exercise.notes ?? ""}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Optional"
        />
      </label>
    </div>
  );
}

function WeekView({
  weekStart,
  logs,
  schedule,
  oneOffPlans,
  pastActivityOptions,
  onAddScheduleItem,
  onAddOneOffPlanItem,
  onDeleteScheduleItem,
  onDeleteOneOffPlanItem,
  onEditPlanItem,
  onOpenActivityDetail,
}: {
  weekStart: Date;
  logs: ActivityLog[];
  schedule: WeeklyPlanItem[];
  oneOffPlans: OneOffPlanItem[];
  pastActivityOptions: PastActivityOption[];
  onAddScheduleItem: (item: WeeklyPlanItem) => void;
  onAddOneOffPlanItem: (item: OneOffPlanItem) => void;
  onDeleteScheduleItem: (itemId: string) => void;
  onDeleteOneOffPlanItem: (itemId: string) => void;
  onEditPlanItem: (item: ActivityPlanItem) => void;
  onOpenActivityDetail: (detail: ActivityDetail) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <section className="stack">
      <div className="week-range-card">
        <CalendarDays size={18} aria-hidden="true" />
        <span>{formatWeekRange(weekStart)}</span>
      </div>

      <WeekCalendarStrip
        days={days}
        logs={logs}
        schedule={schedule}
        oneOffPlans={oneOffPlans}
        onOpenActivityDetail={onOpenActivityDetail}
      />

      <SchedulePanel
        weekStart={weekStart}
        schedule={schedule}
        oneOffPlans={oneOffPlans}
        pastActivityOptions={pastActivityOptions}
        onAddScheduleItem={onAddScheduleItem}
        onAddOneOffPlanItem={onAddOneOffPlanItem}
        onDeleteScheduleItem={onDeleteScheduleItem}
        onDeleteOneOffPlanItem={onDeleteOneOffPlanItem}
        onEditPlanItem={onEditPlanItem}
      />

      <SummaryGrid logs={logs} />
    </section>
  );
}

function WeekCalendarStrip({
  days,
  logs,
  schedule,
  oneOffPlans,
  onOpenActivityDetail,
}: {
  days: Date[];
  logs: ActivityLog[];
  schedule: WeeklyPlanItem[];
  oneOffPlans: OneOffPlanItem[];
  onOpenActivityDetail: (detail: ActivityDetail) => void;
}) {
  const today = todayInputValue();

  return (
    <section className="week-calendar" aria-label="Week calendar">
      {days.map((day, index) => {
        const dateKey = formatDateInput(day);
        const dayLogs = logs.filter((log) => log.date === dateKey);
        const plannedItems: ActivityPlanItem[] = [
          ...getPlansForWeekday(schedule, index),
          ...getOneOffPlansForDate(oneOffPlans, dateKey),
        ];
        const matchedLogIds = new Set<string>();
        const activityChips: CalendarActivityChip[] = [
          ...plannedItems.map((item) => {
            const matchingLog = dayLogs.find(
              (log) => activitiesMatch(log, item) && !matchedLogIds.has(log.id),
            );

            if (matchingLog) {
              matchedLogIds.add(matchingLog.id);
              return {
                id: `done-${item.id}`,
                activityType: item.activityType,
                customActivityName: item.customActivityName,
                activityColor: resolveActivityColor(item),
                status: "done" as const,
                log: matchingLog,
              };
            }

            return {
              id: `scheduled-${item.id}`,
              activityType: item.activityType,
              customActivityName: item.customActivityName,
              activityColor: resolveActivityColor(item),
              status: "scheduled" as const,
              planItem: item,
            };
          }),
          ...dayLogs
            .filter((log) => !matchedLogIds.has(log.id))
            .map((log) => ({
              id: `logged-${log.id}`,
              activityType: log.activityType,
              customActivityName: log.customActivityName,
              activityColor: resolveActivityColor(log),
              status: "done" as const,
              log,
            })),
        ];
        const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(day);
        const dateNumber = new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(day);
        const monthName = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(day);

        return (
          <div className={dateKey === today ? "calendar-day today" : "calendar-day"} key={dateKey}>
            <div className="calendar-date-block">
              <span>{dayName}</span>
              <strong>{dateNumber}</strong>
              <small>{monthName}</small>
            </div>
            <div className="calendar-activities">
              {activityChips.length ? (
                activityChips.map((chip) => (
                  <button
                    className={chip.status === "done" ? "activity-chip done" : "activity-chip scheduled"}
                    key={chip.id}
                    style={activityColorStyle(chip)}
                    title={`${chip.status === "done" ? "Done" : "Scheduled"} ${activityDisplayName(chip)}`}
                    type="button"
                    onClick={() =>
                      chip.status === "done"
                        ? onOpenActivityDetail({ kind: "log", log: chip.log })
                        : onOpenActivityDetail({ kind: "plan", planItem: chip.planItem, date: dateKey })
                    }
                  >
                    {activityShortLabel(chip)}
                  </button>
                ))
              ) : (
                <span className="activity-chip empty">Free</span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function SchedulePanel({
  weekStart,
  schedule,
  oneOffPlans,
  pastActivityOptions,
  onAddScheduleItem,
  onAddOneOffPlanItem,
  onDeleteScheduleItem,
  onDeleteOneOffPlanItem,
  onEditPlanItem,
}: {
  weekStart: Date;
  schedule: WeeklyPlanItem[];
  oneOffPlans: OneOffPlanItem[];
  pastActivityOptions: PastActivityOption[];
  onAddScheduleItem: (item: WeeklyPlanItem) => void;
  onAddOneOffPlanItem: (item: OneOffPlanItem) => void;
  onDeleteScheduleItem: (itemId: string) => void;
  onDeleteOneOffPlanItem: (itemId: string) => void;
  onEditPlanItem: (item: ActivityPlanItem) => void;
}) {
  const [activityName, setActivityName] = useState("");
  const [activityColor, setActivityColor] = useState(defaultActivityColor(""));
  const [repeatsWeekly, setRepeatsWeekly] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const todayWeekdayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const currentWeekOneOffPlans = oneOffPlans.filter(
    (item) => getWeekKey(parseInputDate(item.date)) === getWeekKey(weekStart),
  );
  const hasAddedActivities = schedule.length > 0 || currentWeekOneOffPlans.length > 0;

  const openPlanItemEditor = (item: ActivityPlanItem) => {
    onEditPlanItem(item);
  };

  const handlePlanRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: WeeklyPlanItem) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    openPlanItemEditor(item);
  };

  const handleOneOffRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: OneOffPlanItem) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    openPlanItemEditor(item);
  };

  const toggleDay = (dayIndex: number) => {
    if (!repeatsWeekly) {
      setSelectedDays([dayIndex]);
      return;
    }

    setSelectedDays((currentDays) =>
      currentDays.includes(dayIndex)
        ? currentDays.filter((currentDay) => currentDay !== dayIndex)
        : [...currentDays, dayIndex].sort((a, b) => a - b),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanActivityName = normalizeActivityName(activityName);
    if (!selectedDays.length || !cleanActivityName) {
      return;
    }

    const baseActivity = {
      id: createId(),
      activityType: cleanActivityName,
      customActivityName: undefined,
      activityColor,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      notes: notes.trim(),
    };

    if (repeatsWeekly) {
      onAddScheduleItem({
        ...baseActivity,
        weekdays: selectedDays,
      });
    } else {
      onAddOneOffPlanItem({
        ...baseActivity,
        date: formatDateInput(addDays(weekStart, selectedDays[0] ?? todayWeekdayIndex)),
      });
    }

    setActivityName("");
    setActivityColor(defaultActivityColor(""));
    setRepeatsWeekly(true);
    setSelectedDays([0]);
    setDurationMinutes("");
    setNotes("");
  };

  return (
    <section className="schedule-panel">
      <div className="section-heading">
        <h2>Add Activity</h2>
      </div>

      <form className="schedule-form" onSubmit={handleSubmit}>
        <ActivityNamePicker
          value={activityName}
          pastActivityOptions={pastActivityOptions}
          onChange={setActivityName}
          onSelectPastActivity={(activity) => {
            setActivityName(activity.name);
            setActivityColor(activity.activityColor ?? defaultActivityColor(activity.name));
          }}
        />

        <label className="field schedule-duration">
          <span>Duration</span>
          <div className="input-with-unit">
            <input
              min="0"
              inputMode="numeric"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              type="number"
              placeholder="Optional"
            />
            <span>min</span>
          </div>
        </label>

        <label className="repeat-choice">
          <input
            checked={repeatsWeekly}
            onChange={(event) => {
              const shouldRepeat = event.target.checked;
              setRepeatsWeekly(shouldRepeat);
              setSelectedDays(shouldRepeat ? [0] : [todayWeekdayIndex]);
            }}
            type="checkbox"
          />
          <span>Repeat weekly</span>
        </label>

        <div className="schedule-color">
          <ColorPicker value={activityColor} onChange={setActivityColor} />
        </div>

        <fieldset className="weekday-options">
          <legend>{repeatsWeekly ? "Days" : "Day"}</legend>
          <div className="weekday-grid">
            {weekdays.map((day, index) => (
              <button
                className={selectedDays.includes(index) ? "weekday-toggle selected" : "weekday-toggle"}
                key={day.short}
                type="button"
                onClick={() => toggleDay(index)}
              >
                <span>{day.short}</span>
                {!repeatsWeekly ? <small>{new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(addDays(weekStart, index))}</small> : null}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field schedule-notes">
          <span>Notes</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
        </label>

        <button
          className="primary-button schedule-submit"
          type="submit"
          disabled={!selectedDays.length || !activityName.trim()}
        >
          <Plus size={17} aria-hidden="true" />
          Add activity
        </button>
      </form>

      {hasAddedActivities ? (
        <div className="schedule-list">
          {schedule.map((item) => (
            <div
              aria-label={`Open ${activityDisplayName(item)} schedule`}
              className="schedule-row"
              key={item.id}
              onClick={() => openPlanItemEditor(item)}
              onKeyDown={(event) => handlePlanRowKeyDown(event, item)}
              role="button"
              style={activityColorStyle(item)}
              tabIndex={0}
            >
              <div>
                <strong>{activityDisplayName(item)}</strong>
                <span>{item.weekdays.map((dayIndex) => weekdays[dayIndex]?.short).join(", ")}</span>
                <small>Repeats weekly</small>
                {item.durationMinutes ? <small>{item.durationMinutes} min</small> : null}
              </div>
              <button
                className="icon-button danger"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteScheduleItem(item.id);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                aria-label={`Delete ${activityDisplayName(item)} schedule`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          {currentWeekOneOffPlans.map((item) => (
            <div
              aria-label={`Open ${activityDisplayName(item)} activity`}
              className="schedule-row"
              key={item.id}
              onClick={() => openPlanItemEditor(item)}
              onKeyDown={(event) => handleOneOffRowKeyDown(event, item)}
              role="button"
              style={activityColorStyle(item)}
              tabIndex={0}
            >
              <div>
                <strong>{activityDisplayName(item)}</strong>
                <span>{formatShortDate(item.date)}</span>
                <small>This week</small>
                {item.durationMinutes ? <small>{item.durationMinutes} min</small> : null}
              </div>
              <button
                className="icon-button danger"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteOneOffPlanItem(item.id);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                aria-label={`Delete ${activityDisplayName(item)} activity`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SummaryGrid({ logs }: { logs: ActivityLog[] }) {
  const summaryItems = [
    { label: "Total", value: logs.length },
    ...getActivityBreakdown(logs),
  ];

  return (
    <section className="summary-grid" aria-label="Weekly summary">
      {summaryItems.map((item) => (
        <div className="summary-card" key={item.label}>
          <span>{item.value}</span>
          <p>{item.label}</p>
        </div>
      ))}
    </section>
  );
}

function DayGroup({
  date,
  logs,
  plannedItems = [],
  emptyLabel,
  onLogPlannedActivity,
  onEdit,
  onDelete,
}: {
  date: Date;
  logs: ActivityLog[];
  plannedItems?: ActivityPlanItem[];
  emptyLabel: string;
  onLogPlannedActivity?: (planItem: ActivityPlanItem) => void;
  onEdit: (log: ActivityLog) => void;
  onDelete: (logId: string) => void;
}) {
  return (
    <section className="day-group">
      <div className="day-heading">
        <h2>{formatShortDate(date)}</h2>
        <span>{logs.length}</span>
      </div>

      {plannedItems.length ? (
        <div className="planned-list">
          {plannedItems.map((item) => (
            <div className="planned-row" key={item.id} style={activityColorStyle(item)}>
              <div>
                <strong>{activityDisplayName(item)}</strong>
                <span>
                  Planned
                  {item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}
                </span>
              </div>
              {onLogPlannedActivity ? (
                <button className="secondary-button compact-action" type="button" onClick={() => onLogPlannedActivity(item)}>
                  <Check size={15} aria-hidden="true" />
                  Log
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {logs.length ? (
        <div className="log-list">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="empty-row">{emptyLabel}</div>
      )}
    </section>
  );
}

function LogCard({
  log,
  onEdit,
  onDelete,
}: {
  log: ActivityLog;
  onEdit: (log: ActivityLog) => void;
  onDelete: (logId: string) => void;
}) {
  const exerciseLabel =
    isGymActivityName(activityDisplayName(log)) && log.exercises.length
      ? `${log.exercises.length} ${log.exercises.length === 1 ? "exercise" : "exercises"}`
      : null;

  return (
    <article className="log-card" style={activityColorStyle(log)}>
      <div className="log-card-main">
        <div>
          <p className="log-type">{activityDisplayName(log)}</p>
          <div className="log-meta">
            {log.durationMinutes ? <span>{log.durationMinutes} min</span> : null}
            {exerciseLabel ? <span>{exerciseLabel}</span> : null}
          </div>
        </div>
        <div className="card-actions">
          <button className="icon-button" type="button" onClick={() => onEdit(log)} aria-label="Edit log">
            <Edit3 size={16} aria-hidden="true" />
          </button>
          <button className="icon-button danger" type="button" onClick={() => onDelete(log.id)} aria-label="Delete log">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {log.notes ? <p className="notes-text">{log.notes}</p> : null}

      {log.exercises.length ? (
        <div className="exercise-mini-list">
          {log.exercises.map((exercise) => (
            <div className="exercise-mini" key={exercise.id}>
              <span>{exercise.exerciseName}</span>
              <strong>
                {exercise.weightKg ?? 0} kg
                {exercise.sets || exercise.reps ? ` · ${exercise.sets ?? "-"}x${exercise.reps ?? "-"}` : ""}
              </strong>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function GymProgress({ logs, onEdit }: { logs: ActivityLog[]; onEdit: (log: ActivityLog) => void }) {
  const exercises = useMemo(() => {
    const grouped = new Map<string, { name: string; entries: Array<ExerciseEntry & { date: string; log: ActivityLog }> }>();

    logs.forEach((log) => {
      if (!isGymActivityName(activityDisplayName(log))) {
        return;
      }

      log.exercises.forEach((exercise) => {
        const key = exercise.exerciseName.trim().toLowerCase();
        if (!key) {
          return;
        }
        const current = grouped.get(key) ?? { name: exercise.exerciseName.trim(), entries: [] };
        current.entries.push({ ...exercise, date: log.date, log });
        grouped.set(key, current);
      });
    });

    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [logs]);

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const activeExercise = exercises.find((exercise) => exercise.name === selectedExercise) ?? exercises[0];

  useEffect(() => {
    if (!activeExercise) {
      setSelectedExercise(null);
      return;
    }
    if (!selectedExercise || !exercises.some((exercise) => exercise.name === selectedExercise)) {
      setSelectedExercise(activeExercise.name);
    }
  }, [activeExercise, exercises, selectedExercise]);

  if (!exercises.length) {
    return <EmptyState icon={<Dumbbell size={24} />} title="No gym exercises yet" />;
  }

  const bestWeight = Math.max(...(activeExercise?.entries.map((entry) => entry.weightKg ?? 0) ?? [0]));

  return (
    <section className="stack">
      <div className="exercise-picker">
        {exercises.map((exercise) => {
          const personalBest = Math.max(...exercise.entries.map((entry) => entry.weightKg ?? 0));
          return (
            <button
              className={activeExercise?.name === exercise.name ? "exercise-picker-card selected" : "exercise-picker-card"}
              key={exercise.name}
              onClick={() => setSelectedExercise(exercise.name)}
              type="button"
            >
              <span>{exercise.name}</span>
              <strong>{personalBest} kg PB</strong>
            </button>
          );
        })}
      </div>

      {activeExercise ? (
        <section className="card progress-card">
          <div className="progress-heading">
            <div>
              <p className="eyebrow">Personal best</p>
              <h2>{activeExercise.name}</h2>
            </div>
            <div className="best-badge">
              <Trophy size={18} aria-hidden="true" />
              <span>{bestWeight} kg</span>
            </div>
          </div>

          <div className="history-list">
            {[...activeExercise.entries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => (
                <button className="history-row" key={`${entry.log.id}-${entry.id}`} type="button" onClick={() => onEdit(entry.log)}>
                  <div>
                    <strong>{formatShortDate(entry.date)}</strong>
                    <span>{entry.notes || entry.log.notes || "Gym session"}</span>
                  </div>
                  <div className="history-stats">
                    <strong>{entry.weightKg ?? 0} kg</strong>
                    <span>
                      {entry.sets ?? "-"} x {entry.reps ?? "-"}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function ArchiveView({
  weeks,
  selectedWeek,
  onSelectWeek,
  onBack,
  onEdit,
  onDelete,
}: {
  weeks: ArchiveWeek[];
  selectedWeek: ArchiveWeek | null;
  onSelectWeek: (week: ArchiveWeek) => void;
  onBack: () => void;
  onEdit: (log: ActivityLog) => void;
  onDelete: (logId: string) => void;
}) {
  if (selectedWeek) {
    const groupedDays = Array.from({ length: 7 }, (_, index) => addDays(selectedWeek.start, index));
    return (
      <section className="stack">
        <button className="back-button" type="button" onClick={onBack}>
          <ChevronLeft size={18} aria-hidden="true" />
          Weeks
        </button>
        <div className="week-range-card">
          <Archive size={18} aria-hidden="true" />
          <span>{selectedWeek.label}</span>
        </div>
        <section className="day-list">
          {groupedDays.map((day) => {
            const dateKey = formatDateInput(day);
            return (
              <DayGroup
                date={day}
                key={dateKey}
                logs={selectedWeek.logs.filter((log) => log.date === dateKey)}
                emptyLabel="No sessions"
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </section>
      </section>
    );
  }

  if (!weeks.length) {
    return <EmptyState icon={<Archive size={24} />} title="No archived weeks yet" />;
  }

  return (
    <section className="stack">
      <div className="archive-week-heading">
        <CalendarDays size={18} aria-hidden="true" />
        <span>Previous weeks</span>
      </div>

      {weeks.map((week) => {
        const visibleBreakdown = getActivityBreakdown(week.logs);
        return (
          <button className="archive-card" type="button" key={week.key} onClick={() => onSelectWeek(week)}>
            <div>
              <span className="archive-range">{week.label}</span>
              <strong>{week.logs.length} sessions</strong>
              <div className="breakdown-list">
                {visibleBreakdown.length ? (
                  visibleBreakdown.map((item) => (
                    <span key={item.label}>
                      {item.label}: {item.value}
                    </span>
                  ))
                ) : (
                  <span>No sessions</span>
                )}
              </div>
            </div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        );
      })}
    </section>
  );
}

function ActivityDetailSheet({
  detail,
  onClose,
  onEdit,
  onEditPlanActivity,
  onLogPlannedActivity,
  onUpdateExerciseWeight,
}: {
  detail: ActivityDetail;
  onClose: () => void;
  onEdit: (log: ActivityLog) => void;
  onEditPlanActivity: (planItem: ActivityPlanItem) => void;
  onLogPlannedActivity: (planItem: ActivityPlanItem, date: string) => void;
  onUpdateExerciseWeight: (logId: string, exerciseId: string, weightKg?: number) => void;
}) {
  const activity = detail.kind === "log" ? detail.log : detail.planItem;
  const title = activityDisplayName(activity);
  const date = detail.kind === "log" ? detail.log.date : detail.date;
  const durationMinutes = activity.durationMinutes;
  const notes = activity.notes?.trim();

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="edit-sheet detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-title"
        onClick={(event) => event.stopPropagation()}
        style={activityColorStyle(activity)}
      >
        <div className="sheet-header">
          <div>
            <p className="eyebrow">{detail.kind === "log" ? "Completed activity" : "Scheduled activity"}</p>
            <h2 id="activity-detail-title">{title}</h2>
          </div>
          <button className="icon-button ghost" type="button" onClick={onClose} aria-label="Close details">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="detail-grid">
          <div className="detail-stat">
            <span>Date</span>
            <strong>{formatShortDate(date)}</strong>
          </div>
          <div className="detail-stat">
            <span>Duration</span>
            <strong>{durationMinutes ? `${durationMinutes} min` : "Not set"}</strong>
          </div>
          {detail.kind === "plan" && !isOneOffPlanItem(detail.planItem) ? (
            <div className="detail-stat wide">
              <span>Repeats</span>
              <strong>{detail.planItem.weekdays.map((dayIndex) => weekdays[dayIndex]?.long).join(", ")}</strong>
            </div>
          ) : null}
        </div>

        <section className="detail-section">
          <h3>Notes</h3>
          <p>{notes || "No notes added."}</p>
        </section>

        {detail.kind === "log" && detail.log.exercises.length ? (
          <section className="detail-section">
            <h3>Exercises</h3>
            <div className="detail-exercise-list">
              {detail.log.exercises.map((exercise) => (
                <div className="detail-exercise-row" key={exercise.id}>
                  <div>
                    <strong>{exercise.exerciseName}</strong>
                    {exercise.notes ? <span>{exercise.notes}</span> : null}
                  </div>
                  <div className="detail-exercise-stats">
                    <label className="detail-weight-field">
                      <span>Weight</span>
                      <div className="detail-weight-input">
                        <input
                          aria-label={`Weight for ${exercise.exerciseName}`}
                          inputMode="decimal"
                          min="0"
                          onChange={(event) =>
                            onUpdateExerciseWeight(
                              detail.log.id,
                              exercise.id,
                              event.target.value ? Number(event.target.value) : undefined,
                            )
                          }
                          step="0.5"
                          type="number"
                          value={exercise.weightKg ?? ""}
                        />
                        <strong>kg</strong>
                      </div>
                    </label>
                    <span>
                      {exercise.sets ?? "-"} x {exercise.reps ?? "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="action-row">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={17} aria-hidden="true" />
            Close
          </button>
          {detail.kind === "log" ? (
            <button className="primary-button" type="button" onClick={() => onEdit(detail.log)}>
              <Edit3 size={17} aria-hidden="true" />
              Edit log
            </button>
          ) : (
            <>
              <button className="secondary-button" type="button" onClick={() => onEditPlanActivity(detail.planItem)}>
                <Edit3 size={17} aria-hidden="true" />
                Edit activity
              </button>
              <button className="primary-button" type="button" onClick={() => onLogPlannedActivity(detail.planItem, detail.date)}>
                <Check size={17} aria-hidden="true" />
                Log activity
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EditSheet({
  log,
  pastActivityOptions,
  onSave,
  onDelete,
  onCancel,
}: {
  log: ActivityLog;
  pastActivityOptions: PastActivityOption[];
  onSave: (log: ActivityLog) => void;
  onDelete: (logId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="sheet-backdrop" role="presentation">
      <section className="edit-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-log-title">
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Edit log</p>
            <h2 id="edit-log-title">{formatShortDate(log.date)}</h2>
          </div>
          <button className="icon-button ghost" type="button" onClick={onCancel} aria-label="Close editor">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <LogEditor
          mode="edit"
          initialLog={log}
          pastActivityOptions={pastActivityOptions}
          onSave={onSave}
          onCancel={onCancel}
        />

        <button className="delete-wide-button" type="button" onClick={() => onDelete(log.id)}>
          <Trash2 size={17} aria-hidden="true" />
          Delete log
        </button>
      </section>
    </div>
  );
}

function PlanEditSheet({
  planItem,
  pastActivityOptions,
  onSaveScheduleItem,
  onSaveOneOffPlanItem,
  onDeleteScheduleItem,
  onDeleteOneOffPlanItem,
  onCancel,
}: {
  planItem: ActivityPlanItem;
  pastActivityOptions: PastActivityOption[];
  onSaveScheduleItem: (item: WeeklyPlanItem) => void;
  onSaveOneOffPlanItem: (item: OneOffPlanItem) => void;
  onDeleteScheduleItem: (itemId: string) => void;
  onDeleteOneOffPlanItem: (itemId: string) => void;
  onCancel: () => void;
}) {
  const isOneOff = isOneOffPlanItem(planItem);
  const initialActivityName = activityDisplayName(planItem);
  const [activityName, setActivityName] = useState(initialActivityName);
  const [activityColor, setActivityColor] = useState(resolveActivityColor(planItem));
  const [durationMinutes, setDurationMinutes] = useState(
    planItem.durationMinutes ? String(planItem.durationMinutes) : "",
  );
  const [notes, setNotes] = useState(planItem.notes ?? "");
  const [date, setDate] = useState(isOneOff ? planItem.date : todayInputValue());
  const [selectedDays, setSelectedDays] = useState<number[]>(isOneOff ? [] : planItem.weekdays);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((currentDays) =>
      currentDays.includes(dayIndex)
        ? currentDays.filter((currentDay) => currentDay !== dayIndex)
        : [...currentDays, dayIndex].sort((a, b) => a - b),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanActivityName = normalizeActivityName(activityName);
    if (!cleanActivityName || (!isOneOff && !selectedDays.length) || (isOneOff && !date)) {
      return;
    }

    const baseActivity = {
      id: planItem.id,
      activityType: cleanActivityName,
      customActivityName: undefined,
      activityColor,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      notes: notes.trim(),
    };

    if (isOneOff) {
      onSaveOneOffPlanItem({
        ...baseActivity,
        date,
      });
    } else {
      onSaveScheduleItem({
        ...baseActivity,
        weekdays: selectedDays,
      });
    }

    onCancel();
  };

  const handleDelete = () => {
    if (isOneOff) {
      onDeleteOneOffPlanItem(planItem.id);
    } else {
      onDeleteScheduleItem(planItem.id);
    }
    onCancel();
  };

  return (
    <div className="sheet-backdrop" role="presentation">
      <section className="edit-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-plan-title">
        <div className="sheet-header">
          <div>
            <p className="eyebrow">{isOneOff ? "Edit activity" : "Edit repeating activity"}</p>
            <h2 id="edit-plan-title">{initialActivityName}</h2>
          </div>
          <button className="icon-button ghost" type="button" onClick={onCancel} aria-label="Close editor">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="plan-edit-form" onSubmit={handleSubmit}>
          <section className="collapsible-section">
            <button
              aria-expanded={isDetailsOpen}
              className="collapsible-trigger"
              type="button"
              onClick={() => setIsDetailsOpen((current) => !current)}
            >
              <span>Edit activity details</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>

            {isDetailsOpen ? (
              <div className="collapsible-content">
                <ActivityNamePicker
                  value={activityName}
                  pastActivityOptions={pastActivityOptions}
                  onChange={setActivityName}
                  onSelectPastActivity={(activity) => {
                    setActivityName(activity.name);
                    setActivityColor(activity.activityColor ?? defaultActivityColor(activity.name));
                  }}
                />

                <div className="form-grid">
                  {isOneOff ? (
                    <label className="field">
                      <span>Date</span>
                      <input value={date} onChange={(event) => setDate(event.target.value)} type="date" required />
                    </label>
                  ) : (
                    <div className="plan-edit-type">
                      <span>Repeats weekly</span>
                    </div>
                  )}

                  <label className="field">
                    <span>Duration</span>
                    <div className="input-with-unit">
                      <input
                        min="0"
                        inputMode="numeric"
                        value={durationMinutes}
                        onChange={(event) => setDurationMinutes(event.target.value)}
                        type="number"
                        placeholder="Optional"
                      />
                      <span>min</span>
                    </div>
                  </label>
                </div>

                <ColorPicker value={activityColor} onChange={setActivityColor} />

                {!isOneOff ? (
                  <fieldset className="weekday-options">
                    <legend>Days</legend>
                    <div className="weekday-grid">
                      {weekdays.map((day, index) => (
                        <button
                          className={selectedDays.includes(index) ? "weekday-toggle selected" : "weekday-toggle"}
                          key={day.short}
                          type="button"
                          onClick={() => toggleDay(index)}
                        >
                          <span>{day.short}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
              </div>
            ) : null}
          </section>

          <label className="field">
            <span>Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Optional" />
          </label>

          <div className="action-row">
            <button className="secondary-button" type="button" onClick={onCancel}>
              <X size={17} aria-hidden="true" />
              Cancel
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={!activityName.trim() || (!isOneOff && !selectedDays.length)}
            >
              <Check size={17} aria-hidden="true" />
              Save changes
            </button>
          </div>
        </form>

        <button className="delete-wide-button" type="button" onClick={handleDelete}>
          <Trash2 size={17} aria-hidden="true" />
          Delete activity
        </button>
      </section>
    </div>
  );
}

function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <section className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
    </section>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  const tabs: Array<{ key: TabKey; label: string; icon: ReactNode }> = [
    { key: "today", label: "Today", icon: <ListPlus size={20} aria-hidden="true" /> },
    { key: "week", label: "Week", icon: <CalendarDays size={20} aria-hidden="true" /> },
    { key: "gym", label: "Gym", icon: <Dumbbell size={20} aria-hidden="true" /> },
    { key: "archive", label: "Archive", icon: <Archive size={20} aria-hidden="true" /> },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          className={activeTab === tab.key ? "tab-button active" : "tab-button"}
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default App;

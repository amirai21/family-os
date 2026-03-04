export type AssigneeType = "member" | "kid" | "family";

export interface FamilyEvent {
  id: string;
  title: string;
  assigneeType: AssigneeType;
  assigneeId?: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  startMinutes: number; // 0–1439
  endMinutes: number;
  location?: string;
  color?: string;
  isRecurring: boolean; // true = weekly recurring, false = one-time event
  date?: string; // "YYYY-MM-DD" for one-time events only
  reminders?: number[]; // minutes before event, e.g. [1440, 60, 5]
  createdAt: number;
  updatedAt: number;
}

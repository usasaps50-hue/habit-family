/** YYYY-MM-DD (local time) */
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Yesterday YYYY-MM-DD (local time) */
export const yesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Current month YYYY-MM */
export const currentMonthStr = (): string => todayStr().slice(0, 7);

/** Next month YYYY-MM */
export const nextMonthStr = (): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** "M/D" display format */
export const formatJP = (dateStr: string): string => {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
};

/** "YYYY年MM月" display format */
export const formatMonthJP = (monthStr: string): string => {
  const [y, m] = monthStr.split('-');
  return `${y}年${parseInt(m)}月`;
};

/** true if today is the 1st of the month */
export const isFirstDayOfMonth = (): boolean => new Date().getDate() === 1;

/** true if today is the last day of the month */
export const isLastDayOfMonth = (): boolean => {
  const d = new Date();
  return d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

/** 19:00–23:59 submission window */
export const isSubmissionWindow = (): boolean => new Date().getHours() >= 19;

/** HH:MM of current local time */
export const nowTimeStr = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

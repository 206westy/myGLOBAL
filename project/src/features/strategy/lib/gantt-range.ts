'use client';

import {
  differenceInCalendarDays,
  startOfDay,
  addDays,
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { ko } from 'date-fns/locale';

export type GanttZoom = 'week' | 'month';

export interface GanttRange {
  start: Date;
  end: Date;
  totalDays: number;
}

/** Returns a range centred around today for the given zoom level */
export function buildRange(zoom: GanttZoom, anchorOffset = 0): GanttRange {
  const today = startOfDay(new Date());
  if (zoom === 'week') {
    // Show 10 weeks: 2 past + 8 future, shifted by anchorOffset weeks
    const start = addDays(today, -14 + anchorOffset * 7);
    const end = addDays(start, 69); // 10 weeks
    return { start, end, totalDays: differenceInCalendarDays(end, start) + 1 };
  }
  // month: show 3 months
  const pivotMonth = addDays(today, anchorOffset * 28);
  const start = startOfMonth(addDays(pivotMonth, -28));
  const end = endOfMonth(addDays(pivotMonth, 56));
  return { start, end, totalDays: differenceInCalendarDays(end, start) + 1 };
}

/** Column index (0-based) from a date within a range */
export function dayOffset(date: Date, rangeStart: Date): number {
  return Math.max(0, differenceInCalendarDays(startOfDay(date), startOfDay(rangeStart)));
}

/** Duration in calendar days (min 1) */
export function durationDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(startOfDay(end), startOfDay(start)) + 1);
}

/** Whether a date is before rangeStart or after rangeEnd */
export function isOverdue(dueDate: string): boolean {
  return differenceInCalendarDays(startOfDay(new Date(dueDate)), startOfDay(new Date())) < 0;
}

export interface WeekHeader { label: string; startDay: number; spanDays: number }
export interface MonthHeader { label: string; startDay: number; spanDays: number }

export function buildWeekHeaders(range: GanttRange): WeekHeader[] {
  const weeks = eachWeekOfInterval({ start: range.start, end: range.end }, { weekStartsOn: 1 });
  return weeks.map((weekStart) => {
    const clipped = weekStart < range.start ? range.start : weekStart;
    const weekEnd = addDays(weekStart, 6);
    const clippedEnd = weekEnd > range.end ? range.end : weekEnd;
    return {
      label: format(clipped, 'M/d', { locale: ko }),
      startDay: dayOffset(clipped, range.start),
      spanDays: differenceInCalendarDays(clippedEnd, clipped) + 1,
    };
  });
}

export function buildMonthHeaders(range: GanttRange): MonthHeader[] {
  const months = eachMonthOfInterval({ start: range.start, end: range.end });
  return months.map((monthStart) => {
    const clipped = monthStart < range.start ? range.start : monthStart;
    const monthEnd = endOfMonth(monthStart);
    const clippedEnd = monthEnd > range.end ? range.end : monthEnd;
    return {
      label: format(clipped, 'yyyy년 M월', { locale: ko }),
      startDay: dayOffset(clipped, range.start),
      spanDays: differenceInCalendarDays(clippedEnd, clipped) + 1,
    };
  });
}

export function todayOffset(range: GanttRange): number {
  return dayOffset(new Date(), range.start);
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'yyyy.MM.dd', { locale: ko });
}

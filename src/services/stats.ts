import { Report } from '../types';

export interface StatsData {
  totalReports: number;
  thisMonthCount: number;
  completionRate: number; // 0..1
  streakDays: number;
  averageChars: number;
  mostActiveDay: string;
}

export function calculateStats(reports: Report[]): StatsData {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter bulan ini
  const thisMonthReports = reports.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Hari kerja yang telah berjalan di bulan ini (Senin-Jumat)
  let workingDaysPassed = 0;
  for (let day = 1; day <= now.getDate(); day++) {
    const checkDate = new Date(currentYear, currentMonth, day);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysPassed++;
    }
  }

  const completionRate =
    workingDaysPassed > 0
      ? Math.min(1, thisMonthReports.length / workingDaysPassed)
      : 0;

  // Streak: hari berurutan mundur dari hari ini
  let streakDays = 0;
  const dateSet = new Set(reports.map((r) => r.date));
  const pointer = new Date(now);

  // Jika hari ini libur akhir pekan, mulai cek dari hari kerja terakhir
  if (pointer.getDay() === 0) pointer.setDate(pointer.getDate() - 2);
  else if (pointer.getDay() === 6) pointer.setDate(pointer.getDate() - 1);

  while (true) {
    const dayOfWeek = pointer.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = pointer.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        streakDays++;
      } else {
        // jika hari ini belum buat laporan, masih bisa toleransi 1 hari jika baru dimulai
        if (streakDays === 0 && dateStr === now.toISOString().split('T')[0]) {
          // Lewatkan hari ini jika belum selesai jam kerja
        } else {
          break;
        }
      }
    }
    pointer.setDate(pointer.getDate() - 1);
    if (streakDays > 365) break;
  }

  // Rata-rata karakter U+P+K
  const totalChars = reports.reduce((acc, r) => {
    return (
      acc +
      (r.activity?.length || 0) +
      (r.learning?.length || 0) +
      (r.obstacle?.length || 0)
    );
  }, 0);
  const averageChars = reports.length > 0 ? Math.round(totalChars / reports.length) : 0;

  // Hari teraktif
  const dayCounts: Record<string, number> = {
    Senin: 0,
    Selasa: 0,
    Rabu: 0,
    Kamis: 0,
    Jumat: 0,
  };
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  reports.forEach((r) => {
    const d = new Date(r.date);
    const name = dayNames[d.getDay()];
    if (dayCounts[name] !== undefined) {
      dayCounts[name]++;
    }
  });

  let topDay = 'Senin';
  let maxCount = -1;
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topDay = day;
    }
  });

  return {
    totalReports: reports.length,
    thisMonthCount: thisMonthReports.length,
    completionRate,
    streakDays,
    averageChars,
    mostActiveDay: topDay,
  };
}

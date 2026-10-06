import { DateTime } from 'luxon';
export const TZ = process.env.LIBRARY_TIMEZONE || 'Asia/Kolkata';
export const parseIST = (date, time) => DateTime.fromISO(`${date}T${time}`, { zone: TZ });
export const todayIST = () => DateTime.now().setZone(TZ).toISODate();
export const dateIST = (d) => DateTime.fromJSDate(d, { zone: TZ }).toISODate();

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit);
}

export function fa(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const fixed = value.toFixed(digits);
  const [integer, fraction] = fixed.split('.');
  const grouped = (integer ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  const text = fraction ? `${grouped}٫${fraction}` : grouped;
  return toFaDigits(text);
}

export function faPercent(value: number, digits = 0): string {
  return `${fa(value, digits)}٪`;
}

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export interface StationClock {
  day: number;
  hours: number;
  minutes: number;
  label: string;
}

export function stationClock(minute: number): StationClock {
  const total = Math.floor(minute) + 6 * 60;
  const day = Math.floor(total / 1440) + 1;
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  return { day, hours, minutes, label: `روز ${toFaDigits(day)} — ${toFaDigits(pad2(hours))}:${toFaDigits(pad2(minutes))}` };
}

export function durationLabel(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const mins = whole % 60;
  if (hours <= 0) return `${fa(mins)} دقیقه`;
  return `${fa(hours)} ساعت و ${fa(mins)} دقیقه`;
}

export function pressureLabel(mpa: number): string {
  return `${fa(mpa, 1)} مگاپاسکال`;
}

export function temperatureLabel(celsius: number): string {
  return `${fa(celsius, 1)}°C`;
}

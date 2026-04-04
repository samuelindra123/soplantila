export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function isAtLeastAge(dateOfBirth: Date, minimumAge: number, now = new Date()): boolean {
  const threshold = new Date(
    now.getFullYear() - minimumAge,
    now.getMonth(),
    now.getDate(),
  );

  return dateOfBirth <= threshold;
}

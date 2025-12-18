// Instagram-style date formatting utility with global timezone support
export const getDateLabel = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  // Get user's locale and timezone
  const userLocale = navigator.language || "en-US";
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Convert dates to user's local timezone for comparison
  const messageDateLocal = new Date(
    messageDate.toLocaleString("en-US", { timeZone: userTimezone }),
  );
  const todayLocal = new Date(
    today.toLocaleString("en-US", { timeZone: userTimezone }),
  );
  const yesterdayLocal = new Date(
    yesterday.toLocaleString("en-US", { timeZone: userTimezone }),
  );
  // Reset time to compare only dates in user's timezone
  const messageDateOnly = new Date(
    messageDateLocal.getFullYear(),
    messageDateLocal.getMonth(),
    messageDateLocal.getDate(),
  );
  const todayOnly = new Date(
    todayLocal.getFullYear(),
    todayLocal.getMonth(),
    todayLocal.getDate(),
  );
  const yesterdayOnly = new Date(
    yesterdayLocal.getFullYear(),
    yesterdayLocal.getMonth(),
    yesterdayLocal.getDate(),
  );
  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  } else {
    // For older dates, show full date in user's locale and timezone
    return messageDate.toLocaleDateString(userLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: userTimezone,
    });
  }
};
// Check if two dates are on different days in user's local timezone
export const isDifferentDay = (date1, date2) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Convert both dates to user's local timezone
  const d1Local = new Date(
    new Date(date1).toLocaleString("en-US", { timeZone: userTimezone }),
  );
  const d2Local = new Date(
    new Date(date2).toLocaleString("en-US", { timeZone: userTimezone }),
  );
  return (
    d1Local.getDate() !== d2Local.getDate() ||
    d1Local.getMonth() !== d2Local.getMonth() ||
    d1Local.getFullYear() !== d2Local.getFullYear()
  );
};

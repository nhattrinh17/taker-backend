import { IPeriod } from '@common/constants/app.constant';

export const getDatesByWeekOrMonth = (
  weekOrMonth: IPeriod,
  start?: Date,
  end?: Date,
): string[] => {
  // Changed return type to string[] for consistency with date formatting
  const currentDate = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (weekOrMonth) {
    case 'week':
      const currentDayOfWeek = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDayOfWeek);
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + (6 - currentDayOfWeek));
      break;
    case 'month':
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      break;
    case 'today':
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
      break;
    case 'custom':
      if (!start || !end) {
        throw new Error(
          'For "custom" type, both start and end dates must be provided.',
        );
      }
      startDate = new Date(start);
      endDate = new Date(end);
      if (startDate > endDate) {
        throw new Error('Start date must be before end date.');
      }
      // Calculate the difference in days between start and end dates
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Check if the difference is greater than 90 days (~3 months)
      if (diffDays > 90) {
        throw new Error('The date range should not exceed 3 months.');
      }
      break;
    default:
      throw new Error(
        'Invalid option. Please choose "week", "month", or "today".',
      );
  }

  const dates = [];
  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date).toISOString().split('T')[0]);
  }

  return dates;
};

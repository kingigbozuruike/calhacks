import dayjs from 'dayjs';

/**
 * Given a conception date (string or Date object), return pregnancy details:
 * - current week
 * - current trimester
 * - total days since conception
 * - due date (assumed 40 weeks from conception)
 * - percentage complete
 */
export const getPregnancyInfo = (conceptionDate) => {
    if (!conceptionDate) return null;

    const start = dayjs(conceptionDate);
    const today = dayjs();
    const totalPregnancyDays = 280; // 40 weeks * 7 days

    const daysPassed = today.diff(start, 'day');
    const currentWeek = Math.floor(daysPassed / 7);
    const percentage = Math.min(100, Math.floor((daysPassed / totalPregnancyDays) * 100));
    const dueDate = start.add(40, 'week');

    let trimester;
    if (currentWeek <= 13) trimester = 1;
    else if (currentWeek <= 27) trimester = 2;
    else trimester = 3;

    return {
        daysPassed,
        currentWeek,
        trimester,
        percentage,
        dueDate: dueDate.format('YYYY-MM-DD')
    };
};

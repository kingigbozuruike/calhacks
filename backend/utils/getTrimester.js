const dayjs = require('dayjs');

function getTrimester(conceptionDate) {
  if (!conceptionDate) return null;
  const now = dayjs();
  const conception = dayjs(conceptionDate);
  const weeks = now.diff(conception, 'week');
  if (weeks < 13) return 'first';
  if (weeks < 27) return 'second';
  return 'third';
}

module.exports = getTrimester;
// You can adjust the week ranges if needed

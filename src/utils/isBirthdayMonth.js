function isBirthdayMonth(dob, now = new Date()) {
  if (!dob) return false;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() === now.getMonth();
}

module.exports = isBirthdayMonth;

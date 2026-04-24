const { customAlphabet } = require('nanoid');
const nano = customAlphabet('0123456789', 4);

function generateOrderNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `KC-${yy}${mm}${dd}-${nano()}`;
}

module.exports = generateOrderNumber;

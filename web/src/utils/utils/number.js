export const formatNumber = num => {
  return !isPercentage(num) ? Number(num).toLocaleString() : num
}

// eslint-disable-next-line security/detect-unsafe-regex
const isPercentage = input => /^\d+(\.\d+)?%$/.test(input)

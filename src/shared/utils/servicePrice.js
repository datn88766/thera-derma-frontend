/** Format service price range like Thera Derma price list: "950 ~ 1.200k" */
export function formatServicePriceRange(price, priceMax) {
  const min = Number(price) || 0;
  const max = Number(priceMax) || 0;

  if (max > min) {
    const toK = (vnd) => {
      const k = vnd / 1000;
      return k >= 1000 ? new Intl.NumberFormat('vi-VN').format(k) : String(k);
    };
    return `${toK(min)} ~ ${toK(max)}k`;
  }

  if (min > 0) {
    return `${new Intl.NumberFormat('vi-VN').format(min)} ₫`;
  }

  return '';
}

export const FEATURED_SERVICE_NAMES = [
  'AQUA + Exforliate',
  'NANO LIGHT + Exforliate',
  '24K GOLD + Exforliate',
];

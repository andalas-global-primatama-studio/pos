// Format currency to Indonesian Rupiah
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rp 0';
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};


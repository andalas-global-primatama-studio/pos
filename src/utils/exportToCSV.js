import { formatCurrency } from './formatCurrency';

// Export data to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content with total row for transactions
  let rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  // Add total row if the data contains Total field
  if (headers.includes('Total')) {
    const total = data.reduce((sum, row) => sum + (parseFloat(String(row.Total).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const totalRow = headers.map(header => {
      if (header === 'Total') return formatCurrency(total);
      if (header === 'Invoice') return 'TOTAL TRANSAKSI';
      return '';
    }).join(',');
    rows.push(totalRow);
  }

  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'export.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to JSON
export const exportToJSON = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'export.json');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export financial report to CSV with sections: header, summary, incomes, expenses, signatures
export const exportFinancialReportCSV = (report, filename) => {
  try {
    const lines = [];

    // Header
    lines.push([report.title || 'Laporan Keuangan']);
    lines.push([report.storeName || '']);
    if (report.period) {
      lines.push([`Periode: ${report.period.start || '-'} s/d ${report.period.end || '-'}`]);
    }
    lines.push([]);

    // Summary
    lines.push(['Ringkasan']);
    const s = report.summary || {};
    lines.push(['Total Pendapatan', s.totalRevenue || 0]);
    lines.push(['Harga Pokok Penjualan', s.totalCost || 0]);
    lines.push(['Laba Kotor', s.grossProfit || 0]);
    lines.push(['Total Pengeluaran', s.totalExpenses || 0]);
    lines.push(['Laba Bersih', s.netProfit || 0]);
    lines.push(['Rata-rata Pendapatan Harian', s.avgDailyRevenue || 0]);
    lines.push(['Rata-rata Pengeluaran Harian', s.avgDailyExpenses || 0]);
    lines.push([]);

    // Income details
    lines.push(['Detail Pendapatan']);
    // include Qty column
    lines.push(['Tanggal', 'No. Invoice', 'Deskripsi', 'Qty', 'Jumlah']);
    (report.incomes || []).forEach(i => {
      lines.push([
        i.date ? new Date(i.date).toLocaleDateString('id-ID') : '-',
        i.invoice || '-',
        (i.description || '').replace(/\n/g, ' '),
        typeof i.qty === 'number' ? i.qty : (i.qty || 0),
        typeof i.amount === 'number' ? i.amount : (i.amount || 0)
      ]);
    });
  // Add total row for income with left-aligned label (numeric nominal value)
  const totalIncome = (report.incomes || []).reduce((sum, i) => sum + (typeof i.amount === 'number' ? i.amount : 0), 0);
  const totalQty = (report.incomes || []).reduce((sum, i) => sum + (typeof i.qty === 'number' ? i.qty : 0), 0);
  // push raw numeric nominal to allow spreadsheet totals; CSV consumers can format as needed
  lines.push(['TOTAL PENDAPATAN', '', '', totalQty, totalIncome]);
    lines.push([]);

    // Expense details
    lines.push(['Detail Pengeluaran']);
    lines.push(['Tanggal', 'Deskripsi', 'Jumlah']);
    (report.expenses || []).forEach(e => {
      lines.push([
        e.date ? new Date(e.date).toLocaleDateString('id-ID') : '-',
        (e.description || '').replace(/\n/g, ' '),
        typeof e.amount === 'number' ? e.amount : (e.amount || 0)
      ]);
    });
  // Add total row for expenses with left-aligned label (numeric nominal value)
  const totalExpenses = (report.expenses || []).reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : 0), 0);
  lines.push(['TOTAL PENGELUARAN', '', totalExpenses]);
    lines.push([]);

    // Signatures
    lines.push(['Mengetahui', '', 'Diketahui']);
    lines.push(['Pembuat Laporan', '', 'Admin']);

    // Convert lines to CSV
    const csv = lines.map(row => row.map(col => {
      if (typeof col === 'string' && (col.includes(',') || col.includes('"'))) {
        return `"${col.replace(/"/g, '""')}"`;
      }
      return col;
    }).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `laporan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('exportFinancialReportCSV failed', err);
    alert('Gagal mengekspor CSV');
  }
};



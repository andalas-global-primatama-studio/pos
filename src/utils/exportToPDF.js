import { formatCurrency } from './formatCurrency';

// Export data to PDF using jsPDF
export const exportToPDF = (data, filename, title = 'Laporan') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  // Dynamic import jsPDF
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then((autoTablePlugin) => {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 22);
      
      // Add date
      const date = new Date().toLocaleDateString('id-ID');
      doc.setFontSize(10);
      doc.text(`Tanggal: ${date}`, 14, 28);
      
      // Prepare table data
      const headers = Object.keys(data[0]);
      let rows = data.map(row => headers.map(header => row[header] || ''));
      
      // Add total row if the data contains Total field
      if (headers.includes('Total')) {
        const total = data.reduce((sum, row) => parseFloat(String(row.Total).replace(/[^0-9.-]+/g, '')) || 0, 0);
        const totalRow = headers.map(header => {
          if (header === 'Total') return formatCurrency(total);
          if (header === 'Invoice') return 'TOTAL TRANSAKSI';
          return '';
        });
        rows.push(totalRow);
      }
      
      // Add table
      autoTablePlugin.default(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 40 }
        },
        didParseCell: (data) => {
          // Style for total row
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [242, 247, 255]; // Light blue background
            if (data.column.index === headers.indexOf('Total')) {
              data.cell.styles.textColor = [0, 87, 168]; // Blue color for total amount
            }
            // Left align the TOTAL text
            if (data.column.index === headers.indexOf('Invoice')) {
              data.cell.styles.halign = 'left';
            }
          }
        }
      });
      
      // Save the PDF
      doc.save(filename || `${title}_${Date.now()}.pdf`);
    });
  }).catch(error => {
    console.error('Error loading jsPDF:', error);
    alert('Terjadi kesalahan saat mengekspor ke PDF');
  });
};

// Export a detailed financial report PDF with summary, details, and signature block
export const exportFinancialReportPDF = (report, filename) => {
  // report: { title, period: {start, end}, storeName, summary, incomes, expenses, signers }
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then((autoTablePlugin) => {
      const doc = new jsPDF({ unit: 'pt' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.text(report.title || 'Laporan Keuangan', pageWidth / 2, 40, { align: 'center' });

      // Store name
      doc.setFontSize(12);
      doc.text(report.storeName || '', pageWidth / 2, 60, { align: 'center' });

      // Period
      const periodText = report.period && (report.period.start || report.period.end)
        ? `Periode: ${report.period.start || '-'} s/d ${report.period.end || '-'}`
        : `Tanggal: ${new Date().toLocaleDateString('id-ID')}`;
      doc.setFontSize(10);
      doc.text(periodText, pageWidth / 2, 76, { align: 'center' });

      let cursorY = 100;

      // Summary
      doc.setFontSize(12);
      doc.text('Ringkasan Laporan', 40, cursorY);
      cursorY += 8;

      const summary = report.summary || {};
      const summaryRows = [
        ['Total Pendapatan', summary.totalRevenue || 0],
        ['Harga Pokok Penjualan', summary.totalCost || 0],
        ['Laba Kotor', summary.grossProfit || 0],
        ['Total Pengeluaran', summary.totalExpenses || 0],
        ['Laba Bersih', summary.netProfit || 0],
        ['Rata-rata Pendapatan Harian', summary.avgDailyRevenue || 0],
        ['Rata-rata Pengeluaran Harian', summary.avgDailyExpenses || 0]
      ];

      autoTablePlugin.default(doc, {
        startY: cursorY + 6,
        theme: 'plain',
        styles: { fontSize: 10 },
        body: summaryRows.map(r => [{ content: r[0], styles: { halign: 'left' } }, { content: typeof r[1] === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r[1]) : r[1], styles: { halign: 'right' } }]),
        columnStyles: { 0: { cellWidth: 300 }, 1: { cellWidth: pageWidth - 360 } },
        didParseCell: (data) => {
          // Add light background color for total rows
          if (data.row.raw[0] === 'Total Pendapatan' || data.row.raw[0] === 'Total Pengeluaran' || data.row.raw[0] === 'Laba Bersih') {
            data.cell.styles.fillColor = [242, 247, 255]; // Light blue background
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : cursorY + 80;

      // Detail Pendapatan
      doc.setFontSize(12);
      doc.text('Detail Pendapatan', 40, cursorY);
      cursorY += 8;

      const incomeHeaders = ['Tanggal', 'No. Invoice', 'Deskripsi', 'Qty', 'Jumlah'];
      const totalIncome = (report.incomes || []).reduce((sum, i) => sum + (typeof i.amount === 'number' ? i.amount : 0), 0);
      const totalQty = (report.incomes || []).reduce((sum, i) => sum + (typeof i.qty === 'number' ? i.qty : 0), 0);
      const incomeRows = [
        ...(report.incomes || []).map(i => [
          i.date ? new Date(i.date).toLocaleDateString('id-ID') : '-',
          i.invoice || '-',
          i.description || '-',
          typeof i.qty === 'number' ? i.qty : (i.qty || 0),
          typeof i.amount === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(i.amount) : i.amount || '-'
        ]),
        ['', '', 'Total Pendapatan', totalQty, new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalIncome)]
      ];

      autoTablePlugin.default(doc, {
        head: [incomeHeaders],
        body: incomeRows,
        startY: cursorY + 6,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 120 }, 2: { cellWidth: 200 }, 3: { cellWidth: 50, halign: 'center' }, 4: { cellWidth: 80, halign: 'right' } },
        didParseCell: (data) => {
          // style total row (last row)
          if (data.row.index === incomeRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [242, 247, 255];
            if (data.column.index === 4) data.cell.styles.textColor = [0, 87, 168];
            if (data.column.index === 1) data.cell.styles.halign = 'left';
          }
        }
      });

      cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : cursorY + 120;

      // Detail Pengeluaran
      doc.setFontSize(12);
      doc.text('Detail Pengeluaran', 40, cursorY);
      cursorY += 8;

      const expenseHeaders = ['Tanggal', 'Deskripsi', 'Jumlah'];
      const totalExpenses = (report.expenses || []).reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : 0), 0);
      const expenseRows = [
        ...(report.expenses || []).map(e => [
          e.date ? new Date(e.date).toLocaleDateString('id-ID') : '-',
          e.description || '-',
          typeof e.amount === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(e.amount) : e.amount || '-'
        ]),
        ['', 'Total Pengeluaran', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalExpenses)]
      ];

      autoTablePlugin.default(doc, {
        head: [expenseHeaders],
        body: expenseRows,
        startY: cursorY + 6,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 53, 69] },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 300 }, 2: { cellWidth: 80, halign: 'right' } }
      });

      cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 40 : cursorY + 120;

      // Signature block
      const leftX = 80;
      const rightX = pageWidth - 220;
      const sigY = cursorY;

      doc.setFontSize(10);
      doc.text('Mengetahui,', leftX, sigY);
      doc.text('Diketahui,', rightX, sigY);

      // Space for signature line
      const nameY = sigY + 70;
      doc.line(leftX, nameY - 6, leftX + 150, nameY - 6);
      doc.line(rightX, nameY - 6, rightX + 150, nameY - 6);

      doc.text('Pembuat Laporan', leftX, nameY + 20);
      doc.text('Admin', rightX, nameY + 20);

      // Save PDF
      doc.save(filename || `${report.title || 'laporan'}_${Date.now()}.pdf`);
    });
  }).catch(err => {
    console.error('Error generating PDF', err);
    alert('Gagal membuat PDF');
  });
};



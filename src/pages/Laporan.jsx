import { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';
import { useAuth } from '../context/AuthContext';
import { calculateProfit, calculateNetProfit } from '../utils/calculateProfit';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { exportToCSV, exportFinancialReportCSV } from '../utils/exportToCSV';
import { exportToPDF, exportFinancialReportPDF } from '../utils/exportToPDF';

const Laporan = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('penjualan');

  // Force tab to allowed tab if current is not allowed
  useEffect(() => {
    if (user?.role === 'kasir' && !['penjualan', 'produkterlaris', 'kasir'].includes(activeTab)) {
      setActiveTab('penjualan');
    }
  }, [user?.role, activeTab]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTransactions(storage.getAll(STORAGE_KEYS.TRANSACTIONS));
    setProducts(storage.getAll(STORAGE_KEYS.PRODUCTS));
    setCustomers(storage.getAll(STORAGE_KEYS.CUSTOMERS));
    setUsers(storage.getAll(STORAGE_KEYS.USERS));
  };

  const filteredTransactions = transactions.filter(t => {
    if (!dateRange.start && !dateRange.end) return true;
    const tDate = new Date(t.createdAt);
    if (dateRange.start && tDate < new Date(dateRange.start)) return false;
    if (dateRange.end && tDate > new Date(dateRange.end)) return false;
    return true;
  });

  // Sales Summary
  const getSalesSummary = () => {
    const total = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const count = filteredTransactions.length;
    const avg = count > 0 ? total / count : 0;
    
    // Group by period
    const dailySales = {};
    filteredTransactions.forEach(t => {
      const date = formatDate(t.createdAt, 'yyyy-MM-dd');
      if (!dailySales[date]) dailySales[date] = 0;
      dailySales[date] += t.total;
    });

    return { total, count, avg, dailySales };
  };

  // Profit/Loss calculation
  const getProfitLoss = () => {
    // Get profit from selling price minus purchase price
    const { totalRevenue, totalCost, grossProfit } = calculateProfit(filteredTransactions, products);
    
    // Get expenses for the filtered period
    const expenses = storage.getAll(STORAGE_KEYS.EXPENSES).filter(e => {
      if (!dateRange.start && !dateRange.end) return true;
      // expenses may store date in 'tanggal' or 'createdAt' or 'date'
      const raw = e.tanggal || e.createdAt || e.date;
      const eDate = raw ? new Date(raw) : null;
      if (!eDate) return true;
      if (dateRange.start && eDate < new Date(dateRange.start)) return false;
      if (dateRange.end && eDate > new Date(dateRange.end)) return false;
      return true;
    });

    // Calculate net profit after expenses
    const netProfit = calculateNetProfit(grossProfit, expenses);

    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.jumlah ?? e.amount ?? 0) || 0), 0);

    return { 
      revenue: totalRevenue, 
      cost: totalCost, 
      grossProfit,
      totalExpenses,
      netProfit
    };
  };

  // Inventory Value
  const getInventoryValue = () => {
    const value = products.reduce((sum, p) => sum + (p.hargaBeli * p.stok), 0);
    return value;
  };

  // Top Products
  const getTopProducts = () => {
    const productSales = {};
    
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            product: products.find(p => p.id === item.productId),
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .filter(p => p.product)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  // Cashier Performance
  const getCashierPerformance = () => {
    const performance = {};
    
    filteredTransactions.forEach(t => {
      const cashier = users.find(u => u.id === t.cashierId);
      if (cashier) {
        if (!performance[cashier.id]) {
          performance[cashier.id] = {
            nama: cashier.nama,
            count: 0,
            total: 0
          };
        }
        performance[cashier.id].count += 1;
        performance[cashier.id].total += t.total;
      }
    });

    return Object.values(performance).sort((a, b) => b.total - a.total);
  };

  const salesSummary = getSalesSummary();
  const profitLoss = getProfitLoss();
  const inventoryValue = getInventoryValue();
  const topProducts = getTopProducts();
  const cashierPerformance = getCashierPerformance();

  const handleExportCSV = () => {
    // If user is admin/manager/super_admin export detailed financial report
    const allowed = ['super_admin', 'admin', 'manager'];
    if (allowed.includes(user?.role)) {
      // Build report object
      const incomes = filteredTransactions.map(t => ({
        date: t.createdAt,
        invoice: t.invoiceNo,
        // Show product names in description (fall back to product lookup if item.name missing)
        description: (t.items || []).map(it => it.nama || products.find(p => p.id === it.productId)?.nama || '').filter(Boolean).join(', '),
        qty: (t.items || []).reduce((s, it) => s + (it.quantity || 0), 0),
        amount: t.total
      }));

      const allExpenses = storage.getAll('pos_expenses');
      const filteredExpenses = allExpenses.filter(e => {
        if (!dateRange.start && !dateRange.end) return true;
        const d = new Date(e.tanggal || e.createdAt);
        if (dateRange.start && d < new Date(dateRange.start)) return false;
        if (dateRange.end && d > new Date(dateRange.end)) return false;
        return true;
      });

      const expenses = filteredExpenses.map(e => ({
        date: e.tanggal || e.createdAt,
        description: e.deskripsi || e.description || '-',
        amount: parseFloat(e.jumlah || e.amount || 0)
      }));

      // Summary calculations
      const totalRevenue = incomes.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
      const totalExpenses = expenses.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

      // compute days in period
      let days = 1;
      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      } else {
        const dates = new Set();
        incomes.forEach(i => dates.add(new Date(i.date).toDateString()));
        expenses.forEach(e => dates.add(new Date(e.date).toDateString()));
        days = Math.max(1, dates.size);
      }

      // Calculate HPP and gross profit for the filtered transactions
      // Use unique local names to avoid duplicate identifier issues
      const { cost: hppCost, grossProfit: grossProfitCalc } = calculateProfit(filteredTransactions, products);

      const summary = {
        totalRevenue,
        totalCost: hppCost,  // HPP (Harga Pokok Penjualan)
        grossProfit: grossProfitCalc,  // Laba Kotor
        totalExpenses,
        avgDailyRevenue: totalRevenue / days,
        avgDailyExpenses: totalExpenses / days,
        netProfit: grossProfitCalc - totalExpenses  // Net profit after subtracting expenses from gross profit
      };

      const storeName = storage.get(STORAGE_KEYS.SETTINGS)?.companyName || '';

      const signers = {
        preparedBy: { name: 'Pembuat Laporan', title: 'Pembuat Laporan' },
        approvedBy: { name: 'Admin', title: 'Admin' }
      };

      const report = {
        title: 'Laporan Keuangan',
        period: dateRange,
        storeName,
        summary,
        incomes,
        expenses,
        signers
      };

      exportFinancialReportCSV(report, `laporan-keuangan-${Date.now()}.csv`);
      return;
    }

    const data = filteredTransactions.map(t => ({
      Invoice: t.invoiceNo,
      Tanggal: formatDate(t.createdAt),
      Total: t.total,
      Items: t.items.length,
      Kasir: users.find(u => u.id === t.cashierId)?.nama || '-',
      Status: t.status
    }));
    exportToCSV(data, `laporan-transaksi-${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const allowed = ['super_admin', 'admin', 'manager'];
      if (allowed.includes(user?.role)) {
      const incomes = filteredTransactions.map(t => ({
        date: t.createdAt,
        invoice: t.invoiceNo,
        // Show product names in description for PDF export as well
        description: (t.items || []).map(it => it.nama || products.find(p => p.id === it.productId)?.nama || '').filter(Boolean).join(', '),
        qty: (t.items || []).reduce((s, it) => s + (it.quantity || 0), 0),
        amount: t.total
      }));

      const allExpenses = storage.getAll('pos_expenses');
      const filteredExpenses = allExpenses.filter(e => {
        if (!dateRange.start && !dateRange.end) return true;
        const d = new Date(e.tanggal || e.createdAt);
        if (dateRange.start && d < new Date(dateRange.start)) return false;
        if (dateRange.end && d > new Date(dateRange.end)) return false;
        return true;
      });

      const expenses = filteredExpenses.map(e => ({
        date: e.tanggal || e.createdAt,
        description: e.deskripsi || e.description || '-',
        amount: parseFloat(e.jumlah || e.amount || 0)
      }));

      const totalRevenue = incomes.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
      const totalExpenses = expenses.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

      // Use profitLoss values that are already calculated
      let days = 1;
      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      } else {
        const dates = new Set();
        incomes.forEach(i => dates.add(new Date(i.date).toDateString()));
        expenses.forEach(e => dates.add(new Date(e.date).toDateString()));
        days = Math.max(1, dates.size);
      }

      const summary = {
        totalRevenue,
        totalCost: profitLoss.cost,  // HPP (Harga Pokok Penjualan)
        grossProfit: profitLoss.grossProfit,  // Laba Kotor
        totalExpenses,
        avgDailyRevenue: totalRevenue / days,
        avgDailyExpenses: totalExpenses / days,
        netProfit: profitLoss.grossProfit - totalExpenses  // Net profit using gross profit
      };

      const storeName = storage.get(STORAGE_KEYS.SETTINGS)?.companyName || '';
      const adminUser = users.find(u => u.role === 'admin' || u.role === 'super_admin');
      const signers = {
        preparedBy: { name: user?.nama || user?.username || '-', title: 'Pembuat Laporan' },
        approvedBy: { name: adminUser?.nama || '-', title: 'Admin' }
      };

      const report = {
        title: 'Laporan Keuangan',
        period: dateRange,
        storeName,
        summary,
        incomes,
        expenses,
        signers
      };

      exportFinancialReportPDF(report, `laporan-keuangan-${Date.now()}.pdf`);
      return;
    }

    const data = filteredTransactions.map(t => ({
      Invoice: t.invoiceNo,
      Tanggal: formatDate(t.createdAt),
      Total: formatCurrency(t.total),
      Items: t.items.length,
      Kasir: users.find(u => u.id === t.cashierId)?.nama || '-',
      Status: t.status
    }));
    exportToPDF(data, `laporan-transaksi-${Date.now()}.pdf`, 'Laporan Transaksi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-gray-600 mt-1">Analisis data penjualan dan keuangan</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Tanggal Mulai"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <Input
            label="Tanggal Akhir"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          <div className="flex items-end space-x-2">
            <Button variant="secondary" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportPDF}>
              Export PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {(user?.role === 'kasir' 
          ? ['penjualan', 'produkterlaris', 'kasir']
          : ['penjualan', 'labarugi', 'inventory', 'produkterlaris', 'kasir']
        ).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'penjualan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Penjualan</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(salesSummary.total)}</p>
                </div>
                <DollarSign className="text-green-600" size={32} />
              </div>
            </Card>
            <Card className="border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transaksi</p>
                  <p className="text-2xl font-bold mt-2">{salesSummary.count}</p>
                </div>
                <TrendingUp className="text-blue-600" size={32} />
              </div>
            </Card>
            <Card className="border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rata-rata</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(salesSummary.avg)}</p>
                </div>
                <Package className="text-purple-600" size={32} />
              </div>
            </Card>
          </div>

          <Card title="Grafik Penjualan Harian">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Object.entries(salesSummary.dailySales).map(([date, sales]) => ({ date: formatDate(date, 'dd/MM'), sales }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {activeTab === 'labarugi' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Laba Rugi</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded">
                <span className="font-medium">Pendapatan:</span>
                <span className="font-bold text-green-600">{formatCurrency(profitLoss.revenue)}</span>
              </div>

              <div className="flex justify-between p-3 bg-yellow-50 rounded">
                <span className="font-medium">Harga Pokok Penjualan (HPP):</span>
                <span className="font-bold text-yellow-700">-{formatCurrency(profitLoss.cost)}</span>
              </div>

              <div className="flex justify-between p-3 bg-indigo-50 rounded">
                <span className="font-medium">Laba Kotor:</span>
                <span className="font-bold text-indigo-700">{formatCurrency(profitLoss.grossProfit)}</span>
              </div>

              <div className="flex justify-between p-3 bg-red-50 rounded">
                <span className="font-medium">Total Pengeluaran:</span>
                <span className="font-bold text-red-600">-{formatCurrency(profitLoss.totalExpenses)}</span>
              </div>

              <div className="flex justify-between p-3 bg-blue-50 rounded border-2 border-blue-500">
                <span className="font-bold">Laba Bersih:</span>
                <span className="font-bold text-blue-600">{formatCurrency(profitLoss.netProfit)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'inventory' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Nilai Inventory</h3>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-blue-600">{formatCurrency(inventoryValue)}</p>
            <p className="text-gray-600 mt-2">Total nilai stok berdasarkan harga beli</p>
          </div>
        </Card>
      )}

      {activeTab === 'produkterlaris' && (
        <Card title="Top 10 Produk Terlaris">
          <div className="space-y-4">
            {topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{item.product?.nama}</p>
                    <p className="text-sm text-gray-600">{item.quantity} terjual</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(item.revenue)}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'kasir' && (
        <Card title="Performa Kasir">
          <div className="space-y-4">
            {cashierPerformance.map((perf, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{perf.nama}</p>
                  <p className="text-sm text-gray-600">{perf.count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(perf.total)}</p>
                  <p className="text-sm text-gray-600">Total penjualan</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Laporan;


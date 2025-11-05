import { useAuth } from '../context/AuthContext';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  DollarSign,
  AlertTriangle 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  
  const transactions = storage.getAll(STORAGE_KEYS.TRANSACTIONS);
  const products = storage.getAll(STORAGE_KEYS.PRODUCTS);
  const today = new Date();
  
  // Today's transactions
  const todayTransactions = transactions.filter(t => {
    const tDate = new Date(t.createdAt);
    return tDate.toDateString() === today.toDateString();
  });

  // Calculate stats
  const todaySales = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const todayTransactionsCount = todayTransactions.length;
  const todayItemsSold = todayTransactions.reduce((sum, t) => 
    sum + t.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayProfit = todayTransactions.reduce((sum, t) => {
    const cost = t.items.reduce((s, item) => {
      const product = products.find(p => p.id === item.productId);
      return s + ((product?.hargaBeli || 0) * item.quantity);
    }, 0);
    return sum + (t.total - cost);
  }, 0);

  // Low stock products
  const lowStockProducts = products.filter(p => p.stok <= p.minStok);

  // Last 7 days sales data
  const salesData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate.toDateString() === date.toDateString();
    });
    const total = dayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    salesData.push({
      date: formatDate(date, 'dd/MM'),
      sales: total
    });
  }

  // Top products (by quantity sold)
  const topProducts = [];
  const productSales = {};
  
  transactions.forEach(t => {
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

  const topProductsList = Object.values(productSales)
    .filter(p => p.product)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const stats = [
    { label: 'Penjualan Hari Ini', value: formatCurrency(todaySales), icon: DollarSign, color: 'green' },
    { label: 'Transaksi', value: todayTransactionsCount, icon: ShoppingBag, color: 'blue' },
    { label: 'Produk Terjual', value: todayItemsSold, icon: Package, color: 'purple' },
    { label: 'Laba Hari Ini', value: formatCurrency(todayProfit), icon: TrendingUp, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Selamat datang, {user?.nama}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-l-4" style={{ borderLeftColor: `var(--tw-${stat.color}-600)` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`bg-${stat.color}-100 p-3 rounded-full`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card title="Penjualan 7 Hari Terakhir">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card title="Produk Terlaris">
          <div className="space-y-3">
            {topProductsList.length > 0 ? (
              topProductsList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product?.nama}</p>
                    <p className="text-sm text-gray-600">{item.quantity} terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Belum ada data</p>
            )}
          </div>
        </Card>
      </div>

      {/* Alerts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card title="Alert Stok Rendah">
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-yellow-600" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">{product.nama}</p>
                      <p className="text-sm text-gray-600">Stok: {product.stok} {product.satuan}</p>
                    </div>
                  </div>
                  <Badge variant="warning">Rendah</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Tidak ada produk dengan stok rendah</p>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card title="Transaksi Terbaru">
          {todayTransactions.length > 0 ? (
            <div className="space-y-2">
              {todayTransactions.slice(-5).reverse().map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.invoiceNo}</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.createdAt, 'HH:mm')}</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(transaction.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada transaksi hari ini</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;






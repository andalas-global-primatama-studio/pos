import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, STORAGE_KEYS } from '../utils/localStorage';
import { generateId } from '../utils/generateId';
import { generateInvoiceNo } from '../utils/generateInvoice';
import { formatCurrency } from '../utils/formatCurrency';
import { formatNumberWithDots, handleNumberInputChange } from '../utils/formatNumber';
import { formatDate } from '../utils/dateHelpers';
import { exportToCSV } from '../utils/exportToCSV';
import { exportToPDF } from '../utils/exportToPDF';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, FileText, Download } from 'lucide-react';

const Kasir = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.getAll(STORAGE_KEYS.PRODUCTS));
    setCustomers(storage.getAll(STORAGE_KEYS.CUSTOMERS));
    setTransactions(storage.getAll(STORAGE_KEYS.TRANSACTIONS));
  };

  const handleExportCSV = () => {
    // Build today's transactions and include product description & qty
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTransactions = storage.getAll(STORAGE_KEYS.TRANSACTIONS) || [];
    const productsList = storage.getAll(STORAGE_KEYS.PRODUCTS) || [];

    const todayTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.createdAt);
      tDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === today.getTime();
    });

    if (todayTransactions.length === 0) {
      alert('Tidak ada transaksi hari ini untuk diekspor');
      return;
    }

    // Prepare rows with Deskripsi (product names) and Qty
    const rows = todayTransactions.map(t => {
      const desc = (t.items || []).map(it => it.nama || productsList.find(p => p.id === it.productId)?.nama || '').filter(Boolean).join(', ');
      const qty = (t.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      return {
        Invoice: t.invoiceNo,
        Tanggal: formatDate(t.createdAt, 'dd/MM/yyyy HH:mm'),
        Deskripsi: desc,
        Qty: qty,
        Subtotal: formatCurrency(t.subtotal),
        Diskon: formatCurrency(t.discount || 0),
        PPN: formatCurrency(t.tax || 0),
        Total: formatCurrency(t.total),
        'Metode Bayar': t.payments?.[0]?.method || '-'
      };
    });

    // Summary for Total (numeric) and Qty
    const summary = todayTransactions.reduce((acc, t) => {
      acc.qty += (t.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      acc.total += (parseFloat(t.total) || 0);
      return acc;
    }, { qty: 0, total: 0 });

    // push a summary row (TOTAL) — include Qty and Total
    rows.push({
      Invoice: 'TOTAL TRANSAKSI',
      Tanggal: '',
      Deskripsi: '',
      Qty: summary.qty,
      Subtotal: '',
      Diskon: '',
      PPN: '',
      Total: formatCurrency(summary.total),
      'Metode Bayar': ''
    });

    exportToCSV(rows, `transaksi-kasir-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleExportPDF = () => {
    // Prepare today's transactions for PDF export (include Deskripsi and Qty)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTransactions = storage.getAll(STORAGE_KEYS.TRANSACTIONS) || [];
    const productsList = storage.getAll(STORAGE_KEYS.PRODUCTS) || [];

    const todayTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.createdAt);
      tDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === today.getTime();
    });

    if (todayTransactions.length === 0) {
      alert('Tidak ada transaksi hari ini untuk diekspor');
      return;
    }

    const data = todayTransactions.map(t => {
      const desc = (t.items || []).map(it => it.nama || productsList.find(p => p.id === it.productId)?.nama || '').filter(Boolean).join(', ');
      const qty = (t.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      return {
        Invoice: t.invoiceNo,
        Tanggal: formatDate(t.createdAt, 'dd/MM/yyyy HH:mm'),
        Deskripsi: desc,
        Qty: qty,
        Subtotal: formatCurrency(t.subtotal),
        Diskon: formatCurrency(t.discount || 0),
        PPN: formatCurrency(t.tax || 0),
        Total: formatCurrency(t.total),
        'Metode Bayar': t.payments?.[0]?.method || '-'
      };
    });

    // add summary row
    const summary = todayTransactions.reduce((acc, t) => {
      acc.qty += (t.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      acc.total += (parseFloat(t.total) || 0);
      return acc;
    }, { qty: 0, total: 0 });

    data.push({
      Invoice: 'TOTAL TRANSAKSI',
      Tanggal: '',
      Deskripsi: '',
      Qty: summary.qty,
      Subtotal: '',
      Diskon: '',
      PPN: '',
      Total: formatCurrency(summary.total),
      'Metode Bayar': ''
    });

    exportToPDF(data, `transaksi-kasir-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`, 'Laporan Transaksi Kasir Hari Ini');
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.harga }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        nama: product.nama,
        harga: product.hargaJual,
        quantity: 1,
        subtotal: product.hargaJual
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + change;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty, subtotal: newQty * item.harga };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getDiscount = () => {
    const subtotal = getSubtotal();
    if (!discountValue || subtotal === 0) return 0;
    
    if (discountType === 'percentage') {
      return (subtotal * parseFloat(discountValue)) / 100;
    } else {
      return parseFloat(discountValue);
    }
  };

  const getTax = () => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    // Cek apakah pajak diaktifkan
    if (!settings.taxEnabled) {
      return 0;
    }
    const taxRate = settings.taxRate || 0;
    return ((subtotal - discount) * taxRate) / 100;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getTax();
  };

  const handleCheckout = () => {
    const transaction = {
      id: generateId(),
      invoiceNo: generateInvoiceNo(),
      customerId: selectedCustomer || null,
      items: cart,
      subtotal: getSubtotal(),
      discount: getDiscount(),
      discountType: discountType,
      tax: getTax(),
      total: getTotal(),
      payments: [{
        method: paymentMethod,
        amount: getTotal()
      }],
      cashierId: user.id,
      createdAt: new Date(),
      status: 'completed'
    };

    // Save transaction
    const currentTransactions = storage.getAll(STORAGE_KEYS.TRANSACTIONS);
    currentTransactions.push(transaction);
    storage.set(STORAGE_KEYS.TRANSACTIONS, currentTransactions);
    setTransactions(currentTransactions); // Update local state

    // Update stock
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        storage.updateOne(STORAGE_KEYS.PRODUCTS, product.id, {
          stok: product.stok - item.quantity
        });
      }
    });

    setCurrentTransaction(transaction);
    setShowReceipt(true);
    resetCart();
  };

  const resetCart = () => {
    setCart([]);
    setSelectedCustomer('');
    setDiscountType('percentage');
    setDiscountValue('');
    setPaymentMethod('tunai');
    setPaymentAmount('');
  };

  const filteredProducts = products.filter(p =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax();
  const total = getTotal();
  const kembalian = paymentMethod === 'tunai' ? parseFloat(paymentAmount || 0) - total : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Export Buttons */}
      <div className="lg:col-span-2">
        <div className="flex gap-2 mb-4">
          <Button variant="secondary" onClick={handleExportCSV} className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handleExportPDF} className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Left Panel - Products */}
      <div className="lg:col-span-2">
        <Card>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
              >
                <p className="font-semibold text-gray-900">{product.nama}</p>
                <p className="text-sm text-gray-600">{product.sku}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">{formatCurrency(product.hargaJual)}</p>
                <p className="text-xs text-gray-500 mt-1">Stok: {product.stok}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Right Panel - Cart */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <div className="flex items-center mb-4">
            <ShoppingCart className="mr-2" />
            <h2 className="text-xl font-bold">Keranjang</h2>
          </div>

          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Keranjang kosong</p>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.nama}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.harga)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 hover:bg-red-100 rounded ml-2"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold ml-4">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {/* Discount */}
                <div className="flex items-center space-x-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="nominal">Rp</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Diskon"
                    value={formatNumberWithDots(discountValue)}
                    onChange={(e) => handleNumberInputChange(e.target.value, (val) => setDiscountValue(val.replace(/\./g, '')))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Diskon:</span>
                  <span className="text-red-600">-{formatCurrency(discount)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>PPN:</span>
                  <span>{formatCurrency(tax)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>

                {/* Payment */}
                <div className="mt-4 space-y-2">
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={[
                      { value: 'tunai', label: 'Tunai' },
                      { value: 'debit', label: 'Debit' },
                      { value: 'kredit', label: 'Kredit' },
                      { value: 'qris', label: 'QRIS' },
                      { value: 'transfer', label: 'Transfer' }
                    ]}
                  />
                  
                  {paymentMethod === 'tunai' && (
                    <Input
                      type="text"
                      placeholder="Jumlah bayar"
                      value={formatNumberWithDots(paymentAmount)}
                      onChange={(e) => handleNumberInputChange(e.target.value, (val) => setPaymentAmount(val.replace(/\./g, '')))}
                    />
                  )}

                  {paymentMethod === 'tunai' && paymentAmount && kembalian >= 0 && (
                    <div className="flex justify-between font-semibold">
                      <span>Kembalian:</span>
                      <span className="text-green-600">{formatCurrency(kembalian)}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-4"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} size="sm" title="Struk Pembayaran">
        {currentTransaction && (
          <div className="space-y-4">
            {/* Printable receipt content */}
            <div id="receipt-content" className="print-content bg-white p-4 border border-gray-200 rounded">
              <div className="text-center mb-4">
                {storage.get(STORAGE_KEYS.SETTINGS)?.logo && (
                  <img 
                    src={storage.get(STORAGE_KEYS.SETTINGS).logo} 
                    alt="Logo Toko" 
                    className="h-16 mx-auto mb-2 object-contain"
                  />
                )}
                <h3 className="font-bold text-base">{storage.get(STORAGE_KEYS.SETTINGS)?.companyName || 'TOKO'}</h3>
                <p className="text-xs">{storage.get(STORAGE_KEYS.SETTINGS)?.companyAddress || ''}</p>
                <p className="text-xs">{storage.get(STORAGE_KEYS.SETTINGS)?.companyPhone || ''}</p>
                <div className="border-t border-dashed my-2"></div>
              </div>
              
              <div className="text-xs space-y-1 mb-3">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span>{currentTransaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatDate(currentTransaction.createdAt, 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="border-t border-dashed my-2"></div>
              </div>
              
              <div className="space-y-2 mb-3">
                {currentTransaction.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.nama}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{item.quantity} x {formatCurrency(item.harga)}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed my-3"></div>
              
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(currentTransaction.subtotal)}</span>
                </div>
                {currentTransaction.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatCurrency(currentTransaction.discount)}</span>
                  </div>
                )}
                {currentTransaction.tax > 0 && (
                  <div className="flex justify-between">
                    <span>PPN ({storage.get(STORAGE_KEYS.SETTINGS)?.taxRate || 0}%):</span>
                    <span>{formatCurrency(currentTransaction.tax)}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t-2 border-dashed border-black my-3"></div>
              
              <div className="flex justify-between font-bold text-sm mb-3">
                <span>TOTAL:</span>
                <span>{formatCurrency(currentTransaction.total)}</span>
              </div>
              
              {paymentMethod === 'tunai' && paymentAmount && (
                <div className="text-xs mb-2">
                  <div className="flex justify-between mb-1">
                    <span>Bayar:</span>
                    <span>{formatCurrency(paymentAmount)}</span>
                  </div>
                  {parseFloat(paymentAmount) > currentTransaction.total && (
                    <div className="flex justify-between">
                      <span>Kembali:</span>
                      <span>{formatCurrency(parseFloat(paymentAmount) - currentTransaction.total)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-dashed my-3"></div>
              <div className="text-center text-xs text-gray-600 py-2">
                <p>Terima kasih atas kunjungan Anda</p>
                <p>{storage.get(STORAGE_KEYS.SETTINGS)?.receiptFooter || ''}</p>
              </div>
              <div className="border-t border-dashed my-2"></div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  window.print();
                }} 
                variant="secondary" 
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Struk
              </Button>
              <Button 
                onClick={() => setShowReceipt(false)} 
                variant="primary" 
                className="flex-1"
              >
                Selesai
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Kasir;


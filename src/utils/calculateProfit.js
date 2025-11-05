// Calculate profit from transactions and products
export const calculateProfit = (transactions, products) => {
  let totalRevenue = 0;
  let totalCost = 0;
  
  transactions.forEach(transaction => {
    if (!transaction || !Array.isArray(transaction.items)) return;
    transaction.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      // Determine revenue for the item: prefer explicit subtotal, then harga * quantity, then price * quantity
      const itemQuantity = parseFloat(item.quantity) || 0;
      const itemSubtotal = typeof item.subtotal === 'number' ? item.subtotal : (typeof item.harga === 'number' ? item.harga * itemQuantity : (typeof item.price === 'number' ? item.price * itemQuantity : 0));
      totalRevenue += itemSubtotal;

      if (product) {
        // Cost from purchase price multiplied by quantity
        totalCost += (parseFloat(product.hargaBeli) || 0) * itemQuantity;
      }
    });
  });

  const grossProfit = totalRevenue - totalCost;
  return { totalRevenue, totalCost, grossProfit };
};

// Calculate net profit after expenses
export const calculateNetProfit = (grossProfit, expenses) => {
  // Expenses may store amount in different fields (jumlah, amount)
  const totalExpenses = (expenses || []).reduce((sum, expense) => {
    const val = parseFloat(expense.jumlah ?? expense.amount ?? 0) || 0;
    return sum + val;
  }, 0);
  return grossProfit - totalExpenses;
};
// Generate invoice number
export const generateInvoiceNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = String(Date.now()).slice(-6);
  
  return `INV/${year}${month}${day}/${timestamp}`;
};



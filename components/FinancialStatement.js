function FinancialStatement({ user, onClose, autoDownload }) {
  try {
    const statementRef = React.useRef(null);

    const getTotalPrice = () => {
      if (user.lessonPackages && user.lessonPackages.length > 0) {
        return user.lessonPackages.reduce((sum, p) => sum + p.price, 0);
      }
      return user.lessonPackage ? user.lessonPackage.price : 0;
    };

    const getMonthlyPayments = () => {
      const payments = [];
      const totalPrice = getTotalPrice();
      
      for (let i = 1; i <= 3; i++) {
        const priceForMonth = i === 3 ? totalPrice * 0.5 : totalPrice;
        const monthData = user.monthlyPayments?.[`month${i}`] || {
          price: priceForMonth,
          amountPaid: i === 1 ? (user.amountPaid || 0) : 0,
          balance: i === 1 ? (priceForMonth - (user.amountPaid || 0)) : priceForMonth,
          status: i === 1 ? (user.paymentStatus || 'UNPAID') : 'UNPAID'
        };
        payments.push({
          month: i,
          date: `Month ${i}${i > 1 ? ' (Upcoming)' : ''}${i === 3 ? ' (50% Rate)' : ''}`,
          amountDue: priceForMonth,
          amountPaid: monthData.amountPaid,
          balance: monthData.balance,
          status: monthData.status
        });
      }
      return payments;
    };

    const downloadPDF = async () => {
      try {
        if (!window.html2canvas || !window.jspdf) throw new Error('PDF tools did not load');
        const element = statementRef.current;
        const downloadBtn = element.querySelector('[data-download-btn]');
        
        if (downloadBtn) {
          downloadBtn.style.display = 'none';
        }
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: element.scrollHeight
        });
        
        if (downloadBtn) {
          downloadBtn.style.display = '';
        }
        
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        
        pdf.save(`${user.name.replace(/\s+/g, '_')}_Financial_Statement.pdf`);
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Failed to generate PDF. Please try again.');
      }
      if (autoDownload && onClose) onClose();
    };

    // hidden mode: build the statement off-screen, save the PDF, then close
    React.useEffect(() => {
      if (!autoDownload) return;
      const t = setTimeout(downloadPDF, 700);
      return () => clearTimeout(t);
    }, []);

    const renderStatement = () => (
          <div ref={statementRef} className="p-8 bg-white" style={{width: '210mm', minHeight: '297mm'}}>
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <img src="https://app.trickle.so/storage/public/images/usr_1877ca6910000001/ff96661b-0b33-45d8-9670-a9e8d7ca2e11.png" alt="HashCLASS Logo" className="w-16 h-16 object-contain" />
                <div>
                  <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-2">HashCLASS</h1>
                  <p className="text-sm text-gray-600">The Golden Minds</p>
                  <p className="text-xs text-gray-500 mt-1">Financial Statement</p>
                </div>
              </div>
              <button data-download-btn onClick={downloadPDF} className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-color)] flex items-center gap-2">
                <div className="icon-download text-lg"></div>
                DOWNLOAD
              </button>
            </div>

            <div className="border-2 border-[var(--primary-color)] rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img src={user.profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-gray-600">{user.regNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">Course:</span> {user.course}</div>
                <div><span className="font-semibold">Year:</span> {user.year}</div>
                <div><span className="font-semibold">Email:</span> {user.email}</div>
                <div><span className="font-semibold">Phone:</span> {user.phone}</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 text-[var(--primary-color)]">Enrolled Package(s)</h3>
              {user.lessonPackages && user.lessonPackages.length > 0 ? (
                user.lessonPackages.map((pkg, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2">
                    <p className="font-semibold">{packageLabel(pkg)}</p>
                    <p className="text-sm font-bold text-[var(--primary-color)]">TZS {pkg.price.toLocaleString()}/month</p>
                  </div>
                ))
              ) : user.lessonPackage ? (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold">{user.lessonPackage.name}</p>
                  <p className="text-sm text-gray-600">{user.lessonPackage.description}</p>
                  <p className="text-sm font-bold text-[var(--primary-color)]">TZS {user.lessonPackage.price.toLocaleString()}/month</p>
                </div>
              ) : <p className="text-gray-500">No package enrolled</p>}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 text-[var(--primary-color)]">Payment Records</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--primary-color)] text-white">
                    <th className="border p-2 text-left">Month</th>
                    <th className="border p-2 text-right">Amount Due</th>
                    <th className="border p-2 text-right">Amount Paid</th>
                    <th className="border p-2 text-right">Balance</th>
                    <th className="border p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getMonthlyPayments().map((payment, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border p-2">{payment.date}</td>
                      <td className="border p-2 text-right">TZS {payment.amountDue.toLocaleString()}</td>
                      <td className="border p-2 text-right font-semibold text-green-600">TZS {payment.amountPaid.toLocaleString()}</td>
                      <td className="border p-2 text-right font-semibold text-red-600">TZS {payment.balance.toLocaleString()}</td>
                      <td className="border p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--secondary-color)] font-bold">
                    <td className="border p-2">TOTAL</td>
                    <td className="border p-2 text-right">TZS {(getTotalPrice() * 3).toLocaleString()}</td>
                    <td className="border p-2 text-right text-green-600">TZS {getMonthlyPayments().reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()}</td>
                    <td className="border p-2 text-right text-red-600">TZS {getMonthlyPayments().reduce((sum, p) => sum + p.balance, 0).toLocaleString()}</td>
                    <td className="border p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center gap-4 mb-6">
                <img src="https://app.trickle.so/storage/public/images/usr_1a3cb5b2f8000001/acaeced0-5df0-40e1-950d-789fc68ea53d.jpeg" alt="CEO" className="w-20 h-20 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">Approved By:</p>
                  <p className="text-lg font-bold text-[var(--primary-color)]">Hashimu Shabani Halifa</p>
                  <p className="text-sm text-gray-600">CEO & Founder, HashCLASS</p>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()} | HashCLASS - The Golden Minds</p>
              </div>
            </div>
          </div>
    );

    if (autoDownload) {
      return (
        <div style={{ position: 'fixed', left: '-10000px', top: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden="true">
          {renderStatement()}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {renderStatement()}
        </div>
      </div>
    );
  } catch (error) {
    console.error('FinancialStatement error:', error);
    return null;
  }
}
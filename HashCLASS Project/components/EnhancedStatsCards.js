function EnhancedStatsCards({ validUsers, registeredUsers }) {
  const chartRef1 = React.useRef(null);
  const chartRef2 = React.useRef(null);
  const chartInstance1 = React.useRef(null);
  const chartInstance2 = React.useRef(null);

  const abbreviateCourse = (course) => {
    const abbrev = {
      'Bachelor of Science in Computer Science': 'BSc CS',
      'Bachelor of Science in Information Technology': 'BSc IT',
      'Bachelor of Engineering': 'B.Eng',
      'Bachelor of Commerce': 'B.Com',
      'Bachelor of Arts': 'BA',
      'Bachelor of Education': 'B.Ed',
      'Bachelor of Business Administration': 'BBA',
      'Master of Science': 'MSc',
      'Master of Business Administration': 'MBA'
    };
    return abbrev[course] || course.split(' ').map(w => w[0]).join('');
  };

  const getCourseDistribution = () => {
    const courses = {};
    registeredUsers.forEach(user => {
      const abbrev = abbreviateCourse(user.course);
      courses[abbrev] = (courses[abbrev] || 0) + 1;
    });
    return courses;
  };

  const getYearDistribution = () => {
    const years = {};
    registeredUsers.forEach(user => {
      years[user.year] = (years[user.year] || 0) + 1;
    });
    return years;
  };

  const getPaymentRate = () => {
    if (registeredUsers.length === 0) return 0;
    const fullyPaid = registeredUsers.filter(user => {
      if (!user.monthlyPayments) return user.paid === true;
      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
      for (let i = 1; i <= 3; i++) {
        const payment = payments[`month${i}`];
        if (payment && payment.status === 'PAID') return true;
      }
      return false;
    }).length;
    return ((fullyPaid / registeredUsers.length) * 100).toFixed(1);
  };

  const getUncollectedFunds = () => {
    let total = 0;
    registeredUsers.forEach(user => {
      const totalPrice = user.lessonPackages && user.lessonPackages.length > 0 
        ? user.lessonPackages.reduce((sum, p) => sum + p.price, 0)
        : (user.lessonPackage ? user.lessonPackage.price : 0);
      
      if (!user.monthlyPayments) {
        total += (totalPrice * 3) - (user.amountPaid || 0);
      } else {
        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
        for (let i = 1; i <= 3; i++) {
          const payment = payments[`month${i}`];
          total += payment ? payment.balance : totalPrice;
        }
      }
    });
    return total;
  };

  React.useEffect(() => {
    const courses = getCourseDistribution();
    const years = getYearDistribution();

    if (chartRef1.current) {
      const ctx = chartRef1.current.getContext('2d');
      if (chartInstance1.current) chartInstance1.current.destroy();
      chartInstance1.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(courses),
          datasets: [{
            data: Object.values(courses),
            backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#06B6D4']
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (chartRef2.current) {
      const ctx = chartRef2.current.getContext('2d');
      if (chartInstance2.current) chartInstance2.current.destroy();
      chartInstance2.current = new ChartJS(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(years),
          datasets: [{
            data: Object.values(years),
            backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();
    };
  }, [registeredUsers, validUsers]);

  const getPaymentStats = () => {
    let paid = 0, partial = 0, unpaid = 0;
    registeredUsers.forEach(user => {
      if (!user.monthlyPayments) {
        if (user.paid) paid++;
        else unpaid++;
        return;
      }
      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
      let hasPaid = false, hasPartial = false;
      for (let i = 1; i <= 3; i++) {
        const p = payments[`month${i}`];
        if (p && p.status === 'PAID') hasPaid = true;
        if (p && p.status === 'PARTIAL') hasPartial = true;
      }
      if (hasPaid) paid++;
      else if (hasPartial) partial++;
      else unpaid++;
    });
    return { paid, partial, unpaid };
  };

  const paymentStats = getPaymentStats();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-trending-up text-3xl"></div>
            <span className="text-sm opacity-80">Rate</span>
          </div>
          <h3 className="text-3xl font-bold">{getPaymentRate()}%</h3>
          <p className="text-sm opacity-90 mt-1">Payment Rate</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-circle-alert text-3xl"></div>
            <span className="text-sm opacity-80">Unpaid</span>
          </div>
          <h3 className="text-2xl font-bold">TZS {getUncollectedFunds().toLocaleString()}</h3>
          <p className="text-sm opacity-90 mt-1">Uncollected Funds</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-sm font-bold mb-2 text-[var(--text-dark)]">Courses</h3>
          <div style={{ height: '140px' }}>
            <canvas ref={chartRef1}></canvas>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-sm font-bold mb-2 text-[var(--text-dark)]">Years</h3>
          <div style={{ height: '140px' }}>
            <canvas ref={chartRef2}></canvas>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-users text-3xl"></div>
            <span className="text-sm opacity-80">Active</span>
          </div>
          <h3 className="text-3xl font-bold">{registeredUsers.length}</h3>
          <p className="text-sm opacity-90 mt-1">Total Students</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <div className="icon-circle-check text-2xl text-green-600"></div>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{paymentStats.paid}</p>
            <p className="text-sm text-gray-600">Fully Paid</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <div className="icon-clock text-2xl text-yellow-600"></div>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{paymentStats.partial}</p>
            <p className="text-sm text-gray-600">Partially Paid</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <div className="icon-x-circle text-2xl text-red-600"></div>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{paymentStats.unpaid}</p>
            <p className="text-sm text-gray-600">Unpaid</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SignupStep1({ formData, setFormData, universities, courses, onNext, loading }) {
  try {
    const [showUniversityPopup, setShowUniversityPopup] = React.useState(false);
    const [errors, setErrors] = React.useState({});

    const handleUniversityChange = (e) => {
      const selected = e.target.value;
      if (selected && selected !== 'University of Dodoma') {
        setShowUniversityPopup(true);
        setFormData({ ...formData, university: '' });
      } else {
        setFormData({ ...formData, university: selected });
      }
    };

    const handleYearChange = (e) => {
      // changing the year clears any package chosen for the previous year
      setFormData({ ...formData, yearOfStudy: e.target.value, lessonPackages: [] });
    };

    const handleNext = () => {
      const newErrors = {};
      const nameParts = formData.fullName.trim().split(/\s+/);
      
      if (!formData.fullName) {
        newErrors.fullName = 'Full Name is required';
      } else if (nameParts.length !== 3) {
        newErrors.fullName = 'Full Name must contain exactly three names';
      }
      
      if (!formData.university) {
        newErrors.university = 'University is required';
      }
      
      if (!formData.yearOfStudy) {
        newErrors.yearOfStudy = 'Year of Study is required';
      }
      
      if (!formData.course) {
        newErrors.course = 'Course is required';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      setErrors({});
      onNext();
    };

    return (
      <div className="space-y-4">
        <div>
          <FullNameField
            value={formData.fullName}
            onChange={(val) => {
              setFormData({ ...formData, fullName: val });
              if (errors.fullName) setErrors({ ...errors, fullName: '' });
            }}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">University</label>
          <div className="relative">
            <div className="icon-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none"></div>
          <select
            value={formData.university}
            onChange={(e) => {
              handleUniversityChange(e);
              if (errors.university) setErrors({ ...errors, university: '' });
            }}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${errors.university ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm`}
          >
            <option value="">Select University</option>
            {universities.map(uni => (
              <option key={uni} value={uni}>{uni}</option>
            ))}
          </select>
          </div>
          {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Year of Study</label>
          <div className="relative">
            <div className="icon-calendar absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none"></div>
          <select
            value={formData.yearOfStudy}
            onChange={(e) => {
              handleYearChange(e);
              if (errors.yearOfStudy) setErrors({ ...errors, yearOfStudy: '' });
            }}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${errors.yearOfStudy ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm`}
          >
            <option value="">Select Year</option>
            <option value="FIRST YEAR">FIRST YEAR</option>
            <option value="SECOND YEAR">SECOND YEAR</option>
            <option value="THIRD YEAR">THIRD YEAR</option>
          </select>
          </div>
          {errors.yearOfStudy && <p className="text-red-500 text-xs mt-1">{errors.yearOfStudy}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Course</label>
          <div className="relative">
            <div className="icon-book-open absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none"></div>
          <select
            value={formData.course}
            onChange={(e) => {
              setFormData({ ...formData, course: e.target.value });
              if (errors.course) setErrors({ ...errors, course: '' });
            }}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${errors.course ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm`}
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          </div>
          {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course}</p>}
        </div>

        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full mt-6 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          NEXT
        </button>

        {showUniversityPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUniversityPopup(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-bold mb-2">Oops!</h3>
              <p className="text-sm text-gray-600 mb-6">Our services are not yet opened in your University. Stay tuned and we will update you soon.</p>
              <button onClick={() => setShowUniversityPopup(false)} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">
                OK
              </button>
            </div>
          </div>
        )}

      </div>
    );
  } catch (error) {
    console.error('SignupStep1 error:', error);
    return null;
  }
}
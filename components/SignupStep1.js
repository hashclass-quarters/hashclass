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
          <CustomSelect
            icon="icon-landmark"
            value={formData.university}
            placeholder="Select University"
            error={!!errors.university}
            options={universities.map(u => ({ value: u, label: u }))}
            onChange={(val) => {
              handleUniversityChange({ target: { value: val } });
              if (errors.university) setErrors({ ...errors, university: '' });
            }}
          />
          {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Year of Study</label>
          <CustomSelect
            icon="icon-calendar"
            value={formData.yearOfStudy}
            placeholder="Select Year"
            error={!!errors.yearOfStudy}
            options={['FIRST YEAR', 'SECOND YEAR', 'THIRD YEAR'].map(y => ({ value: y, label: y }))}
            onChange={(val) => {
              handleYearChange({ target: { value: val } });
              if (errors.yearOfStudy) setErrors({ ...errors, yearOfStudy: '' });
            }}
          />
          {errors.yearOfStudy && <p className="text-red-500 text-xs mt-1">{errors.yearOfStudy}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Course</label>
          <CustomSelect
            icon="icon-book-open"
            value={formData.course}
            placeholder="Select Course"
            error={!!errors.course}
            options={courses.map(c => ({ value: c, label: c }))}
            onChange={(val) => {
              setFormData({ ...formData, course: val });
              if (errors.course) setErrors({ ...errors, course: '' });
            }}
          />
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
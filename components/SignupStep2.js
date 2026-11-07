function SignupStep2({ formData, setFormData, onBack, onNext, loading }) {
  try {
    const [showDuplicatePopup, setShowDuplicatePopup] = React.useState(false);
    const [checking, setChecking] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [showCropper, setShowCropper] = React.useState(false);

    const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          e.target.value = '';
          return;
        }
        setSelectedFile(file);
        setShowCropper(true);
      }
    };

    const handleCropConfirm = (blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePic: reader.result });
        setShowCropper(false);
        setSelectedFile(null);
        if (errors.profilePic) setErrors({ ...errors, profilePic: '' });
      };
      reader.readAsDataURL(blob);
    };

    const handleCropCancel = () => {
      setShowCropper(false);
      setSelectedFile(null);
      document.querySelector('input[type="file"]').value = '';
    };

    const handleNext = async () => {
      const newErrors = {};
      
      if (!formData.regNumber) {
        newErrors.regNumber = 'Registration Number is required';
      } else {
        try {
          if (await appRegExists(formData.regNumber)) {
            newErrors.regNumber = 'This registration number is already registered';
          }
        } catch (error) {
          console.error('Error checking registration number:', error);
        }
      }
      
      if (!formData.email) {
        newErrors.email = 'Email is required';
      }
      
      if (!formData.phone || formData.phone === '+255 ') {
        newErrors.phone = 'Phone Number is required';
      }
      
      if (!formData.profilePic) {
        newErrors.profilePic = 'Profile Photo is required';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      setChecking(true);
      try {
        const alreadyRegistered = await appRegExists(formData.regNumber);
        if (alreadyRegistered) {
          setShowDuplicatePopup(true);
          setChecking(false);
          return;
        }
        setChecking(false);
        onNext();
      } catch (error) {
        console.error('Error checking registration:', error);
        setChecking(false);
        onNext();
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <RegistrationField
            value={formData.regNumber}
            onChange={(val) => {
              setFormData({ ...formData, regNumber: val });
              if (errors.regNumber) setErrors({ ...errors, regNumber: '' });
            }}
            label="Registration Number"
            error={errors.regNumber}
          />
          {errors.regNumber && <p className="text-red-500 text-xs mt-1">{errors.regNumber}</p>}
        </div>

        <div>
          <SignupEmailField
            value={formData.email}
            onChange={(val) => {
              setFormData({ ...formData, email: val });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            error={errors.email}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <SignupPhoneField
            value={formData.phone}
            onChange={(val) => {
              setFormData({ ...formData, phone: val });
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
            error={errors.phone}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Profile Photo</label>
          <div className="flex items-center gap-3">
            {formData.profilePic && (
              <img src={formData.profilePic} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[var(--primary-color)] flex-shrink-0" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className={`flex-1 px-3 py-2 rounded-lg border-2 ${errors.profilePic ? 'border-red-500' : 'border-gray-200'} text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[var(--primary-color)] file:text-white file:cursor-pointer hover:file:bg-[var(--accent-color)]`}
            />
          </div>
          {errors.profilePic && <p className="text-red-500 text-xs mt-1">{errors.profilePic}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onBack}
            disabled={loading || checking}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            BACK
          </button>
          <button
            onClick={handleNext}
            disabled={loading || checking}
            className="flex-1 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {checking ? 'CHECKING...' : 'NEXT'}
          </button>
        </div>

        {showCropper && selectedFile && (
          <ProfilePhotoCropper
            imageFile={selectedFile}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        )}

        {showDuplicatePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDuplicatePopup(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Already Registered</h3>
              <p className="text-sm text-gray-600 mb-6">This registration number is already registered.</p>
              <button 
                onClick={() => window.location.href = 'index.html'} 
                className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg font-semibold"
              >
                SIGN IN
              </button>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('SignupStep2 error:', error);
    return null;
  }
}
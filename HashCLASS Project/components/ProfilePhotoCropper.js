function ProfilePhotoCropper({ imageFile, onConfirm, onCancel }) {
  const [cropper, setCropper] = React.useState(null);
  const imageRef = React.useRef(null);

  React.useEffect(() => {
    if (imageRef.current && imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageRef.current.src = e.target.result;
        const cropperInstance = new Cropper(imageRef.current, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          cropBoxMovable: true,
          cropBoxResizable: true,
          guides: true,
          center: true,
          highlight: true,
          background: true,
          autoCropArea: 0.65,
          minCropBoxWidth: 200,
          minCropBoxHeight: 200
        });
        
        // Apply circular mask overlay
        setTimeout(() => {
          const cropBox = cropperInstance.cropBox;
          const face = cropBox.querySelector('.cropper-face');
          if (cropBox && face) {
            cropBox.style.borderRadius = '50%';
            cropBox.style.overflow = 'hidden';
            face.style.borderRadius = '50%';
            
            // Add circular border
            const viewBox = cropBox.querySelector('.cropper-view-box');
            if (viewBox) {
              viewBox.style.borderRadius = '50%';
              viewBox.style.outline = '3px solid var(--primary-color)';
              viewBox.style.outlineOffset = '-3px';
            }
          }
        }, 100);
        setCropper(cropperInstance);
      };
      reader.readAsDataURL(imageFile);
    }

    return () => {
      if (cropper) {
        cropper.destroy();
      }
    };
  }, [imageFile]);

  const handleConfirm = () => {
    if (cropper) {
      const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
      const circularCanvas = document.createElement('canvas');
      const ctx = circularCanvas.getContext('2d');
      circularCanvas.width = 300;
      circularCanvas.height = 300;
      
      ctx.beginPath();
      ctx.arc(150, 150, 150, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0, 300, 300);
      
      circularCanvas.toBlob((blob) => {
        onConfirm(blob);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-xl font-semibold mb-4 text-[var(--text-dark)]">Adjust Your Profile Photo</h3>
        <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
          <img ref={imageRef} style={{ maxWidth: '100%', display: 'block' }} />
        </div>
        <p className="text-sm text-[var(--text-light)] mb-4">Drag and zoom to reposition your profile photo inside the circle</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
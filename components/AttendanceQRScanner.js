function AttendanceQRScanner({ onScan }) {
  try {
    const [scanning, setScanning] = React.useState(true);
    const [scannedData, setScannedData] = React.useState(null);
    const [alreadyRecorded, setAlreadyRecorded] = React.useState(false);
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const scanIntervalRef = React.useRef(null);

    React.useEffect(() => {
      if (scanning) {
        startCamera();
      } else {
        stopCamera();
      }
      return () => stopCamera();
    }, [scanning]);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 640 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanIntervalRef.current = setInterval(scanQRCode, 300);
        }
      } catch (error) {
        console.error('Camera error:', error);
        alert('Unable to access camera');
      }
    };

    const stopCamera = () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3);
        data[i + 1] = Math.min(255, data[i + 1] * 1.3);
        data[i + 2] = Math.min(255, data[i + 2] * 1.3);
      }
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });
      
      if (code) {
        try {
          const userData = JSON.parse(code.data);
          setScannedData(userData);
          setScanning(false);
          checkAttendanceStatus(userData);
        } catch (error) {
          console.error('Invalid QR code data');
        }
      }
    };

    const checkAttendanceStatus = async (userData) => {
      const today = getTanzaniaDate();
      const records = await getAttendanceForDate(today);
      const hasRecord = records.some(r => r.userId === userData.regNumber && r.isPresent);
      setAlreadyRecorded(hasRecord);
    };

    const handleRecord = async () => {
      if (scannedData && !alreadyRecorded) {
        await onScan(scannedData);
        setScannedData(null);
        setAlreadyRecorded(false);
        setScanning(true);
      }
    };

    return (
      <div>
        {scanning && (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square">
              <video ref={videoRef} className="w-full h-full rounded-lg object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4/5 h-4/5 border-4 border-[var(--primary-color)] rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--primary-color)] animate-scan"></div>
                </div>
              </div>
              <style>{`
                @keyframes scan {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(calc(100% * 0.8 - 4px)); }
                }
                .animate-scan {
                  animation: scan 2s linear infinite;
                }
              `}</style>
            </div>
            <button 
              onClick={() => setScanning(false)} 
              className="mt-4 w-full max-w-sm bg-red-600 text-white py-3 rounded-lg font-semibold"
            >
              CANCEL
            </button>
          </div>
        )}
        
        {scannedData && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold mb-2">Scanned User</h4>
            <p className="text-sm"><strong>Name:</strong> {scannedData.name}</p>
            <p className="text-sm"><strong>Reg No:</strong> {scannedData.regNumber}</p>
            <p className="text-sm"><strong>Course:</strong> {scannedData.course}</p>
            {alreadyRecorded && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 text-center font-semibold">
                  Attendance already recorded for today
                </p>
              </div>
            )}
            <button 
              onClick={handleRecord} 
              disabled={alreadyRecorded}
              className={`w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${
                alreadyRecorded 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {alreadyRecorded ? 'ALREADY RECORDED' : 'RECORD ATTENDANCE'}
            </button>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('AttendanceQRScanner error:', error);
    return null;
  }
}
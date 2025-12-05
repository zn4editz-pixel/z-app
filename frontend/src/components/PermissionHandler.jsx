import { useEffect, useState } from "react";
import { Camera, Mic, AlertCircle, Settings } from "lucide-react";
import toast from "react-hot-toast";

const PermissionHandler = () => {
  const [permissions, setPermissions] = useState({
    camera: null,
    microphone: null,
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cameraPermission = null;
    let micPermission = null;
    let cameraHandler = null;
    let micHandler = null;

    const checkPermissions = async () => {
      try {
        // Check if running in browser that supports permissions API
        if (!navigator.permissions) {
          console.log("Permissions API not supported");
          return;
        }

        // Check camera permission
        try {
          cameraPermission = await navigator.permissions.query({ name: 'camera' });
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
          
          cameraHandler = () => {
            setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
          };
          cameraPermission.addEventListener('change', cameraHandler);
        } catch (err) {
          console.log("Camera permission check not supported:", err);
        }

        // Check microphone permission
        try {
          micPermission = await navigator.permissions.query({ name: 'microphone' });
          setPermissions(prev => ({ ...prev, microphone: micPermission.state }));
          
          micHandler = () => {
            setPermissions(prev => ({ ...prev, microphone: micPermission.state }));
          };
          micPermission.addEventListener('change', micHandler);
        } catch (err) {
          console.log("Microphone permission check not supported:", err);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    };

    checkPermissions();

    // Cleanup function
    return () => {
      if (cameraPermission && cameraHandler) {
        cameraPermission.removeEventListener('change', cameraHandler);
      }
      if (micPermission && micHandler) {
        micPermission.removeEventListener('change', micHandler);
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      // Check if running in browser that supports permissions API
      if (!navigator.permissions) {
        console.log("Permissions API not supported");
        return;
      }

      // Check camera permission
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
      } catch (err) {
        console.log("Camera permission check not supported:", err);
      }

      // Check microphone permission
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        setPermissions(prev => ({ ...prev, microphone: micPermission.state }));
      } catch (err) {
        console.log("Microphone permission check not supported:", err);
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const openAppSettings = () => {
    toast.success("Opening Settings...", { duration: 2000 });
    
    // Try multiple methods to open settings
    try {
      // Method 1: Try Android intent URL
      const packageName = 'com.zapp.app'; // Your app package name
      const intentUrl = `intent://settings/app_detail?package=${packageName}#Intent;scheme=android-app;end`;
      window.location.href = intentUrl;
      
      // Fallback after 1 second
      setTimeout(() => {
        // Method 2: Try app-settings protocol
        window.location.href = 'app-settings:';
      }, 1000);
      
      // Show instructions as fallback
      setTimeout(() => {
        toast("If settings didn't open, go to: Settings > Apps > Z-APP > Permissions", { 
          duration: 6000,
          icon: "⚙️"
        });
      }, 2000);
    } catch (error) {
      console.log("Could not auto-open settings:", error);
      toast("Please go to: Settings > Apps > Z-APP > Permissions", { 
        duration: 6000,
        icon: "⚙️"
      });
    }
  };

  const requestPermissions = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop the stream immediately - we just needed to trigger permission
      stream.getTracks().forEach(track => track.stop());

      toast.success("Permissions granted!");
      setShowModal(false);
      checkPermissions();
    } catch (error) {
      console.error("Permission denied:", error);
      
      if (error.name === 'NotAllowedError') {
        // Show instructions
        toast.error("Please enable permissions manually", { duration: 4000 });
        toast("Go to: Settings > Apps > Z-APP > Permissions > Enable Camera & Microphone", { 
          duration: 8000,
          icon: "⚙️",
          style: {
            maxWidth: '90vw',
            fontSize: '14px'
          }
        });
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera or microphone found on this device");
      } else {
        toast.error("Failed to get permissions: " + error.message);
      }
    }
  };

  const requestCameraOnly = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      toast.success("Camera access granted!");
      checkPermissions();
    } catch (error) {
      console.error("Camera permission denied:", error);
      toast.error("Camera access denied");
    }
  };

  const requestMicrophoneOnly = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      toast.success("Microphone access granted!");
      checkPermissions();
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast.error("Microphone access denied");
    }
  };

  // Show modal immediately for mobile users
  useEffect(() => {
    // Check if running on mobile (Capacitor)
    const isMobile = window.Capacitor !== undefined;
    
    // For mobile, always show on first load
    if (isMobile && !sessionStorage.getItem('permissionsChecked')) {
      const timer = setTimeout(() => {
        setShowModal(true);
        sessionStorage.setItem('permissionsChecked', 'true');
      }, 1000); // Show after 1 second
      
      return () => clearTimeout(timer);
    }
    
    // For web, check permissions
    const needsPermission = 
      permissions.camera === 'prompt' || 
      permissions.microphone === 'prompt' ||
      permissions.camera === 'denied' ||
      permissions.microphone === 'denied';
    
    if (needsPermission && !isMobile && !sessionStorage.getItem('permissionsChecked')) {
      const timer = setTimeout(() => {
        setShowModal(true);
        sessionStorage.setItem('permissionsChecked', 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [permissions]);

  if (!showModal) return null;

  const allGranted = permissions.camera === 'granted' && permissions.microphone === 'granted';
  const anyDenied = permissions.camera === 'denied' || permissions.microphone === 'denied';

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box max-w-md shadow-xl border border-base-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-xl mb-1">Permissions Required</h3>
          <p className="text-sm text-base-content/60">Enable camera and microphone for calls</p>
        </div>

        {/* Permission Cards */}
        <div className="space-y-3 mb-6">
          {/* Camera Permission */}
          <div className={`flex items-center gap-3 p-3 bg-base-100 rounded-lg border-2 transition-all ${
            permissions.camera === 'granted' ? 'border-success' : 
            permissions.camera === 'denied' ? 'border-error' : 
            'border-base-300'
          }`}>
            <Camera className={`w-5 h-5 flex-shrink-0 ${
              permissions.camera === 'granted' ? 'text-success' : 
              permissions.camera === 'denied' ? 'text-error' : 
              'text-base-content/60'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Camera</p>
              <p className="text-xs text-base-content/50">Video calls</p>
            </div>
            <span className={`text-xs font-semibold ${
              permissions.camera === 'granted' ? 'text-success' : 
              permissions.camera === 'denied' ? 'text-error' : 
              'text-base-content/40'
            }`}>
              {permissions.camera === 'granted' ? 'Allowed' : 
               permissions.camera === 'denied' ? 'Denied' : 
               'Not set'}
            </span>
          </div>

          {/* Microphone Permission */}
          <div className={`flex items-center gap-3 p-3 bg-base-100 rounded-lg border-2 transition-all ${
            permissions.microphone === 'granted' ? 'border-success' : 
            permissions.microphone === 'denied' ? 'border-error' : 
            'border-base-300'
          }`}>
            <Mic className={`w-5 h-5 flex-shrink-0 ${
              permissions.microphone === 'granted' ? 'text-success' : 
              permissions.microphone === 'denied' ? 'text-error' : 
              'text-base-content/60'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Microphone</p>
              <p className="text-xs text-base-content/50">Voice calls</p>
            </div>
            <span className={`text-xs font-semibold ${
              permissions.microphone === 'granted' ? 'text-success' : 
              permissions.microphone === 'denied' ? 'text-error' : 
              'text-base-content/40'
            }`}>
              {permissions.microphone === 'granted' ? 'Allowed' : 
               permissions.microphone === 'denied' ? 'Denied' : 
               'Not set'}
            </span>
          </div>
        </div>

        {/* Info Message */}
        {anyDenied && (
          <div className="bg-base-100 border-2 border-warning rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-base-content/70">
              Permissions denied. Please open settings to enable them manually.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!allGranted && !anyDenied && (
            <button 
              className="btn btn-primary w-full"
              onClick={requestPermissions}
            >
              Allow Permissions
            </button>
          )}
          
          {anyDenied && (
            <button 
              className="btn btn-warning w-full gap-2"
              onClick={openAppSettings}
            >
              <Settings className="w-4 h-4" />
              Open Settings
            </button>
          )}
          
          {!allGranted && !anyDenied && (
            <div className="grid grid-cols-2 gap-2">
              {permissions.camera !== 'granted' && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={requestCameraOnly}
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </button>
              )}
              {permissions.microphone !== 'granted' && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={requestMicrophoneOnly}
                >
                  <Mic className="w-4 h-4" />
                  Microphone
                </button>
              )}
            </div>
          )}
          
          <button 
            className="btn btn-ghost btn-sm w-full"
            onClick={() => setShowModal(false)}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionHandler;

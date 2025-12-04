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

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box max-w-md shadow-2xl border border-base-300 animate-scaleIn">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 animate-bounce-slow">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-1">Allow Permissions</h3>
          <p className="text-sm text-base-content/70">To use all features of Z-APP</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-base-200 to-base-300 rounded-xl border border-base-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Camera Access</p>
              <p className="text-xs text-base-content/60">For video calls and media</p>
            </div>
            <div className={`badge badge-lg ${
              permissions.camera === 'granted' ? 'badge-success' : 
              permissions.camera === 'denied' ? 'badge-error' : 
              'badge-warning'
            }`}>
              {permissions.camera === 'granted' ? '✓' : 
               permissions.camera === 'denied' ? '✗' : 
               '!'}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-base-200 to-base-300 rounded-xl border border-base-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Microphone Access</p>
              <p className="text-xs text-base-content/60">For voice calls and messages</p>
            </div>
            <div className={`badge badge-lg ${
              permissions.microphone === 'granted' ? 'badge-success' : 
              permissions.microphone === 'denied' ? 'badge-error' : 
              'badge-warning'
            }`}>
              {permissions.microphone === 'granted' ? '✓' : 
               permissions.microphone === 'denied' ? '✗' : 
               '!'}
            </div>
          </div>
        </div>

        <div className="alert alert-info mb-6 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            {permissions.camera === 'denied' || permissions.microphone === 'denied' 
              ? "⚠️ Permissions denied. Open settings to enable."
              : "📱 Required for calls and media features"}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {(permissions.camera !== 'granted' || permissions.microphone !== 'granted') && (
            <button 
              className="btn btn-primary btn-lg w-full gap-2 shadow-lg hover:shadow-xl transition-all"
              onClick={requestPermissions}
            >
              <Camera className="w-5 h-5" />
              <Mic className="w-5 h-5" />
              Allow Camera & Microphone
            </button>
          )}
          
          {/* Show settings button if permissions denied */}
          {(permissions.camera === 'denied' || permissions.microphone === 'denied') && (
            <button 
              className="btn btn-warning btn-lg w-full gap-2 shadow-lg hover:shadow-xl transition-all"
              onClick={openAppSettings}
            >
              <Settings className="w-5 h-5" />
              Open App Settings
            </button>
          )}
          
          <div className="flex gap-2">
            {permissions.camera !== 'granted' && permissions.camera !== 'denied' && (
              <button 
                className="btn btn-outline flex-1 gap-2"
                onClick={requestCameraOnly}
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>
            )}
            
            {permissions.microphone !== 'granted' && permissions.microphone !== 'denied' && (
              <button 
                className="btn btn-outline flex-1 gap-2"
                onClick={requestMicrophoneOnly}
              >
                <Mic className="w-4 h-4" />
                Microphone
              </button>
            )}
          </div>
          
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setShowModal(false)}
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionHandler;

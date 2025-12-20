
import { useState, useEffect } from 'react';

// MANUAL OVERRIDE FOR TESTING IOS LAYOUT
const FORCE_IOS_TEST = false; 

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Force iOS mode for debugging if constant is true
      if (FORCE_IOS_TEST) {
          setIsMobile(true); 
          setIsIOS(true);
          return;
      }

      const userAgent = window.navigator.userAgent.toLowerCase();
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Strict check: It's mobile if it has touch AND (it identifies as mobile UA OR it's a small screen)
      // This prevents touchscreen laptops from being detected as mobile phones
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // iPadOS 13+ requests desktop site by default (Macintosh UA), but has touch points. 
      const isIPad = userAgent.includes('mac') && hasTouch && navigator.maxTouchPoints > 1; 
      
      // Heuristic for smaller touch devices that might not send mobile UA
      const isSmallScreen = window.innerWidth <= 1024;

      const shouldShowMobileControls = hasTouch && (isMobileUA || isIPad || isSmallScreen);

      setIsMobile(shouldShowMobileControls);

      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice || isIPad);
    };

    checkDevice();
    
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isIOS };
};

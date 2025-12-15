
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
          setIsMobile(true); // iOS implies mobile context usually
          setIsIOS(true);
          return;
      }

      const userAgent = window.navigator.userAgent.toLowerCase();
      
      // Check for Touch
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(hasTouch);

      // Check for iOS (iPhone, iPod, iPad)
      // Note: iPad on iOS 13+ often reports as Macintosh, so we check for Mac + Touch
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isMacWithTouch = userAgent.includes('mac') && navigator.maxTouchPoints > 0;
      
      setIsIOS(isIosDevice || isMacWithTouch);
    };

    checkDevice();
    
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isIOS };
};

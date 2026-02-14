function getBrowserName(ua) {
  if (ua.includes("Firefox/")) {
    const match = ua.match(/Firefox\/(\d+)/);
    return `Firefox ${match ? match[1] : ""}`.trim();
  }
  if (ua.includes("Edg/")) {
    const match = ua.match(/Edg\/(\d+)/);
    return `Edge ${match ? match[1] : ""}`.trim();
  }
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    const match = ua.match(/Chrome\/(\d+)/);
    return `Chrome ${match ? match[1] : ""}`.trim();
  }
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    const match = ua.match(/Version\/(\d+)/);
    return `Safari ${match ? match[1] : ""}`.trim();
  }
  return "Unknown";
}

export function getSessionMetadata() {
  const ua = navigator.userAgent;
  return {
    browser: getBrowserName(ua),
    platform: navigator.platform,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    pixelRatio: window.devicePixelRatio,
    isMobile: /Mobi|Android/i.test(ua),
  };
}

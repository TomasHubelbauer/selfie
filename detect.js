export default function detect() {
  if (navigator.userAgent.indexOf("Chrome") != -1) {
    return 'chrome';
  }

  if (navigator.userAgent.indexOf("Safari") != -1) {
    return 'safari';
  }

  if (navigator.userAgent.indexOf("Firefox") != -1) {
    return 'firefox';
  }

  return other;
}

import { detect } from 'detect-browser';

const ENGAGEMENT_DEPENDENCIES = [
  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js',
    integrity: 'sha384-uI1PW0SEa/QzAUuRQ6Bz5teBONsa9D0ZbVxMcM8mu4IjJ5msHyM7RRtZtL8LnSf3',
    crossOrigin: 'anonymous',
  },

  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@2.7.0/dist/tf-core.min.js',
    integrity: 'sha384-DlI/SVdTGUBY5hi4h0p+nmC6V8i0FW5Nya/gYElz0L68HrSiXsBh+rqWcoZx3SXY',
    crossOrigin: 'anonymous',
  },

  {
    src:
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@2.7.0/dist/tf-backend-webgl.min.js',
    integrity: 'sha384-21TV9Kpzn8SF68G1U6nYN3qPZnb97F06JuW4v0FDDBzW+CUwv8GcKMR+BjnE7Vmm',
    crossOrigin: 'anonymous',
  },

  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface',
    integrity: 'sha384-pmFVRqTsqHmtuLJVyzlEVoLnr2CAevVBYX7slpnjib4g66wM8zJV8i/0EL6U2PIk',
    crossOrigin: 'anonymous',
  }

];


export async function loadEngagementFilters(timeoutMs: number): Promise<void> {
  // the tf library loading order must be followed
  for (const { src, integrity, crossOrigin } of ENGAGEMENT_DEPENDENCIES) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        reject(new Error(`Loading script ${src} takes longer than ${timeoutMs}`));
      }, timeoutMs);
      script.onload = function(_ev) {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = function(_ev) {
        clearTimeout(timer);
        reject(new Error(`Failed to load ${src}`));
      };
      script.integrity = integrity;
      script.crossOrigin = crossOrigin;
      script.src = src;
      document.body.appendChild(script);
    });
  }
}

export function platformCanSupportEngagementWithoutDegradation(): boolean {
  const browser = detect();
  return browser.name === 'chrome' && /(android)/i.test(navigator.userAgent) === false;
}

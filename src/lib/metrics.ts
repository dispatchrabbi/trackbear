import Plausible from 'plausible-tracker';
import ENV from '../env.ts';

let plausible: ReturnType<typeof Plausible>;

export function initPlausible() {
  if(ENV.ENABLE_METRICS) {
    plausible = Plausible({
      domain: ENV.PLAUSIBLE_DOMAIN,
      trackLocalhost: !import.meta.env.PROD,
      apiHost: ENV.PLAUSIBLE_HOST,
    });
  
    plausible.enableAutoPageviews();
  } else {
    plausible = {
      trackEvent: () => {},
      trackPageview: () => {},
    } as unknown as ReturnType<typeof Plausible>;
  }
}

export default plausible;
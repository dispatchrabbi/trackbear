import Plausible from 'plausible-tracker';

let plausible: ReturnType<typeof Plausible>;

export function initPlausible(enable: boolean, apiHost: string, domain: string) {
  if(enable) {
    plausible = Plausible({
      domain,
      apiHost,
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
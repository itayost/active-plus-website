import { FUNNEL_STEPS } from "./contract.generated";
import { STAMP, STEP, TTL } from "./storage";

/**
 * Inline script for /questionnaire, run while the HTML is still parsing.
 *
 * The server renders welcome2 (first visits get their content and LCP image
 * from HTML). A returning visitor with a saved step would otherwise see
 * welcome2, hear its heading and could press "בואו נתחיל" (which wipes the
 * session) until hydration restores their step. This flags <html> with
 * data-funnel-resume so CSS hides welcome2 while keeping its height; Funnel
 * clears the flag once the restore has rendered. Static text only: no
 * stored value is ever written into the page.
 */
export const RESUME_SCRIPT =
  `try{var s=localStorage.getItem(${JSON.stringify(STEP)}),` +
  `t=Number(localStorage.getItem(${JSON.stringify(STAMP)})||0);` +
  `if(s&&s!=="welcome2"&&${JSON.stringify(FUNNEL_STEPS)}.indexOf(s)>-1&&!(t&&Date.now()-t>${TTL}))` +
  `document.documentElement.dataset.funnelResume=""}catch(e){}`;

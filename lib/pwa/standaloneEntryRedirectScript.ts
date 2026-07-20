import { PWA_APP_ENTRY } from "@/lib/marketing/pwaEntryRedirect";
import {
  STANDALONE_ENTRY_REDIRECT_EXEMPT_PREFIXES,
} from "@/lib/pwa/standaloneEntryRedirect";

/** Redirect legacy / marketing URLs to the PWA entry when launched standalone. */
export const INLINE_STANDALONE_ENTRY_REDIRECT_SCRIPT = `(function(){try{var standalone=window.matchMedia("(display-mode: standalone)").matches||(window.navigator&&window.navigator.standalone===true);if(!standalone)return;var p=location.pathname;if(p.indexOf("${PWA_APP_ENTRY}")===0)return;var exempt=${JSON.stringify([...STANDALONE_ENTRY_REDIRECT_EXEMPT_PREFIXES])};for(var i=0;i<exempt.length;i++){var x=exempt[i];if(p===x||p.indexOf(x+"/")===0)return;}location.replace("${PWA_APP_ENTRY}");}catch(e){}})();`;

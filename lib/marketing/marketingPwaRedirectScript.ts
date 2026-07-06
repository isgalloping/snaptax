import {
  MARKETING_PWA_REDIRECT_EXEMPT_PREFIXES,
  PWA_APP_ENTRY,
} from "@/lib/marketing/pwaEntryRedirect";
import { PWA_INSTALLED_KEY } from "@/lib/pwa/installedDetect";

/** Early redirect before React paint when sticky install flag is set. */
export const INLINE_MARKETING_PWA_REDIRECT_SCRIPT = `(function(){try{var p=location.pathname;if(p.indexOf("${PWA_APP_ENTRY}")===0)return;var exempt=${JSON.stringify([...MARKETING_PWA_REDIRECT_EXEMPT_PREFIXES])};for(var i=0;i<exempt.length;i++){var x=exempt[i];if(p===x||p.indexOf(x+"/")===0)return;}if(localStorage.getItem("${PWA_INSTALLED_KEY}")==="1"){location.replace("${PWA_APP_ENTRY}");}}catch(e){}})();`;

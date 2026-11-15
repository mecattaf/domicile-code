// Stage this beside a copied real bundle renamed to actual.js. Both modules
// share the shell realm, so the fault occurs before the real mount allocates
// its root, without adding a production test switch.
import { Shell as actualShell } from './actual.js';

export const Shell = (root, domicile) => {
  window.domicileCodeFaultProbe = { installed: true, hit: false };
  const original = document.createElement.bind(document);
  document.createElement = (tag, options) => {
    if (tag === 'main') {
      window.domicileCodeFaultProbe.hit = true;
      throw new Error('DC_INTENTIONAL_NATIVE_STARTUP_FAILURE');
    }
    return original(tag, options);
  };
  actualShell(root, domicile);
};

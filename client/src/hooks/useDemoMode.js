import { useSyncExternalStore } from 'react';

import { isDemoActive, subscribeDemo } from '../services/demo/index.js';

/**
 * True once any request has fallen back to fixtures.
 *
 * useSyncExternalStore rather than a context: the flag is flipped from inside an
 * Axios interceptor, which is outside React's tree, and this is the API built for
 * exactly that case.
 */
export const useDemoMode = () => useSyncExternalStore(subscribeDemo, isDemoActive, () => false);

export default useDemoMode;

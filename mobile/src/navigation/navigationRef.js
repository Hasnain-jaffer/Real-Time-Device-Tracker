// mobile/src/navigation/navigationRef.js
import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Tabs live inside "MainTabs", so they must be reached through it.
// Pop any screens stacked above MainTabs first, so we switch to the
// existing tab instead of pushing a duplicate MainTabs.
export function goToTab(screen, params) {
  if (!navigationRef.isReady()) return;
  const root = navigationRef.getRootState();
  if (root && root.index > 0) {
    navigationRef.dispatch(StackActions.popToTop());
  }
  navigationRef.navigate('MainTabs', { screen, params });
}

export function goToScreen(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}

export function openLiveMap(busId) {
  goToTab('Live Map', { busId });
}
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Tabs live inside "MainTabs", so they must be reached through it
export function goToTab(screen, params) {
  if (navigationRef.isReady()) navigationRef.navigate('MainTabs', { screen, params });
}

export function goToScreen(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}

export function openLiveMap(busId) {
  goToTab('Live Map', { busId });
}
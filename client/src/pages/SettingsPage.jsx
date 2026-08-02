// client/src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useTheme } from '../app/ThemeContext';

export default function SettingsPage() {
  const { theme, setExplicitTheme } = useTheme();
  const [units, setUnits] = useState(localStorage.getItem('units') || 'metric');
  const [mapStyle, setMapStyle] = useState(localStorage.getItem('mapStyle') || 'street');

  function handleUnitsChange(value) {
    setUnits(value);
    localStorage.setItem('units', value);
  }

  function handleMapStyleChange(value) {
    setMapStyle(value);
    localStorage.setItem('mapStyle', value);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="glass rounded-2xl shadow-soft p-6 space-y-4">
        <h2 className="font-medium">Appearance</h2>
        <div className="flex gap-2">
          {['light', 'dark', 'system'].map((option) => (
            <button
              key={option}
              onClick={() => {
                if (option === 'system') {
                  localStorage.removeItem('theme-explicit');
                  window.location.reload();
                } else {
                  setExplicitTheme(option);
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                theme === option
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl shadow-soft p-6 space-y-4">
        <h2 className="font-medium">Units</h2>
        <div className="flex gap-2">
          {['metric', 'imperial'].map((option) => (
            <button
              key={option}
              onClick={() => handleUnitsChange(option)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                units === option
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Applies to distance figures on the Device History page.
        </p>
      </div>

      <div className="glass rounded-2xl shadow-soft p-6 space-y-4">
        <h2 className="font-medium">Default Map Style</h2>
        <div className="flex gap-2 flex-wrap">
          {['street', 'satellite', 'dark'].map((option) => (
            <button
              key={option}
              onClick={() => handleMapStyleChange(option)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition capitalize ${
                mapStyle === option
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Satellite/Dark tile layers will be wired into the Live Tracking map in a future batch.
        </p>
      </div>
    </div>
  );
}
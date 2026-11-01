import { useContext } from 'react';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';

export function useTracker(): TrackerContextValue {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
}

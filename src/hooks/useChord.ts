/**
 * T068: useChord Hook.
 *
 * Subscribes to ChordService and exposes current chord state.
 */

import {useState, useEffect} from 'react';
import {getChordService, type ChordResult} from '../services/ChordService';

const EMPTY_RESULT: ChordResult = {name: '', root: null, noteCount: 0, notes: []};

export function useChord() {
  const [chord, setChord] = useState<ChordResult>(EMPTY_RESULT);

  useEffect(() => {
    const service = getChordService();
    const unsub = service.subscribe(setChord);
    // Sync initial state
    setChord(service.getCurrent());
    return unsub;
  }, []);

  return chord;
}

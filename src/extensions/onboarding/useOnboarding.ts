// Minimal onboarding state: start/skip/replay flags.
// You can expand later to actually render coach marks.
import { useState } from 'react';

export function useOnboarding() {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  return {
    started, finished,
    start: () => setStarted(true),
    skip:  () => { setStarted(false); setFinished(true); },
    replay:() => { setFinished(false); setStarted(true); },
    complete: () => { setStarted(false); setFinished(true); },
  };
}

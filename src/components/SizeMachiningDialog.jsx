import { useState } from 'react';
import { SizeWeightDialog } from './SizeWeightDialog.jsx';
import { MachiningDialog } from './MachiningDialog.jsx';

// A calculator draft belongs to this report visit, never to the CUT session.
export function SizeMachiningDialog({ initialView, ...props }) {
  const [view, setView] = useState(initialView);
  const [draft, setDraft] = useState(null);
  return view === 'size-weight'
    ? <SizeWeightDialog {...props} draft={draft} onMachining={value => { setDraft(value); setView('machining'); }} />
    : <MachiningDialog {...props} hasTrial={Boolean(draft)} onSize={() => setView('size-weight')} />;
}

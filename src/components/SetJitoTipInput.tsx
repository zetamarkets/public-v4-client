import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useJitoTip } from '@/hooks/useSettings';

const PRESETS = [
  { label: 'Low', lamports: 1_000 },
  { label: 'Med', lamports: 10_000 },
  { label: 'High', lamports: 100_000 },
] as const;

const SetJitoTipInput = () => {
  const { jitoEnabled, jitoTip, setJitoEnabled, setJitoTip } = useJitoTip();
  const [customInput, setCustomInput] = useState('');

  const applyTip = (lamports: number) => {
    setJitoTip.mutate(lamports);
    setCustomInput('');
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setJitoEnabled.mutate(!jitoEnabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          jitoEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-pressed={jitoEnabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            jitoEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {jitoEnabled && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {PRESETS.map(({ label, lamports }) => (
              <Button
                key={label}
                variant={jitoTip === lamports ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyTip(lamports)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Custom (lamports)"
            />
            <Button
              size="sm"
              disabled={!customInput || Number(customInput) <= 0}
              onClick={() => applyTip(Number(customInput))}
            >
              Set
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Current: {jitoTip.toLocaleString()} lamports ({(jitoTip / 1e9).toFixed(6)} SOL)
          </p>
        </div>
      )}
    </div>
  );
};

export default SetJitoTipInput;

"use client";

import * as RadixSlider from "@radix-ui/react-slider";

type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
};

export function Slider({ min = 1, max = 8, step = 1, value, onChange }: SliderProps) {
  return (
    <RadixSlider.Root
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(v) => onChange(v[0] ?? value)}
      className="relative flex h-6 w-48 touch-none select-none items-center"
    >
      <RadixSlider.Track className="relative h-1.5 w-full grow rounded-full bg-white/20">
        <RadixSlider.Range className="absolute h-full rounded-full bg-white" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label="Columns"
        className="block h-4 w-4 rounded-full bg-white border border-white/70 shadow focus:outline-none focus:ring-2 focus:ring-white/60"
      />
    </RadixSlider.Root>
  );
}

export default Slider;



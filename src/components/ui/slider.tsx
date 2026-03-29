"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Slider({
  className,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-white"
        />
      </SliderPrimitive.Track>
      {Array.from({
        length: props.value?.length ?? props.defaultValue?.length ?? 1,
      }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={String(index)}
          data-slot="slider-thumb"
          className="block size-4 rounded-full border border-white/30 bg-black shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };

import { useRef, useState } from "react";

type ColorPickerButtonProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPickerButton({ value, onChange }: ColorPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      {/* Hidden native color input */}
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      {/* Styled button */}
      <button
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            setOpen(true);
            inputRef.current?.click();
          }
        }}
        style={{ backgroundColor: value }}
        className="w-12 h-10 cursor-pointer rounded-md border border-border transition-all duration-200 hover:border-primary hover:scale-105 shadow-sm"
      />
    </div>
  );
}

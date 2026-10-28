"use client";

interface PillProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  prefix?: boolean;
}

export default function Pill({ label, selected, onClick, prefix }: PillProps) {
  return (
    <button
      type="button"
      className={`pill${selected ? " selected" : ""}`}
      onClick={onClick}
    >
      {prefix && !selected ? `+ ${label}` : label}
    </button>
  );
}

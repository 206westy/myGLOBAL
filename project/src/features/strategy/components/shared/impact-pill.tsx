'use client';

interface ImpactPillProps {
  text: string;
  score?: number;
}

export function ImpactPill({ text, score }: ImpactPillProps) {
  return (
    <span className="bg-primary-fixed text-on-primary-fixed-variant text-[0.65rem] font-medium rounded-full px-2.5 py-1">
      {text}
      {score !== undefined && <span className="ml-1 opacity-70">({score})</span>}
    </span>
  );
}

export default function SectionLabel({ text, dark = true }: { text: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="font-mono-custom text-sm font-bold text-[#02B365]">[</span>
      <span className={`font-mono-custom text-xs tracking-widest uppercase ${dark ? "text-white/50" : "text-black/50"}`}>
        {text}
      </span>
      <span className="font-mono-custom text-sm font-bold text-[#02B365]">]</span>
    </div>
  );
}

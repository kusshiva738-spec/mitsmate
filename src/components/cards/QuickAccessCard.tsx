import Link from "next/link";

type Props = {
  title: string;
  desc: string;
  emoji: string;
  href?: string;
};

export default function QuickAccessCard({
  title,
  desc,
  emoji,
  href,
}: Props) {
  const card = (
    <div className="bg-[#17122b] rounded-2xl p-4 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer hover:scale-[1.02]">

      <div className="flex items-center gap-4">

        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
          {emoji}
        </div>

        <div>

          <h3 className="text-white font-semibold">
            {title}
          </h3>

          <p className="text-white/50 text-sm mt-1">
            {desc}
          </p>

        </div>

      </div>

    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  return card;
}
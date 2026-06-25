import QuickAccessCard from "@/components/cards/QuickAccessCard";

export default function QuickAccessSection() {
  const items = [
    {
      title: "Exam Partner",
      desc: "Find study buddy (coming soon)",
      emoji: "📘",
      href: "/exam-partner",
    },
    {
      title: "Open for Friendship",
      desc: "Meet new people",
      emoji: "🧡",
      href: "/discover",
    },
    {
      title: "Saved Profiles",
      desc: "People you liked",
      emoji: "🔖",
      href: "/friends",
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-white text-2xl font-bold mb-5">
        Quick Access
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <QuickAccessCard
            key={item.title}
            title={item.title}
            desc={item.desc}
            emoji={item.emoji}
            href={item.href}
          />
        ))}
      </div>
    </div>
  );
}
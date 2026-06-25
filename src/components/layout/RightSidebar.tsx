import StatusCard from "@/components/cards/StatusCard";

import QuickAccessSection from "@/components/sections/QuickAccessSection";

import HotTagCard from "@/components/cards/HotTagCard";

import MotivationCard from "@/components/cards/MotivationCard";

export default function RightSidebar() {

  return (

    <aside className="hidden 2xl:block w-[340px] bg-[#0b071d] border-l border-white/10 p-6 min-h-screen sticky top-0 overflow-y-auto">

      {/* TOP PROFILE */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-white text-xl font-bold">
            Your Space
          </h2>

          <p className="text-white/50 text-sm mt-1">
            Stay active and connected.
          </p>

        </div>

        <div className="relative">

          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-[#17122b]" />

          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0b071d] rounded-full" />

        </div>

      </div>

      {/* STATUS */}
      <StatusCard />

      {/* QUICK ACCESS */}
      <QuickAccessSection />

      {/* HOT TAGS */}
      <div className="mt-8">

        <h2 className="text-white text-2xl font-bold mb-5">
          What's Hot 🔥
        </h2>

        <div className="flex flex-wrap gap-3">

          {[
            "# Coding",
            "# Placements",
            "# Hackathon",
            "# StudyGroup",
            "# Anime",
            "# Chai",
          ].map((tag) => (

            <HotTagCard
              key={tag}
              tag={tag}
            />

          ))}

        </div>

      </div>

      {/* MOTIVATION */}
      <MotivationCard />

    </aside>
  );
}
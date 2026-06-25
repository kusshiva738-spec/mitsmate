"use client";

const menu = [
  "Home",
  "Discover",
  "Open for Chai",
  "Friendship",
  "Campus Wall",
  "Exam Partner",
  "Profile",
];

export default function Sidebar() {
  return (
    <aside className="w-[260px] bg-[#0f0a24] min-h-screen text-white p-6">
      <h1 className="text-3xl font-bold text-purple-400">
        ☕ MITS-Mate
      </h1>

      <p className="text-gray-400 mt-2 text-sm">
        Digital Adda for MITS Students
      </p>
<button className="w-full mt-8 bg-purple-600 py-3 rounded-2xl font-semibold hover:bg-purple-500 transition">
        Open for Friendship
      </button>

      <div className="mt-10 space-y-3">
        {menu.map((item) => (
          <div
            key={item}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer p-4 rounded-2xl"
          >
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}
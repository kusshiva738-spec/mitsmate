"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function LeftSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Feed", icon: "🏠", href: "/feed" },
    { name: "MITS Wall", icon: "🔥", href: "/wall" },
    { name: "Open For Chai", icon: "🫖", href: "/chai" },
    { name: "Discover", icon: "👥", href: "/discover" },
    { name: "Groups", icon: "📚", href: "/groups" },
    { name: "Chats", icon: "💬", href: "/chats" },
    { name: "Profile", icon: "👤", href: "/profile" },
    { name: "About Us", icon: "✨", href: "/about" },
  ];

  return (
    <aside  className="w-64 border-r border-white/10 bg-[#0b0b0f] p-4">
      <h1 className="text-xl font-bold text-white mb-5">
        <Image
  src="/logo.png"
  alt="MITS Mate"
  width={120}
  height={80}
  className="rounded-full"
/>
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
              pathname === item.href
                ? "bg-orange-500 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}


export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [chaiCount, setChaiCount] = useState(0);
  const [friendshipCount, setFriendshipCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [todayPosts, setTodayPosts] = useState(0);
  const [students, setStudents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  

  useEffect(() => {
    loadDashboard();
  }, []);
   
  async function loadDashboard() {
    try {
        const start = Date.now();

    

    const elapsed = Date.now() - start;

    if (elapsed < 2000) {
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 - elapsed)
      );
    }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(myProfile);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        chaiResult, friendshipResult, studentResult,
        postsTodayResult, latestStudents, latestPosts, latestGroups,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("open_for_chai", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("open_for_friendship", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("wall_posts").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(6),
        supabase.from("wall_posts").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("groups").select("*").order("created_at", { ascending: false }).limit(3),
      ]);

      setChaiCount(chaiResult.count || 0);
      setFriendshipCount(friendshipResult.count || 0);
      setStudentCount(studentResult.count || 0);
      setTodayPosts(postsTodayResult.count || 0);
      setStudents(latestStudents.data || []);
      setPosts(latestPosts.data || []);
      setGroups(latestGroups.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Student";

  const groupColors = [
    { text: "text-amber-300", chip: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
    { text: "text-cyan-300",  chip: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20"   },
    { text: "text-pink-300",  chip: "text-pink-300 bg-pink-400/10 border-pink-400/20"   },
    { text: "text-emerald-300", chip: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
    { text: "text-violet-300",  chip: "text-violet-300 bg-violet-400/10 border-violet-400/20"   },
  ];
   if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      {/* Outer wrapper clips ALL children — nothing escapes */}
      <div className="w-full overflow-hidden">
        <div className="space-y-8 max-w-7xl mx-auto px-2">

          {/* ── Greeting + header pills ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent truncate">
                Hey {firstName} 👋
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Everyone&apos;s here to vibe, talk and build real connections.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ">
              <Link
                href="/chai"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-400/5 border border-orange-400/20 hover:border-orange-400/40 px-4 py-3 transition-colors"
              >
                <div>
                  <p className="text-orange-300 font-semibold text-sm whitespace-nowrap">Open for Chai ☕</p>
                  <p className="text-slate-400 text-xs mt-0.5 whitespace-nowrap">Find someone who&apos;s also open</p>
                </div>
                <span className="text-orange-300 ml-1">→</span>
              </Link>

              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3">
                <div className="flex -space-x-2 shrink-0">
                  {students.slice(0, 2).map((s) => (
                    <img
                      key={s.id}
                      src={s.image_url || "/default-avatar.png"}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover border-2 border-[#120d25]"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-tight whitespace-nowrap">
                  {chaiCount} people<br />are open now
                </p>
              </div>
            </div>
          </div>

          {/* Loading */}
          
          {!loading && (
            <>
              {/* ── Stats ── */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { icon: "☕", label: "Open For Chai",      value: chaiCount,       from: "from-amber-400",  to: "to-orange-500", shadow: "shadow-amber-500/20",  num: "text-amber-300"  },
                  { icon: "🤝", label: "Open For Friendship", value: friendshipCount, from: "from-pink-400",   to: "to-rose-500",   shadow: "shadow-pink-500/20",   num: "text-pink-300"   },
                  { icon: "🔥", label: "Wall Posts Today",    value: todayPosts,      from: "from-fuchsia-400",to: "to-red-500",    shadow: "shadow-fuchsia-500/20",num: "text-fuchsia-300"},
                  { icon: "👥", label: "Students Joined",     value: studentCount,    from: "from-cyan-400",   to: "to-blue-500",   shadow: "shadow-cyan-500/20",   num: "text-cyan-300"   },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 hover:border-white/20 transition-colors min-w-0"
                  >
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.from} ${stat.to} flex items-center justify-center text-xl shadow-lg ${stat.shadow} shrink-0`}>
                      {stat.icon}
                    </div>
                    <h3 className="text-gray-400 mt-3 text-sm truncate">{stat.label}</h3>
                    <p className={`text-3xl font-bold ${stat.num} mt-1`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Discover People ── */}
              <div className="min-w-0">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
                      Discover People
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Students in your college, open to connect</p>
                  </div>
                  <Link href="/discover" className="text-sm text-orange-400 hover:text-orange-300 shrink-0 ml-4">
                    View all →
                  </Link>
                </div>

                {/* Horizontal scroll — cards fixed width, no stretching */}
                <div
                  className="flex gap-4 overflow-x-auto pb-3"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff20 transparent" }}
                >
                  {students.map((student) => {
                    const isUpForChai = !!student.open_for_chai;
                    return (
                      <div
                        key={student.id}
                        className="flex-none w-[180px] rounded-3xl bg-white/[0.04] border border-white/10 p-4 hover:border-violet-500/40 transition-colors"
                      >
                        {/* Small avatar + status dot */}
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={student.image_url || "/default-avatar.png"}
                              alt={student.full_name || "Student"}
                              className="w-12 h-12 rounded-full object-cover object-top border-2 border-white/10"
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#120d25] ${isUpForChai ? "bg-violet-400" : "bg-emerald-400"}`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
                              {student.full_name}
                            </h3>
                            <p className="text-slate-400 text-xs truncate mt-0.5">
                              {student.branch || "MITS"}
                            </p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`mt-3 inline-block text-[10px] font-semibold px-3 py-1 rounded-full ${isUpForChai ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                          {isUpForChai ? "☕ Up for Chai" : "🟢 Open for friendship"}
                        </span>

                        <Link
                          href="/discover"
                          className="mt-3 block text-center text-xs font-semibold rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white py-2 hover:opacity-90 transition-opacity"
                        >
                          Say Hi 👋
                        </Link>
                      </div>
                    );
                  })}

                  {students.length === 0 && (
                    <p className="text-slate-500 text-sm py-8">No one to discover yet — check back soon.</p>
                  )}
                </div>
              </div>

              {/* ── Open for Chai + Campus Wall side by side ── */}
              <div className="grid lg:grid-cols-2 gap-6 items-start">

                {/* Left — Open for Chai */}
                <div className="min-w-0">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                      Open for Chai
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Start a chai, find your vibe</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* CTA card */}
                    <div className="rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-400/20 p-6 flex flex-col items-center text-center">
                      <div className="text-5xl mb-3">☕</div>
                      <h3 className="text-white font-semibold text-sm leading-snug">
                        Find someone who&apos;s also up for a chai 🫖
                      </h3>
                      <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                        Click the button and we&apos;ll match you with someone who&apos;s also open right now.
                      </p>
                      <Link
                        href="/chai"
                        className="mt-5 w-full text-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm px-4 py-2.5 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
                      >
                        Open for Chai
                      </Link>
                    </div>

                    {/* How it works */}
                    <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-3 flex flex-col">
                      <p className="text-slate-400 text-xs font-medium mb-4">How it works?</p>

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-base">☕</div>
                          <p className="text-slate-400 text-[10px] mt-2 leading-tight">You open for chai</p>
                        </div>
                        <span className="text-slate-600 text-xs mt-3">→</span>
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-base">👥</div>
                          <p className="text-slate-400 text-[10px] mt-2 leading-tight">We find someone open</p>
                        </div>
                        <span className="text-slate-600 text-xs mt-3">→</span>
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-base">💬</div>
                          <p className="text-slate-400 text-[10px] mt-2 leading-tight">Start a chat & plan</p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/10 flex-1">
                        <p className="text-slate-300 text-xs font-semibold mb-3">Recent Chai Sessions</p>
                        <p className="text-slate-500 text-xs">No sessions yet — be the first to grab a chai.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — Campus Wall */}
                <div className="min-w-0">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent">
                        Campus Wall
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">See what&apos;s happening around you</p>
                    </div>
                    <Link href="/wall" className="text-sm text-orange-400 hover:text-orange-300 shrink-0 ml-4">
                      View all →
                    </Link>
                  </div>

                  {/* Post composer — visual placeholder */}
                  
                    
                    <input
                      type="text"
                      placeholder="What's on your mind?"
                      disabled
                      className="flex-1 min-w-0 bg-transparent text-sm text-slate-300 placeholder:text-slate-500 outline-none cursor-not-allowed"
                    />
                    <button
                      
                      className="shrink-0 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-4 py-1.5 opacity-50 cursor-not-allowed"
                    >
                      Post
                    </button>
                  

                  {/* Posts */}
                  <div className="space-y-2">
                    {posts.map((post) => {
                      const authorName = "Someone on campus";
                      return (
                        <div
                          key={post.id}
                          className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 hover:border-white/20 transition-colors overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w- h-9 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                                {authorName}
                              </div>
                              <p className="text-white font-medium text-sm truncate">{}</p>
                            </div>
                            <span className="text-slate-500 text-xs shrink-0">{timeAgo(post.created_at)}</span>
                          </div>

                          <p className="text-slate-300 text-sm mt-3 leading-relaxed break-words">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-slate-500 text-sm">
                            <span className="cursor-pointer hover:text-rose-400 transition-colors">❤️</span>
                            <span className="cursor-pointer hover:text-cyan-400 transition-colors">💬</span>
                            <span className="ml-auto cursor-pointer hover:text-amber-400 transition-colors">🔖</span>
                          </div>
                        </div>
                      );
                    })}

                    {posts.length === 1&& (
                      <p className="text-slate-500 text-sm py-4">No posts yet — be the first to share something.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Study Groups ── */}
              <div className="min-w-0">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                      Study Groups
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Find your people, learn together</p>
                  </div>
                  <Link href="/groups" className="text-sm text-orange-400 hover:text-orange-300 shrink-0 ml-4">
                    View all →
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {groups.map((group, i) => {
                    const color = groupColors[i % groupColors.length];
                    return (
                      <div
                        key={group.id}
                        className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 hover:border-white/20 transition-colors overflow-hidden min-w-0"
                      >
                        <h3 className={`font-semibold truncate ${color.text}`}>{group.name}</h3>
                        <p className="text-slate-400 text-sm mt-2 line-clamp-2">{group.description}</p>
                        <div className={`mt-4 inline-block text-xs font-medium rounded-full px-3 py-1 border ${color.chip}`}>
                          {group.category}
                        </div>
                      </div>
                    );
                  })}

                  {groups.length === 0 && (
                    <p className="text-slate-500 text-sm">No groups yet — start one and invite classmates.</p>
                  )}
                </div>
              </div>

              {/* ── Footer taglines ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6">
                {[
                  { icon: "😊", title: "No pressure, just people", desc: "Everyone's here to vibe and make meaningful connections." },
                  { icon: "🛡️", title: "Real & Respectful",        desc: "Be kind, be real. Let's build a positive and safe community." },
                  { icon: "🏫", title: "Your college, your people", desc: "Connect with people who get your college life." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
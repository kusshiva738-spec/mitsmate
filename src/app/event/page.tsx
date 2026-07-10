"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  expires_at: string | null;
  venue: string;
  poster_url: string | null;
  registration_link: string | null;
  google_maps_link: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  views: number;
  club_name: string | null;
  created_at: string;
}

/* ──────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────── */

const CATEGORIES = ["All", "General", "Technical", "Cultural", "Sports", "Workshop", "Seminar", "Fest", "Religious"];
const PAGE_SIZE  = 12;

/* Category gradient palette — vibrant, MITS-Mate aligned */
const CAT_STYLES: Record<string, { gradient: string; border: string; badge: string; glow: string }> = {
  General:   { gradient: "from-violet-600/30 to-purple-700/20",  border: "border-violet-500/40",  badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",   glow: "group-hover:shadow-violet-500/25" },
  Technical: { gradient: "from-cyan-600/30   to-blue-700/20",    border: "border-cyan-500/40",    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",         glow: "group-hover:shadow-cyan-500/25"   },
  Cultural:  { gradient: "from-pink-600/30   to-rose-700/20",    border: "border-pink-500/40",    badge: "bg-pink-500/20 text-pink-300 border-pink-500/30",         glow: "group-hover:shadow-pink-500/25"   },
  Sports:    { gradient: "from-emerald-600/30 to-teal-700/20",   border: "border-emerald-500/40", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", glow: "group-hover:shadow-emerald-500/25"},
  Workshop:  { gradient: "from-amber-600/30  to-orange-700/20",  border: "border-amber-500/40",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",       glow: "group-hover:shadow-amber-500/25"  },
  Seminar:   { gradient: "from-sky-600/30    to-indigo-700/20",  border: "border-sky-500/40",     badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",             glow: "group-hover:shadow-sky-500/25"    },
  Fest:      { gradient: "from-fuchsia-600/30 to-pink-700/20",   border: "border-fuchsia-500/40", badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30", glow: "group-hover:shadow-fuchsia-500/25"},
  Religious: { gradient: "from-yellow-600/30  to-amber-700/20",  border: "border-yellow-500/40",  badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",    glow: "group-hover:shadow-yellow-500/25" },
};

function getCatStyle(cat: string) {
  return CAT_STYLES[cat] ?? CAT_STYLES.General;
}

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const tom   = new Date(); tom.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return { label: "Today",    urgent: true  };
  if (date.toDateString() === tom.toDateString())   return { label: "Tomorrow", urgent: false };

  return {
    label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    urgent: false,
  };
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

function isExpired(event: Event) {
  if (event.expires_at && new Date(event.expires_at) < new Date()) return true;
  // Expire events at end of event_date day
  const end = new Date(event.event_date);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
}

/* ──────────────────────────────────────────────────────────────
   Category icon
   ────────────────────────────────────────────────────────────── */

const CAT_ICON: Record<string, string> = {
  General:   "📌", Technical: "⚙️", Cultural: "🎭",
  Sports:    "🏆", Workshop:  "🛠️", Seminar:  "🎓",
  Fest:      "🎊", Religious: "🛕",
};

/* ──────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────── */

export default function EventsPage() {
  const router = useRouter();

  const [events,        setEvents]        = useState<Event[]>([]);
  const [activeCategory,setActiveCategory]= useState("All");
  const [search,        setSearch]        = useState("");
  const [debouncedQ,    setDebouncedQ]    = useState("");
  const [sort,          setSort]          = useState<"upcoming" | "popular">("upcoming");
  const [loadingInit,   setLoadingInit]   = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(true);
  const [page,          setPage]          = useState(0);
  const [lightbox,      setLightbox]      = useState<Event | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── Debounce ─────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 380);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Auto-delete expired events via DB (runs on page load) ── */
  useEffect(() => {
    // Soft-delete: marks events as 'rejected' if expires_at is past.
    // For hard-delete schedule a Supabase pg_cron job instead.
    const now = new Date().toISOString();
    supabase
      .from("events")
      .update({ status: "rejected" })
      .eq("status", "approved")
      .lt("expires_at", now)
      .then(({ error }) => { if (error) console.warn("auto-expire:", error.message); });
  }, []);

  /* ── Build query ──────────────────────────────────────────── */
  const buildQuery = useCallback((pageIdx: number) => {
    const today = new Date().toISOString().slice(0, 10);

    let q = supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .gte("event_date", today); // only upcoming/today

    if (activeCategory !== "All") q = q.eq("category", activeCategory);

    if (debouncedQ) {
      q = q.or(
        `title.ilike.%${debouncedQ}%,description.ilike.%${debouncedQ}%,venue.ilike.%${debouncedQ}%,club_name.ilike.%${debouncedQ}%`
      );
    }

    q = sort === "popular"
      ? q.order("views",      { ascending: false })
      : q.order("event_date", { ascending: true  });

    const from = pageIdx * PAGE_SIZE;
    return q.range(from, from + PAGE_SIZE - 1);
  }, [activeCategory, debouncedQ, sort]);

  /* ── Initial load / filter change ────────────────────────── */
  useEffect(() => {
    setLoadingInit(true);
    setEvents([]);
    setPage(0);
    setHasMore(true);

    buildQuery(0).then(({ data, error }) => {
      if (error) console.error(error.message);
      const live = (data || []).filter(e => !isExpired(e));
      setEvents(live);
      setHasMore((data || []).length === PAGE_SIZE);
      setLoadingInit(false);
    });
  }, [buildQuery]);

  /* ── Load more ────────────────────────────────────────────── */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loadingInit) return;
    setLoadingMore(true);
    const next = page + 1;
    const { data, error } = await buildQuery(next);
    if (error) console.error(error.message);
    const live = (data || []).filter(e => !isExpired(e));
    setEvents(prev => [...prev, ...live]);
    setPage(next);
    setHasMore((data || []).length === PAGE_SIZE);
    setLoadingMore(false);
  }, [buildQuery, page, hasMore, loadingMore, loadingInit]);

  /* ── Infinite scroll ──────────────────────────────────────── */
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) loadMore(); },
      { rootMargin: "400px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadMore]);

  /* ── View count ───────────────────────────────────────────── */
  function openEvent(ev: Event) {
    supabase.from("events").update({ views: ev.views + 1 }).eq("id", ev.id).then();
    setLightbox(ev);
  }

  /* ──────────────────────────────────────────────────────────
     Render
  ────────────────────────────────────────────────────────── */

  return (
    <DashboardLayout>

      {/* ── Event Detail Modal ───────────────────────────────── */}
      {lightbox && <EventModal event={lightbox} onClose={() => setLightbox(null)} />}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/20 to-pink-600/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
          <div className="relative p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎊</span>
                <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">MITS Campus Events</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">Events</h1>
              <p className="text-white/55 text-sm mt-1">Discover upcoming fests, workshops, competitions & more</p>
            </div>
            <button
              onClick={() => router.push("/eventpost")}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30 hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all"
            >
              ＋ Post Event
            </button>
          </div>
        </div>

        {/* ── Search ─────────────────────────────────────────── */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, clubs, venues..."
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 pl-12 pr-10 py-3.5 text-white text-sm placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg transition-colors">✕</button>
          )}
        </div>

        {/* ── Category chips ─────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map(cat => {
            const style = cat !== "All" ? getCatStyle(cat) : null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-md shadow-violet-500/30"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/25 hover:text-white"
                }`}
              >
                {cat !== "All" && <span>{CAT_ICON[cat]}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Sort + results info ─────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            {!loadingInit && (
              events.length > 0
                ? `${events.length}${hasMore ? "+" : ""} events${activeCategory !== "All" ? ` in ${activeCategory}` : ""}`
                : "No events found"
            )}
          </p>
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as "upcoming" | "popular")}
              className="appearance-none rounded-xl bg-white/[0.04] border border-white/10 pl-4 pr-9 py-2 text-sm text-white outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="upcoming" className="bg-[#1a1025]">📅 Upcoming First</option>
              <option value="popular"  className="bg-[#1a1025]">🔥 Most Popular</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">▼</span>
          </div>
        </div>

        {/* ── Grid ───────────────────────────────────────────── */}
        {loadingInit ? (
          <SkeletonGrid />
        ) : events.length === 0 ? (
          <EmptyState category={activeCategory} search={search} />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map(ev => (
                <EventCard key={ev.id} event={ev} onClick={() => openEvent(ev)} />
              ))}
            </div>

            <div ref={sentinelRef} className="h-8" />

            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: "#a78bfa", borderRightColor: "#ec4899" }} />
              </div>
            )}

            {!hasMore && events.length > 0 && (
              <p className="text-center text-slate-600 text-xs py-4">
                All events shown 🎊
              </p>
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  );
}

/* ──────────────────────────────────────────────────────────────
   Event Card
   ────────────────────────────────────────────────────────────── */

function EventCard({ event: ev, onClick }: { event: Event; onClick: () => void }) {
  const style   = getCatStyle(ev.category);
  const dateInfo= formatDate(ev.event_date);
  const days    = daysUntil(ev.event_date);
  const isLive  = days === 0;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-3xl border ${style.border} bg-gradient-to-br ${style.gradient} bg-[#13101f] overflow-hidden cursor-pointer
        transition-all duration-300
        hover:-translate-y-1.5
        hover:shadow-2xl ${style.glow}
        hover:border-opacity-80
      `}
    >
      {/* Poster */}
      <div className="relative h-44 overflow-hidden bg-black/30">
        {ev.poster_url ? (
          <img
            src={ev.poster_url}
            alt={ev.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br ${style.gradient}`}>
            {CAT_ICON[ev.category] || "🎊"}
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${style.badge} backdrop-blur-sm`}>
            {CAT_ICON[ev.category]} {ev.category}
          </span>

          {isLive ? (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500/90 text-white border border-red-400/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE TODAY
            </span>
          ) : days === 1 ? (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/90 text-black border border-amber-400/50 backdrop-blur-sm">
              TOMORROW
            </span>
          ) : days <= 3 ? (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/80 text-white border border-orange-400/50 backdrop-blur-sm">
              {days}d Left
            </span>
          ) : null}
        </div>

        {/* Bottom: date + time over poster */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-xs font-bold text-white/90 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            📅 {dateInfo.label}
          </span>
          <span className="text-xs font-semibold text-white/80 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            ⏰ {formatTime(ev.start_time)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">

        {/* Club name */}
        {ev.club_name && (
          <p className="text-[11px] font-bold text-violet-300 uppercase tracking-wider truncate">
            {ev.club_name}
          </p>
        )}

        {/* Title */}
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-violet-200 transition-colors">
          {ev.title}
        </h3>

        {/* Description */}
        {ev.description && (
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {ev.description}
          </p>
        )}

        {/* Venue */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>📍</span>
          <span className="truncate">{ev.venue}</span>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            👁 {ev.views} views
          </span>

          {ev.registration_link && (
            <a
              href={ev.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 transition-opacity shadow-md shadow-violet-500/20"
            >
              Register →
            </a>
          )}
        </div>
      </div>

      {/* Hover shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Event Detail Modal
   ────────────────────────────────────────────────────────────── */

function EventModal({ event: ev, onClose }: { event: Event; onClose: () => void }) {
  const style = getCatStyle(ev.category);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const dateInfo = formatDate(ev.event_date);
  const days     = daysUntil(ev.event_date);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#130f22] shadow-2xl overflow-hidden animate-[slideUp_0.25s_ease-out]"
      >
        {/* Poster / header */}
        <div className="relative h-52 flex-shrink-0 bg-black/30">
          {ev.poster_url ? (
            <img src={ev.poster_url} alt={ev.title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br ${style.gradient}`}>
              {CAT_ICON[ev.category] || "🎊"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#130f22] via-black/20 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
          >
            ✕
          </button>

          {/* Live badge */}
          {days === 0 && (
            <span className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full bg-red-500/90 text-white border border-red-400/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              HAPPENING TODAY
            </span>
          )}

          {/* Date chip on image */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
            <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              📅 {dateInfo.label}
            </span>
            <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              ⏰ {formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ""}
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Category + club */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${style.badge}`}>
              {CAT_ICON[ev.category]} {ev.category}
            </span>
            {ev.club_name && (
              <span className="text-xs font-semibold text-violet-300 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                🏛️ {ev.club_name}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-white font-black text-xl leading-snug">{ev.title}</h2>

          {/* Description */}
          {ev.description && (
            <p className="text-slate-300 text-sm leading-relaxed">{ev.description}</p>
          )}

          {/* Details grid */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 divide-y divide-white/5">
            <DetailRow icon="📍" label="Venue"   value={ev.venue} />
            {ev.contact_name  && <DetailRow icon="👤" label="Contact"  value={ev.contact_name} />}
            {ev.contact_phone && <DetailRow icon="📞" label="Phone"    value={ev.contact_phone} isPhone />}
            <DetailRow icon="👁" label="Views"   value={`${ev.views} people viewed this`} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pb-1">
            {ev.registration_link && (
              <a
                href={ev.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity"
              >
                🎟️ Register Now
              </a>
            )}
            {ev.google_maps_link && (
              <a
                href={ev.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                🗺️ View on Google Maps
              </a>
            )}
            {ev.contact_phone && (
              <a
                href={`tel:${ev.contact_phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                📞 Call Organiser
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Detail row ───────────────────────────────────────────────── */
function DetailRow({
  icon, label, value, isPhone = false,
}: { icon: string; label: string; value: string; isPhone?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {isPhone ? (
          <a href={`tel:${value}`} className="text-sm text-violet-300 hover:text-violet-200 transition-colors">{value}</a>
        ) : (
          <p className="text-sm text-white/85 mt-0.5 leading-snug">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden animate-pulse">
          <div className="h-44 bg-white/5" />
          <div className="p-4 space-y-3">
            <div className="h-3 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────── */
function EmptyState({ category, search }: { category: string; search: string }) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">
        {search ? "🔍" : category !== "All" ? CAT_ICON[category] || "🎊" : "🎊"}
      </div>
      <p className="text-white font-semibold text-lg">
        {search ? `No events matching "${search}"` : category !== "All" ? `No ${category} events right now` : "No upcoming events"}
      </p>
      <p className="text-slate-500 text-sm">
        {search ? "Try a different keyword" : "Check back soon or post your own event!"}
      </p>
    </div>
  );
}
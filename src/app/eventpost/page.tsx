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

const CAT_ICON: Record<string, string> = {
  General: "📌", Technical: "⚙️", Cultural: "🎭",
  Sports: "🏆", Workshop: "🛠️", Seminar: "🎓",
  Fest: "🎊", Religious: "🛕",
};

const CAT_STYLES: Record<string, { gradient: string; border: string; badge: string; glow: string }> = {
  General:   { gradient: "from-violet-600/30 to-purple-700/20",  border: "border-violet-500/40",  badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",   glow: "group-hover:shadow-violet-500/25" },
  Technical: { gradient: "from-cyan-600/30 to-blue-700/20",      border: "border-cyan-500/40",    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",         glow: "group-hover:shadow-cyan-500/25"   },
  Cultural:  { gradient: "from-pink-600/30 to-rose-700/20",      border: "border-pink-500/40",    badge: "bg-pink-500/20 text-pink-300 border-pink-500/30",         glow: "group-hover:shadow-pink-500/25"   },
  Sports:    { gradient: "from-emerald-600/30 to-teal-700/20",   border: "border-emerald-500/40", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", glow: "group-hover:shadow-emerald-500/25"},
  Workshop:  { gradient: "from-amber-600/30 to-orange-700/20",   border: "border-amber-500/40",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",       glow: "group-hover:shadow-amber-500/25"  },
  Seminar:   { gradient: "from-sky-600/30 to-indigo-700/20",     border: "border-sky-500/40",     badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",             glow: "group-hover:shadow-sky-500/25"    },
  Fest:      { gradient: "from-fuchsia-600/30 to-pink-700/20",   border: "border-fuchsia-500/40", badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30", glow: "group-hover:shadow-fuchsia-500/25"},
  Religious: { gradient: "from-yellow-600/30 to-amber-700/20",   border: "border-yellow-500/40",  badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",    glow: "group-hover:shadow-yellow-500/25" },
};

function getCat(cat: string) {
  return CAT_STYLES[cat] ?? CAT_STYLES.General;
}

const PAGE_SIZE = 12;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const tom = new Date(); tom.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return { label: "Today",    urgent: true };
  if (date.toDateString() === tom.toDateString())   return { label: "Tomorrow", urgent: false };
  return { label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), urgent: false };
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
}

function isExpired(ev: Event) {
  if (ev.expires_at && new Date(ev.expires_at) < new Date()) return true;
  const end = new Date(ev.event_date); end.setHours(23,59,59,999);
  return end < new Date();
}

/* ──────────────────────────────────────────────────────────────
   Cloudinary upload
   ────────────────────────────────────────────────────────────── */

async function uploadToCloudinary(file: File): Promise<string | null> {
  const cloud  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    alert("Cloudinary env vars missing. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local");
    return null;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", "gwaliorhub/events");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) { alert("Image upload failed. Please try again."); return null; }
  const data = await res.json();
  return data.secure_url as string;
}

/* ──────────────────────────────────────────────────────────────
   Empty form state
   ────────────────────────────────────────────────────────────── */

const EMPTY_FORM = {
  title: "", description: "", category: "General", event_date: "",
  start_time: "", end_time: "", venue: "", club_name: "",
  registration_link: "", google_maps_link: "",
  contact_name: "", contact_phone: "",
};

/* ──────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────── */

export default function EventsPage() {
  const router = useRouter();

  // Data
  const [events,       setEvents]       = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,       setSearch]       = useState("");
  const [debouncedQ,   setDebouncedQ]   = useState("");
  const [sort,         setSort]         = useState<"upcoming" | "popular">("upcoming");
  const [loadingInit,  setLoadingInit]  = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [page,         setPage]         = useState(0);

  // Modals
  const [detailModal,  setDetailModal]  = useState<Event | null>(null);
  const [posterLightbox, setPosterLightbox] = useState<{ url: string; title: string } | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);

  // Post form
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [posterFile,   setPosterFile]   = useState<File | null>(null);
  const [posterPreview,setPosterPreview]= useState<string>("");
  const [uploading,    setUploading]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState("");
  const [userId,       setUserId]       = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── Auth ──────────────────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  /* ── Debounce ──────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 380);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Auto-expire ───────────────────────────────────────────── */
  useEffect(() => {
    supabase.from("events")
      .update({ status: "rejected" })
      .eq("status", "approved")
      .lt("expires_at", new Date().toISOString())
      .then();
  }, []);

  /* ── Build query ───────────────────────────────────────────── */
  const buildQuery = useCallback((idx: number) => {
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase.from("events").select("*").eq("status", "approved").gte("event_date", today);
    if (activeCategory !== "All") q = q.eq("category", activeCategory);
    if (debouncedQ) q = q.or(`title.ilike.%${debouncedQ}%,description.ilike.%${debouncedQ}%,venue.ilike.%${debouncedQ}%,club_name.ilike.%${debouncedQ}%`);
    q = sort === "popular" ? q.order("views", { ascending: false }) : q.order("event_date", { ascending: true });
    return q.range(idx * PAGE_SIZE, idx * PAGE_SIZE + PAGE_SIZE - 1);
  }, [activeCategory, debouncedQ, sort]);

  /* ── Load ──────────────────────────────────────────────────── */
  useEffect(() => {
    setLoadingInit(true); setEvents([]); setPage(0); setHasMore(true);
    buildQuery(0).then(({ data, error }) => {
      if (error) console.error(error.message);
      setEvents((data || []).filter(e => !isExpired(e)));
      setHasMore((data || []).length === PAGE_SIZE);
      setLoadingInit(false);
    });
  }, [buildQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loadingInit) return;
    setLoadingMore(true);
    const next = page + 1;
    const { data, error } = await buildQuery(next);
    if (error) console.error(error.message);
    setEvents(prev => [...prev, ...(data || []).filter(e => !isExpired(e))]);
    setPage(next); setHasMore((data || []).length === PAGE_SIZE);
    setLoadingMore(false);
  }, [buildQuery, page, hasMore, loadingMore, loadingInit]);

  useEffect(() => {
    const node = sentinelRef.current; if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { rootMargin: "400px" });
    obs.observe(node); return () => obs.disconnect();
  }, [loadMore]);

  /* ── Open event detail ─────────────────────────────────────── */
  function openDetail(ev: Event) {
    supabase.from("events").update({ views: ev.views + 1 }).eq("id", ev.id).then();
    setDetailModal(ev);
  }

  /* ── Post form handlers ────────────────────────────────────── */
  function openPostForm() {
    if (!userId) { router.push("/auth"); return; }
    setForm({ ...EMPTY_FORM }); setPosterFile(null); setPosterPreview(""); setFormError("");
    setShowPostForm(true);
  }

  function handlePosterPick(file: File) {
    if (file.size > 5 * 1024 * 1024) { setFormError("Image must be under 5 MB."); return; }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
    setFormError("");
  }

  async function handleSubmitEvent() {
    setFormError("");
    if (!form.title.trim())      { setFormError("Title is required."); return; }
    if (!form.event_date)        { setFormError("Event date is required."); return; }
    if (!form.start_time)        { setFormError("Start time is required."); return; }
    if (!form.venue.trim())      { setFormError("Venue is required."); return; }
    if (!userId)                 { router.push("/auth"); return; }

    setSubmitting(true);
    let posterUrl: string | null = null;

    if (posterFile) {
      setUploading(true);
      posterUrl = await uploadToCloudinary(posterFile);
      setUploading(false);
      if (!posterUrl) { setSubmitting(false); return; }
    }

    // expires_at = end of event day
    const expiresAt = new Date(form.event_date);
    expiresAt.setHours(23, 59, 59, 999);

    const { error } = await supabase.from("events").insert({
      user_id:           userId,
      title:             form.title.trim(),
      description:       form.description.trim() || null,
      category:          form.category,
      event_date:        form.event_date,
      start_time:        form.start_time,
      end_time:          form.end_time || null,
      expires_at:        expiresAt.toISOString(),
      venue:             form.venue.trim(),
      club_name:         form.club_name.trim() || null,
      registration_link: form.registration_link.trim() || null,
      google_maps_link:  form.google_maps_link.trim() || null,
      contact_name:      form.contact_name.trim() || null,
      contact_phone:     form.contact_phone.trim() || null,
      poster_url:        posterUrl,
      status:            "approved",
    });

    setSubmitting(false);
    if (error) { setFormError(error.message); return; }

    setShowPostForm(false);
    // Reload feed
    setLoadingInit(true); setEvents([]); setPage(0); setHasMore(true);
    buildQuery(0).then(({ data }) => {
      setEvents((data || []).filter(e => !isExpired(e)));
      setHasMore((data || []).length === PAGE_SIZE);
      setLoadingInit(false);
    });
  }

  /* ──────────────────────────────────────────────────────────
     Render
  ────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      {/* ── Poster lightbox ──────────────────────────────────── */}
      {posterLightbox && (
        <PosterLightbox url={posterLightbox.url} title={posterLightbox.title} onClose={() => setPosterLightbox(null)} />
      )}

      {/* ── Event detail modal ───────────────────────────────── */}
      {detailModal && !posterLightbox && (
        <EventModal
          event={detailModal}
          onClose={() => setDetailModal(null)}
          onViewPoster={(url, title) => setPosterLightbox({ url, title })}
        />
      )}

      {/* ── Post event form modal ─────────────────────────────── */}
      {showPostForm && (
        <PostEventModal
          form={form}
          setForm={setForm}
          posterPreview={posterPreview}
          uploading={uploading}
          submitting={submitting}
          formError={formError}
          onPosterPick={handlePosterPick}
          onRemovePoster={() => { setPosterFile(null); setPosterPreview(""); }}
          onSubmit={handleSubmitEvent}
          onClose={() => setShowPostForm(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
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
              <p className="text-white/55 text-sm mt-1">Discover upcoming fests, workshops, competitions &amp; more</p>
            </div>
            <button
              onClick={openPostForm}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30 hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all"
            >
              ＋ Post Event
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events, clubs, venues..."
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 pl-12 pr-10 py-3.5 text-white text-sm placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-colors" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg transition-colors">✕</button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-md shadow-violet-500/30"
                  : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/25 hover:text-white"
              }`}>
              {cat !== "All" && <span>{CAT_ICON[cat]}</span>}{cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            {!loadingInit && (events.length > 0
              ? `${events.length}${hasMore ? "+" : ""} events${activeCategory !== "All" ? ` · ${activeCategory}` : ""}`
              : "No events found")}
          </p>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value as "upcoming" | "popular")}
              className="appearance-none rounded-xl bg-white/[0.04] border border-white/10 pl-4 pr-9 py-2 text-sm text-white outline-none focus:border-violet-500/50 cursor-pointer">
              <option value="upcoming" className="bg-[#1a1025]">📅 Upcoming First</option>
              <option value="popular"  className="bg-[#1a1025]">🔥 Most Popular</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">▼</span>
          </div>
        </div>

        {/* Grid */}
        {loadingInit ? <SkeletonGrid /> : events.length === 0 ? (
          <EmptyState category={activeCategory} search={search} onPost={openPostForm} />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map(ev => (
                <EventCard key={ev.id} event={ev}
                  onOpen={() => openDetail(ev)}
                  onPosterClick={ev.poster_url
                    ? (e) => { e.stopPropagation(); setPosterLightbox({ url: ev.poster_url!, title: ev.title }); }
                    : undefined}
                />
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
              <p className="text-center text-slate-600 text-xs py-4">All events shown 🎊</p>
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

function EventCard({ event: ev, onOpen, onPosterClick }: {
  event: Event;
  onOpen: () => void;
  onPosterClick?: (e: React.MouseEvent) => void;
}) {
  const style    = getCat(ev.category);
  const dateInfo = formatDate(ev.event_date);
  const days     = daysUntil(ev.event_date);

  return (
    <div onClick={onOpen}
      className={`group relative rounded-3xl border ${style.border} bg-gradient-to-br ${style.gradient} bg-[#13101f] overflow-hidden cursor-pointer
        transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${style.glow} hover:border-opacity-80`}>

      {/* Poster */}
      <div className="relative h-44 overflow-hidden bg-black/30">
        {ev.poster_url ? (
          <>
            <img src={ev.poster_url} alt={ev.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {/* Click-to-view overlay */}
            {onPosterClick && (
              <button onClick={onPosterClick}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25">
                <span className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-lg hover:bg-black/80 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                  View Poster
                </span>
              </button>
            )}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br ${style.gradient}`}>
            {CAT_ICON[ev.category] || "🎊"}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
            {CAT_ICON[ev.category]} {ev.category}
          </span>
          {days === 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500/90 text-white border border-red-400/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE TODAY
            </span>
          ) : days === 1 ? (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/90 text-black border border-amber-400/50 backdrop-blur-sm">TOMORROW</span>
          ) : days <= 3 ? (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/80 text-white border border-orange-400/50 backdrop-blur-sm">{days}d Left</span>
          ) : null}
        </div>

        {/* Date/time */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="text-xs font-bold text-white/90 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">📅 {dateInfo.label}</span>
          <span className="text-xs font-semibold text-white/80 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">⏰ {formatTime(ev.start_time)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        {ev.club_name && <p className="text-[11px] font-bold text-violet-300 uppercase tracking-wider truncate">{ev.club_name}</p>}
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-violet-200 transition-colors">{ev.title}</h3>
        {ev.description && <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{ev.description}</p>}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>📍</span><span className="truncate">{ev.venue}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[10px] text-slate-500">👁 {ev.views} views</span>
          {ev.registration_link && (
            <a href={ev.registration_link} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 transition-opacity shadow-md shadow-violet-500/20">
              Register →
            </a>
          )}
        </div>
      </div>

      {/* Top shimmer on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Poster Lightbox
   ────────────────────────────────────────────────────────────── */

function PosterLightbox({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md" onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-lg transition-colors">
        ✕
      </button>
      <a href={url} download target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
        className="absolute top-4 right-16 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-sm transition-colors"
        title="Download">⬇</a>
      <div className="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        <img src={url} alt={title}
          className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl select-none"
          style={{ boxShadow: "0 0 80px rgba(0,0,0,0.8)" }} draggable={false} />
        {title && <p className="text-white/70 text-sm text-center px-4 truncate max-w-full">{title}</p>}
      </div>
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/25 text-xs whitespace-nowrap">
        Tap outside or press Esc to close
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Event Detail Modal
   ────────────────────────────────────────────────────────────── */

function EventModal({ event: ev, onClose, onViewPoster }: {
  event: Event;
  onClose: () => void;
  onViewPoster: (url: string, title: string) => void;
}) {
  const style    = getCat(ev.category);
  const dateInfo = formatDate(ev.event_date);
  const days     = daysUntil(ev.event_date);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-0 sm:px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#130f22] shadow-2xl overflow-hidden">

        {/* Poster header */}
        <div className="relative h-52 flex-shrink-0 bg-black/30 group/poster">
          {ev.poster_url ? (
            <>
              <img src={ev.poster_url} alt={ev.title} className="w-full h-full object-cover" />
              <button
                onClick={() => onViewPoster(ev.poster_url!, ev.title)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity bg-black/30">
                <span className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                  View Full Poster
                </span>
              </button>
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br ${style.gradient}`}>
              {CAT_ICON[ev.category] || "🎊"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#130f22] via-black/20 to-transparent pointer-events-none" />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm z-10">
            ✕
          </button>
          {days === 0 && (
            <span className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full bg-red-500/90 text-white border border-red-400/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />HAPPENING TODAY
            </span>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap pointer-events-none">
            <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">📅 {dateInfo.label}</span>
            <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              ⏰ {formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ""}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${style.badge}`}>{CAT_ICON[ev.category]} {ev.category}</span>
            {ev.club_name && <span className="text-xs font-semibold text-violet-300 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">🏛️ {ev.club_name}</span>}
          </div>
          <h2 className="text-white font-black text-xl leading-snug">{ev.title}</h2>
          {ev.description && <p className="text-slate-300 text-sm leading-relaxed">{ev.description}</p>}

          <div className="rounded-2xl bg-white/[0.04] border border-white/10 divide-y divide-white/5">
            <DetailRow icon="📍" label="Venue"   value={ev.venue} />
            {ev.contact_name  && <DetailRow icon="👤" label="Contact"  value={ev.contact_name} />}
            {ev.contact_phone && <DetailRow icon="📞" label="Phone"    value={ev.contact_phone} isPhone />}
            <DetailRow icon="👁" label="Views"   value={`${ev.views} people viewed`} />
          </div>

          <div className="flex flex-col gap-3 pb-1">
            {ev.registration_link && (
              <a href={ev.registration_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity">
                🎟️ Register Now
              </a>
            )}
            {ev.google_maps_link && (
              <a href={ev.google_maps_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
                🗺️ View on Google Maps
              </a>
            )}
            {ev.contact_phone && (
              <a href={`tel:${ev.contact_phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
                📞 Call Organiser
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Post Event Modal Form
   ────────────────────────────────────────────────────────────── */

interface PostEventModalProps {
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  posterPreview: string;
  uploading: boolean;
  submitting: boolean;
  formError: string;
  onPosterPick: (file: File) => void;
  onRemovePoster: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

function PostEventModal({
  form, setForm, posterPreview, uploading, submitting, formError,
  onPosterPick, onRemovePoster, onSubmit, onClose,
}: PostEventModalProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  function field(key: keyof typeof EMPTY_FORM, value: string) {
    setForm({ ...form, [key]: value });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-0 sm:px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[95vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#130f22] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-white font-black text-xl">🎊 Post an Event</h2>
            <p className="text-slate-500 text-xs mt-0.5">Fill in the details — goes live immediately</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors">
            ✕
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {formError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {formError}
            </div>
          )}

          {/* Poster upload */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Event Poster</label>
            <div className="mt-2">
              {posterPreview ? (
                <div className="relative rounded-2xl overflow-hidden h-44">
                  <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={onRemovePoster}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-sm">
                    ✕
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
                        style={{ borderTopColor: "#a78bfa" }} />
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-black/20 h-36 cursor-pointer hover:border-violet-500/40 transition-colors">
                  <span className="text-3xl">📷</span>
                  <span className="text-sm text-slate-400">Click to upload poster</span>
                  <span className="text-xs text-slate-600">JPG / PNG / WebP · max 5 MB</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onPosterPick(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <FormField label="Event Title *">
            <input value={form.title} onChange={e => field("title", e.target.value)}
              placeholder="e.g. TechFest 2025 Grand Finale"
              className="form-input" />
          </FormField>

          {/* Category */}
          <FormField label="Category">
            <select value={form.category} onChange={e => field("category", e.target.value)} className="form-input">
              {Object.entries(CAT_ICON).map(([k, v]) => (
                <option key={k} value={k} className="bg-[#1a1025]">{v} {k}</option>
              ))}
            </select>
          </FormField>

          {/* Date + times */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Event Date *">
              <input type="date" value={form.event_date} min={today} onChange={e => field("event_date", e.target.value)}
                className="form-input [color-scheme:dark]" />
            </FormField>
            <FormField label="Start Time *">
              <input type="time" value={form.start_time} onChange={e => field("start_time", e.target.value)}
                className="form-input [color-scheme:dark]" />
            </FormField>
            <FormField label="End Time">
              <input type="time" value={form.end_time} onChange={e => field("end_time", e.target.value)}
                className="form-input [color-scheme:dark]" />
            </FormField>
            <FormField label="Club / Society">
              <input value={form.club_name} onChange={e => field("club_name", e.target.value)}
                placeholder="e.g. Coding Club"
                className="form-input" />
            </FormField>
          </div>

          {/* Venue */}
          <FormField label="Venue *">
            <input value={form.venue} onChange={e => field("venue", e.target.value)}
              placeholder="e.g. MITS Auditorium"
              className="form-input" />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <textarea value={form.description} onChange={e => field("description", e.target.value)}
              rows={3} placeholder="What's this event about?"
              className="form-input resize-none" />
          </FormField>

          {/* Optional links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Optional</p>
            <FormField label="Registration Link">
              <input value={form.registration_link} onChange={e => field("registration_link", e.target.value)}
                placeholder="https://forms.gle/..."
                className="form-input" />
            </FormField>
            <FormField label="Google Maps Link">
              <input value={form.google_maps_link} onChange={e => field("google_maps_link", e.target.value)}
                placeholder="https://maps.google.com/..."
                className="form-input" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Contact Name">
                <input value={form.contact_name} onChange={e => field("contact_name", e.target.value)}
                  placeholder="Organiser name"
                  className="form-input" />
              </FormField>
              <FormField label="Contact Phone">
                <input value={form.contact_phone} onChange={e => field("contact_phone", e.target.value)}
                  placeholder="+91 98765..."
                  className="form-input" />
              </FormField>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={submitting || uploading}
            className=" shrink-0 flex items-center gap-2
    px-5 py-2.5 rounded-2xl
    bg-gradient-to-r from-violet-500 to-pink-500
    text-white text-sm font-bold
    shadow-lg shadow-violet-500/30
    hover:opacity-90
    hover:scale-[1.03]
    active:scale-95
    transition-all duration-200
    cursor-pointer">
            {(submitting || uploading) && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {uploading ? "Uploading..." : submitting ? "Posting..." : "🎊 Post Event"}
          </button>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input::placeholder { color: rgba(148,163,184,0.5); }
        .form-input:focus { border-color: rgba(139,92,246,0.5); }
        .form-input option { background: #1a1025; }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Shared sub-components
   ────────────────────────────────────────────────────────────── */

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function DetailRow({ icon, label, value, isPhone = false }: {
  icon: string; label: string; value: string; isPhone?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {isPhone
          ? <a href={`tel:${value}`} className="text-sm text-violet-300 hover:text-violet-200 transition-colors">{value}</a>
          : <p className="text-sm text-white/85 mt-0.5 leading-snug">{value}</p>
        }
      </div>
    </div>
  );
}

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
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ category, search, onPost }: { category: string; search: string; onPost: () => void }) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">{search ? "🔍" : category !== "All" ? CAT_ICON[category] || "🎊" : "🎊"}</div>
      <p className="text-white font-semibold text-lg">
        {search ? `No events matching "${search}"` : category !== "All" ? `No ${category} events right now` : "No upcoming events"}
      </p>
      <p className="text-slate-500 text-sm">Be the first to post one!</p>
      <button onClick={onPost}
        className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity">
        ＋ Post an Event
      </button>
    </div>
  );
}
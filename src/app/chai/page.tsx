"use client";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  branch: string | null;
  year: string | null;
  image_url: string | null;
  open_for_chai: boolean | null;
};

type ChaiSession = {
  id: string;
  user1_id: string;
  user2_id: string;
  type: string;
  status: string;
  initiated_by: string | null;
  expires_at: string | null;
  sender?: {
    full_name: string | null;
    branch: string | null;
    year: string | null;
    image_url: string | null;
  };
  // Buddy profile fetched separately for active sessions
  buddy?: Profile | null;
};

type ChaiMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

// ── Chat panel — floats bottom-right ──
function ChaiChatPanel({
  session,
  userId,
  onClose,
}: {
  session: ChaiSession;
  userId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChaiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const buddy = session.buddy;
  const buddyName = buddy?.full_name || "Chai Buddy";
  const buddyImg  = buddy?.image_url  || null;

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`chat-${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chai_messages", filter: `session_id=eq.${session.id}` },
        (payload) => {
          setMessages((prev) =>
            prev.find((m) => m.id === payload.new.id) ? prev : [...prev, payload.new as ChaiMessage]
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const { data } = await supabase
      .from("chai_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const temp: ChaiMessage = {
      id: `temp-${Date.now()}`,
      session_id: session.id,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    const { data, error } = await supabase
      .from("chai_messages")
      .insert({ session_id: session.id, sender_id: userId, content })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? data : m)));
    }
    setSending(false);
  }

  return (
    <div
      className="fixed bottom-20 right-4 md:right-8 z-50 w-[340px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
      style={{
        maxHeight: "480px",
        background: "#13102a",
        borderColor: "rgba(251,146,60,0.25)",
        boxShadow: "0 8px 40px rgba(251,146,60,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10"
        style={{ background: "linear-gradient(90deg,rgba(251,146,60,0.12),rgba(245,158,11,0.08))" }}
      >
        <div className="flex items-center gap-3">
          {buddyImg ? (
            <img src={buddyImg} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-amber-400/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-base">☕</div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">{buddyName}</p>
            <p className="text-amber-300 text-xs">Decide where to meet ☕</p>
             <p className="text-gray-400 text-xs">
              
                Note: Chats are not encrypted.
              </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none transition-colors">✕</button>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: "270px", maxHeight: "320px" }}>
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-10">
            Say hi! Pick a spot for chai ☕
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          const isTemp = msg.id.startsWith("temp-");
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm break-words ${
                  isMine
                    ? "text-white rounded-br-sm"
                    : "bg-white/10 text-slate-200 rounded-bl-sm"
                } ${isTemp ? "opacity-60" : ""}`}
                style={isMine ? { background: "linear-gradient(135deg,#f59e0b,#ea580c)" } : undefined}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 py-3 border-t border-white/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Suggest a venue..."
          className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm placeholder:text-slate-500 outline-none focus:border-amber-400/40 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="px-3 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function ChaiPage() {
  const [userId, setUserId]                   = useState("");
  const [loading, setLoading]                 = useState(true);
  const [openForChai, setOpenForChai]         = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Profile[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<ChaiSession[]>([]);
  const [activeSessions, setActiveSessions]   = useState<ChaiSession[]>([]);
  const [sentInvites, setSentInvites]         = useState<string[]>([]);
  const [activeChat, setActiveChat]           = useState<ChaiSession | null>(null);
  const [matching, setMatching]               = useState(false);

  const uidRef = useRef("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    uidRef.current = user.id;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles").select("open_for_chai").eq("id", user.id).single();
    setOpenForChai(profile?.open_for_chai || false);

    await Promise.all([
      fetchAvailableStudents(user.id),
      fetchIncomingInvites(user.id),
      fetchActiveSessions(user.id),
    ]);
    setLoading(false);

    const channel = supabase
      .channel("chai-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "chai_sessions" }, () => {
        fetchIncomingInvites(uidRef.current);
        fetchActiveSessions(uidRef.current);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        fetchAvailableStudents(uidRef.current);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  async function fetchAvailableStudents(uid: string) {
    const { data } = await supabase.from("profiles").select("*").eq("open_for_chai", true);
    setAvailableStudents((data || []).filter((u) => u.id !== uid));
  }

  async function fetchIncomingInvites(uid: string) {
    const { data } = await supabase
      .from("chai_sessions")
      .select(`*, sender:profiles!chai_sessions_user1_id_fkey(id,full_name,branch,year,image_url)`)
      .eq("user2_id", uid)
      .eq("status", "pending");

    const valid = (data || []).filter(
      (i) => i.expires_at && new Date(i.expires_at) > new Date()
    );
    setIncomingInvites(valid);
  }

  // Fetch active sessions AND join the buddy profile so we can show name/avatar
  async function fetchActiveSessions(uid: string) {
    const { data } = await supabase
      .from("chai_sessions")
      .select("*")
      .eq("status", "accepted");

    const mine = (data || []).filter((s) => s.user1_id === uid || s.user2_id === uid);

    // For each session, fetch the OTHER person's profile
    const withBuddy: ChaiSession[] = await Promise.all(
      mine.map(async (session) => {
        const buddyId = session.user1_id === uid ? session.user2_id : session.user1_id;
        const { data: buddyProfile } = await supabase
          .from("profiles")
          .select("id,full_name,branch,year,image_url,open_for_chai")
          .eq("id", buddyId)
          .single();
        return { ...session, buddy: buddyProfile || null };
      })
    );

    setActiveSessions(withBuddy);

    // If a session just appeared (e.g., someone accepted our invite), auto-open its chat
    if (withBuddy.length > 0) {
      setActiveChat((prev) => {
        // Only auto-open if nothing is open yet
        if (prev) return prev;
        return withBuddy[0];
      });
    }
  }

  async function toggleOpenForChai() {
    const next = !openForChai;
    setOpenForChai(next);
    const { error } = await supabase
      .from("profiles").update({ open_for_chai: next }).eq("id", userId);
    if (error) setOpenForChai(!next);
  }

  async function sendInvite(receiverId: string) {
    setSentInvites((prev) => [...prev, receiverId]);

    const { data: existing } = await supabase
      .from("chai_sessions")
      .select("*")
      .or(`and(user1_id.eq.${userId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${userId})`)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted") {
        await fetchActiveSessions(userId); // ensure buddy info is loaded
        setActiveSessions((prev) => {
          const found = prev.find((s) => s.id === existing.id);
          if (found) setActiveChat(found);
          return prev;
        });
      }
      return;
    }

    const { error } = await supabase.from("chai_sessions").insert({
      user1_id: userId, user2_id: receiverId,
      initiated_by: userId, type: "invite", status: "pending",
    });
    if (error) {
      setSentInvites((prev) => prev.filter((id) => id !== receiverId));
      alert(error.message);
    }
  }

  async function randomMatch() {
    if (availableStudents.length === 0) { alert("No students available right now ☕"); return; }
    setMatching(true);

    const random = availableStudents[Math.floor(Math.random() * availableStudents.length)];

    const { data: existing } = await supabase
      .from("chai_sessions")
      .select("*")
      .or(`and(user1_id.eq.${userId},user2_id.eq.${random.id}),and(user1_id.eq.${random.id},user2_id.eq.${userId})`)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    if (existing) {
      const session = existing.status === "accepted" ? existing : await (async () => {
        const { data } = await supabase.from("chai_sessions").update({ status: "accepted" }).eq("id", existing.id).select().single();
        return data;
      })();
      setMatching(false);
      await fetchActiveSessions(userId);
      setActiveSessions((prev) => {
        const found = prev.find((s) => s.id === session?.id);
        if (found) setActiveChat(found);
        return prev;
      });
      return;
    }

    const { data, error } = await supabase
      .from("chai_sessions")
      .insert({ user1_id: userId, user2_id: random.id, initiated_by: userId, type: "random", status: "accepted" })
      .select().single();

    setMatching(false);
    if (error) { alert(error.message); return; }
    await fetchActiveSessions(userId);
    setActiveSessions((prev) => {
      const found = prev.find((s) => s.id === data.id);
      if (found) setActiveChat(found);
      return prev;
    });
  }

  async function acceptInvite(sessionId: string) {
    await supabase.from("chai_sessions").update({ status: "accepted" }).eq("id", sessionId);
    setIncomingInvites((prev) => prev.filter((i) => i.id !== sessionId));
    await fetchActiveSessions(userId);
    // Open chat for the just-accepted session
    setActiveSessions((prev) => {
      const found = prev.find((s) => s.id === sessionId);
      if (found) setActiveChat(found);
      return prev;
    });
  }

  async function rejectInvite(sessionId: string) {
    await supabase.from("chai_sessions").update({ status: "rejected" }).eq("id", sessionId);
    setIncomingInvites((prev) => prev.filter((i) => i.id !== sessionId));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "#f59e0b", borderRightColor: "#ea580c" }} />
            <p className="text-sm font-semibold"
              style={{ background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Brewing your chai...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-36">

        {/* ── Header + toggle ── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8"
          style={{ background: "linear-gradient(135deg,rgba(251,146,60,0.12),rgba(245,158,11,0.08),rgba(234,88,12,0.10))" }}
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(251,146,60,0.10)" }} />
          <h1 className="text-3xl font-bold"
            style={{ background: "linear-gradient(90deg,#fbbf24,#f97316,#ea580c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
           🫖 Chai Connect
          </h1>
          <p className="text-slate-400 mt-2">Meet new students over chai.</p>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/[0.05] border border-white/10 px-5 py-4">
            <div>
              <p className="text-white font-semibold">Open For Chai</p>
              <p className="text-slate-400 text-sm mt-0.5">Let others see &amp; invite you</p>
            </div>
            <button
              onClick={toggleOpenForChai}
              className="relative w-14 h-7 rounded-full transition-colors duration-300"
              style={{ background: openForChai ? "#f59e0b" : "rgba(255,255,255,0.10)" }}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${openForChai ? "translate-x-7" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* ── Incoming Invites ── */}
        {incomingInvites.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4"
              style={{ background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🔔 Incoming Invites ({incomingInvites.length})
            </h2>
            <div className="space-y-3">
              {incomingInvites.map((invite) => (
                <div key={invite.id} className="rounded-3xl border p-5"
                  style={{ background: "rgba(251,146,60,0.06)", borderColor: "rgba(251,146,60,0.20)" }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {invite.sender?.image_url ? (
                      <img src={invite.sender.image_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/30 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>☕</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold truncate">{invite.sender?.full_name || "A student"}</p>
                      <p className="text-slate-400 text-sm">{invite.sender?.branch} • Year {invite.sender?.year}</p>
                      <p className="text-amber-300 text-xs mt-1">invited you for chai ☕ · expires in 30 min</p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => acceptInvite(invite.id)}
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
                      >
                        Accept ☕
                      </button>
                      <button
                        onClick={() => rejectInvite(invite.id)}
                        className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-sm hover:bg-white/15 transition-colors"
                      >
                        Not Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Sessions — show buddy info + continue chat ── */}
        {activeSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4"
              style={{ background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🟠 Active Chai Sessions
            </h2>
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const buddy = session.buddy;
                const isOpen = activeChat?.id === session.id;
                return (
                  <div key={session.id} className="rounded-3xl border p-5"
                    style={{
                      background: isOpen ? "rgba(251,146,60,0.10)" : "rgba(251,146,60,0.05)",
                      borderColor: isOpen ? "rgba(251,146,60,0.35)" : "rgba(251,146,60,0.15)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        {buddy?.image_url ? (
                          <img src={buddy.image_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/30 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                            style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>☕</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">
                            {buddy?.full_name || "Chai Buddy"}
                          </p>
                          <p className="text-slate-400 text-sm truncate">
                            {buddy?.branch}{buddy?.year ? ` • Year ${buddy.year}` : ""}
                          </p>
                          <p className="text-amber-300 text-xs mt-0.5 capitalize">
                            {session.type} match · planning venue
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveChat(isOpen ? null : session)}
                        className="px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                        style={{ background: isOpen ? "rgba(255,255,255,0.10)" : "linear-gradient(135deg,#f59e0b,#ea580c)" }}
                      >
                        {isOpen ? "✓ Chat Open" : "💬 Continue Chat"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Random Match ── */}
        <div className="rounded-3xl border p-6"
          style={{ background: "rgba(251,146,60,0.07)", borderColor: "rgba(251,146,60,0.18)" }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-white">🎲 Random Chai Match</h2>
              <p className="text-slate-400 mt-1 text-sm">Get instantly matched with a random student open for chai.</p>
              <p className="text-amber-300 text-sm mt-1">
                {availableStudents.length} student{availableStudents.length !== 1 ? "s" : ""} available right now
              </p>
            </div>
            <button
              onClick={randomMatch}
              disabled={matching || availableStudents.length === 0}
              className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
            >
              {matching ? "Finding..." : "Find Match ☕"}
            </button>
          </div>
        </div>

        {/* ── Available Students ── */}
        <div>
          <h2 className="text-xl font-bold mb-4"
            style={{ background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ☕ Available For Chai ({availableStudents.length})
          </h2>

          {availableStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-4xl mb-3">☕</p>
              <p>No one's open for chai right now.</p>
              <p className="text-sm mt-1">Turn on your status above to be discoverable!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {availableStudents.map((student) => {
                const alreadySent = sentInvites.includes(student.id);
                return (
                  <div key={student.id} className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={student.image_url || "/default-avatar.png"}
                          alt={student.full_name || "Student"}
                          className="w-12 h-12 rounded-full object-cover object-top border-2 border-white/10"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#120d25]"
                          style={{ background: "#f59e0b" }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{student.full_name}</h3>
                        <p className="text-slate-400 text-xs truncate">{student.branch} • Year {student.year}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendInvite(student.id)}
                      disabled={alreadySent}
                      className={`mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-opacity ${
                        alreadySent ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed" : "text-white hover:opacity-90"
                      }`}
                      style={alreadySent ? undefined : { background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
                    >
                      {alreadySent ? "Invite Sent ✓" : "Invite for Chai ☕"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Floating chat panel ── */}
      {activeChat && (
        <ChaiChatPanel
          session={activeChat}
          userId={userId}
          onClose={() => setActiveChat(null)}
        />
      )}
    </DashboardLayout>
  );
}
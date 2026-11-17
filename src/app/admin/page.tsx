 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, RefreshCw, ShieldCheck, Clock3, XCircle, ExternalLink,
  UserRound, GraduationCap, CalendarDays, Mail, Image as ImageIcon,
  CheckCircle2, Ban, LoaderCircle, LockKeyhole,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type VerificationStatus = "pending" | "approved" | "rejected";
type StatusFilter = "all" | VerificationStatus;

type SeniorVerification = {
  id: string;
  full_name: string;
  email: string;
  branch: string;
  passing_year: string;
  bio: string | null;
  interests: string | null;
  image_url: string | null;
  id_card_url: string;
  verification_status: VerificationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

const tabs: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const statusStyles: Record<VerificationStatus, string> = {
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  rejected: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

export default function SeniorVerificationsPage() {
  const [records, setRecords] = useState<SeniorVerification[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [selected, setSelected] = useState<SeniorVerification | null>(null);
  const [rejecting, setRejecting] = useState<SeniorVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const checkAdmin = useCallback(async () => {
    setError("");
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      setIsAdmin(false);
      setError("Admin page dekhne ke liye pehle login karo.");
      setAccessChecked(true);
      setLoading(false);
      return false;
    }

    const { data: profile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (roleError || profile?.role !== "admin") {
      setIsAdmin(false);
      setError("Access denied: is page ke liye admin role required hai.");
      setAccessChecked(true);
      setLoading(false);
      return false;
    }

    setIsAdmin(true);
    setAccessChecked(true);
    return true;
  }, []);

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    setNotice("");

    try {
      const allowed = await checkAdmin();
      if (!allowed) return;

      const { data, error: fetchError } = await supabase
        .from("senior_verifications")
        .select(
          "id, full_name, email, branch, passing_year, bio, interests, image_url, id_card_url, verification_status, submitted_at, reviewed_at, rejection_reason"
        )
        .order("submitted_at", { ascending: false });

      if (fetchError) throw fetchError;
      setRecords((data ?? []) as SeniorVerification[]);
    } catch (err) {
      console.error("Senior verification fetch failed:", err);
      setError(
        "Data fetch nahi hua. senior_verifications ke SELECT RLS policy, table name aur permissions check karo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkAdmin]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const counts = useMemo(() => ({
    all: records.length,
    pending: records.filter((r) => r.verification_status === "pending").length,
    approved: records.filter((r) => r.verification_status === "approved").length,
    rejected: records.filter((r) => r.verification_status === "rejected").length,
  }), [records]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = filter === "all" || record.verification_status === filter;
      const matchesSearch =
        !term ||
        record.full_name.toLowerCase().includes(term) ||
        record.email.toLowerCase().includes(term) ||
        record.branch.toLowerCase().includes(term) ||
        record.passing_year.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [records, filter, search]);

  const approveSenior = async (record: SeniorVerification) => {
    if (record.verification_status !== "pending") return;
    const confirmed = window.confirm(
      `Approve ${record.full_name}? Iske profile details profiles table mein copy honge.`
    );
    if (!confirmed) return;

    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      // RPC does the profile upsert + status update as one database transaction.
      const { error: rpcError } = await supabase.rpc("approve_senior_verification", {
        p_senior_id: record.id,
      });
      if (rpcError) throw rpcError;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? { ...r, verification_status: "approved", reviewed_at: new Date().toISOString() }
            : r
        )
      );
      setSelected((prev) =>
        prev?.id === record.id
          ? { ...prev, verification_status: "approved", reviewed_at: new Date().toISOString() }
          : prev
      );
      setNotice(`${record.full_name} approved. Profile data profiles table mein copy ho gaya.`);
    } catch (err) {
      console.error("Senior approval failed:", err);
      setError(
        "Approve nahi hua. SQL RPC function install hai aur current user admin hai, ye check karo."
      );
    } finally {
      setBusyId(null);
    }
  };

  const rejectSenior = async () => {
    if (!rejecting || rejecting.verification_status !== "pending") return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Reject karne se pehle reason enter karo.");
      return;
    }

    setBusyId(rejecting.id);
    setError("");
    setNotice("");
    try {
      const { error: rpcError } = await supabase.rpc("reject_senior_verification", {
        p_senior_id: rejecting.id,
        p_reason: reason,
      });
      if (rpcError) throw rpcError;

      const updatedAt = new Date().toISOString();
      setRecords((prev) =>
        prev.map((r) =>
          r.id === rejecting.id
            ? { ...r, verification_status: "rejected", reviewed_at: updatedAt, rejection_reason: reason }
            : r
        )
      );
      setSelected((prev) =>
        prev?.id === rejecting.id
          ? { ...prev, verification_status: "rejected", reviewed_at: updatedAt, rejection_reason: reason }
          : prev
      );
      setNotice(`${rejecting.full_name} ki verification reject kar di gayi.`);
      setRejecting(null);
      setRejectReason("");
    } catch (err) {
      console.error("Senior rejection failed:", err);
      setError(
        "Reject nahi hua. SQL RPC function install hai aur current user admin hai, ye check karo."
      );
    } finally {
      setBusyId(null);
    }
  };

  if (accessChecked && !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090711] px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-rose-400/20 bg-[#12101d] p-8 text-center">
          <LockKeyhole className="mx-auto mb-4 text-rose-300" size={38} />
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="mt-3 text-sm text-white/55">{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-6 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold hover:bg-purple-400"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090711] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-purple-300">
              <ShieldCheck size={17} />
              MITS-Mate / Administration
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                Admin verified
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Senior <span className="text-purple-400">Verification</span>
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Review registration details and inspect submitted MITS ID cards.
            </p>
          </div>
          <button
            onClick={() => void fetchRecords(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm transition hover:bg-white/10 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh data
          </button>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total applications", value: counts.all, icon: UserRound },
            { label: "Awaiting review", value: counts.pending, icon: Clock3 },
            { label: "Approved", value: counts.approved, icon: ShieldCheck },
            { label: "Rejected", value: counts.rejected, icon: XCircle },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-white/[0.08] bg-[#12101d] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/50 sm:text-sm">{item.label}</span>
                  <Icon size={18} className="text-purple-300" />
                </div>
                <p className="mt-4 text-3xl font-semibold">{item.value}</p>
              </motion.div>
            );
          })}
        </section>

        {error && (
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">
            {error}
            <button onClick={() => void fetchRecords()} className="ml-2 underline">Try again</button>
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12101d]">
          <div className="space-y-4 border-b border-white/[0.07] p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    filter === tab.value
                      ? "bg-purple-500 text-white"
                      : "bg-white/[0.04] text-white/55 hover:bg-white/[0.08]"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 opacity-70">{counts[tab.value]}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, branch or passing year..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/30 focus:border-purple-400/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <ImageIcon className="mx-auto mb-3 text-white/25" size={34} />
              <h2 className="font-semibold">No applications found</h2>
              <p className="mt-2 text-sm text-white/40">
                {search ? "Try another search." : "Applications matching this filter will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
              {filteredRecords.map((record) => (
                <article
                  key={record.id}
                  className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0b16] transition hover:border-purple-400/30"
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-lg font-bold text-purple-200">
                        {record.full_name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{record.full_name}</h2>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/45">
                          <Mail size={13} /> {record.email}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[record.verification_status]}`}>
                      {record.verification_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                    <div className="rounded-xl bg-white/[0.035] p-3">
                      <p className="flex items-center gap-1.5 text-xs text-white/40"><GraduationCap size={14} /> Branch</p>
                      <p className="mt-1 text-sm font-medium">{record.branch}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.035] p-3">
                      <p className="flex items-center gap-1.5 text-xs text-white/40"><CalendarDays size={14} /> Passing year</p>
                      <p className="mt-1 text-sm font-medium">{record.passing_year}</p>
                    </div>
                  </div>

                  <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {record.id_card_url ? (
                      <a href={record.id_card_url} target="_blank" rel="noreferrer" className="group relative block" title="Open ID card in a new tab">
                        <img src={record.id_card_url} alt={`ID card submitted by ${record.full_name}`} loading="lazy" className="h-48 w-full object-contain p-2 transition group-hover:opacity-80" />
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/80 px-2.5 py-1.5 text-xs">
                          <ExternalLink size={13} /> Open full image
                        </span>
                      </a>
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 text-sm text-rose-300">
                        <ImageIcon size={25} /> ID card URL missing
                      </div>
                    )}
                  </div>

                  {(record.bio || record.interests) && (
                    <div className="space-y-2 px-4 pb-4 text-sm">
                      {record.bio && <p className="text-white/65"><span className="text-white/35">Bio: </span>{record.bio}</p>}
                      {record.interests && <p className="text-white/65"><span className="text-white/35">Interests: </span>{record.interests}</p>}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3">
                    <span className="text-xs text-white/35">
                      Submitted {record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : "—"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setSelected(record)} className="rounded-lg border border-purple-400/25 px-3 py-2 text-xs font-medium text-purple-200 transition hover:bg-purple-500/10">
                        View details
                      </button>
                      {record.verification_status === "pending" && (
                        <>
                          <button disabled={busyId === record.id} onClick={() => void approveSenior(record)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50">
                            {busyId === record.id ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                          </button>
                          <button disabled={busyId === record.id} onClick={() => { setRejecting(record); setRejectReason(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
                            <Ban size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {record.rejection_reason && record.verification_status === "rejected" && (
                    <p className="px-4 pb-4 text-xs text-rose-200/70">Reason: {record.rejection_reason}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div role="dialog" aria-modal="true" aria-label="Senior application details" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#12101d] p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Application details</h2>
                  <p className="mt-1 text-sm text-white/45">{selected.full_name}</p>
                </div>
                <button onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-2 text-white/60 hover:bg-white/10"><XCircle size={21} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Full name", selected.full_name],
                  ["Email", selected.email],
                  ["Branch", selected.branch],
                  ["Passing year", selected.passing_year],
                  ["Status", selected.verification_status],
                  ["Submitted", selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-xs text-white/40">{label}</p>
                    <p className="mt-1 break-words text-sm">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {selected.bio && <p className="mt-4 text-sm text-white/65"><span className="text-white/40">Bio: </span>{selected.bio}</p>}
              {selected.interests && <p className="mt-2 text-sm text-white/65"><span className="text-white/40">Interests: </span>{selected.interests}</p>}
              <h3 className="mb-3 mt-6 font-semibold">Submitted MITS ID card</h3>
              {selected.id_card_url ? (
                <a href={selected.id_card_url} target="_blank" rel="noreferrer" className="block">
                  <img src={selected.id_card_url} alt="Senior MITS ID card" className="max-h-[55vh] w-full rounded-xl border border-white/10 bg-black/30 object-contain" />
                  <span className="mt-2 inline-flex items-center gap-2 text-sm text-purple-300">Open original image <ExternalLink size={15} /></span>
                </a>
              ) : <p className="text-sm text-rose-300">ID card URL is missing.</p>}
              {selected.rejection_reason && <p className="mt-4 text-sm text-rose-200">Rejection reason: {selected.rejection_reason}</p>}
              {selected.verification_status === "pending" && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button disabled={busyId === selected.id} onClick={() => void approveSenior(selected)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
                    <CheckCircle2 size={16} /> Approve & copy profile
                  </button>
                  <button onClick={() => { setRejecting(selected); setRejectReason(""); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/25">
                    <Ban size={16} /> Reject
                  </button>
                </div>
              )}
              <button onClick={() => setSelected(null)} className="mt-4 w-full rounded-xl bg-white/[0.07] px-4 py-3 text-sm hover:bg-white/10">Close</button>
            </div>
          </div>
        )}

        {rejecting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => { setRejecting(null); setRejectReason(""); }}>
            <div role="dialog" aria-modal="true" aria-label="Reject senior verification" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12101d] p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold">Reject application</h2>
              <p className="mt-2 text-sm text-white/55">Reason for rejecting {rejecting.full_name}</p>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} placeholder="e.g. ID card details are unclear..." className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-purple-400/50" />
              <div className="mt-4 flex gap-3">
                <button onClick={() => { setRejecting(null); setRejectReason(""); }} className="flex-1 rounded-xl bg-white/[0.07] px-4 py-3 text-sm hover:bg-white/10">Cancel</button>
                <button disabled={!rejectReason.trim() || busyId === rejecting.id} onClick={() => void rejectSenior()} className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50">Confirm reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

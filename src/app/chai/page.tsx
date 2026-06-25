"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
};

export default function ChaiPage() {
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(true);

  const [openForChai, setOpenForChai] =
    useState(false);

  const [availableStudents, setAvailableStudents] =
    useState<Profile[]>([]);

  const [incomingInvites, setIncomingInvites] =
    useState<ChaiSession[]>([]);

  const [activeSessions, setActiveSessions] =
    useState<ChaiSession[]>([]);

  // ----------------------------------
  // Current User
  // ----------------------------------

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("open_for_chai")
      .eq("id", user.id)
      .single();

    if (data) {
      setOpenForChai(
        data.open_for_chai || false
      );
    }
  };

  // ----------------------------------
  // Available Students
  // ----------------------------------

  const loadAvailableStudents =
    async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("open_for_chai", true);

      if (!data) return;

      const filtered = data.filter(
        (u) => u.id !== userId
      );

      setAvailableStudents(filtered);
    };

  // ----------------------------------
  // Incoming Invites
  // ----------------------------------

  const loadIncomingInvites =
    async () => {
      const { data } = await supabase
  .from("chai_sessions")
  .select(`
    *,
    sender:profiles!chai_sessions_user1_id_fkey (
      full_name,
      branch,
      year,
      image_url
    )
  `)
  .eq("user2_id", userId)
  .eq("status", "pending");
      if (!data) return;

      const validInvites = data.filter(
        (invite) =>
          invite.expires_at &&
          new Date(invite.expires_at) >
            new Date()
      );

      setIncomingInvites(validInvites);
    };

  // ----------------------------------
  // Active Sessions
  // ----------------------------------

  const loadActiveSessions =
    async () => {
      const { data } = await supabase
        .from("chai_sessions")
        .select("*")
        .eq("status", "accepted");

      if (!data) return;

      const sessions = data.filter(
        (s) =>
          s.user1_id === userId ||
          s.user2_id === userId
      );

      setActiveSessions(sessions);
    };

  // ----------------------------------
  // Toggle Open For Chai
  // ----------------------------------

  const toggleOpenForChai =
    async () => {
      const nextValue = !openForChai;

      await supabase
        .from("profiles")
        .update({
          open_for_chai: nextValue,
        })
        .eq("id", userId);

      setOpenForChai(nextValue);
    };

  // ----------------------------------
  // Send Invite
  // ----------------------------------

  const sendInvite = async (
    receiverId: string
  ) => {
    if (!userId) return;

    const { error } = await supabase
      .from("chai_sessions")
      .insert({
        user1_id: userId,
        user2_id: receiverId,
        initiated_by: userId,
        type: "invite",
        status: "pending",
      });

    if (!error) {
      alert("☕ Invite Sent");
    }
  };

  // ----------------------------------
  // Random Match
  // ----------------------------------

  const randomMatch = async () => {
    if (
      availableStudents.length === 0
    ) {
      alert(
        "No students available right now ☕"
      );
      return;
    }

    const random =
      availableStudents[
        Math.floor(
          Math.random() *
            availableStudents.length
        )
      ];

    const { data, error } =
      await supabase
        .from("chai_sessions")
        .insert({
          user1_id: userId,
          user2_id: random.id,
          initiated_by: userId,
          type: "random",
          status: "accepted",
        })
        .select()
        .single();

    if (error) {
      console.error(error);
      return;
    }

    window.location.href =
      `/chai/${data.id}`;
  };
    // ----------------------------------
  // Accept Invite
  // ----------------------------------

  const acceptInvite = async (
    sessionId: string
  ) => {
    await supabase
      .from("chai_sessions")
      .update({
        status: "accepted",
      })
      .eq("id", sessionId);

    loadIncomingInvites();
    loadActiveSessions();
  };

  // ----------------------------------
  // Reject Invite
  // ----------------------------------

  const rejectInvite = async (
    sessionId: string
  ) => {
    await supabase
      .from("chai_sessions")
      .update({
        status: "rejected",
        is_active: false,
      })
      .eq("id", sessionId);

    loadIncomingInvites();
  };

  // ----------------------------------
  // Initial Load
  // ----------------------------------

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("open_for_chai")
          .eq("id", user.id)
          .single();

      if (profile) {
        setOpenForChai(
          profile.open_for_chai || false
        );
      }

      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (!userId) return;

    loadAvailableStudents();
    loadIncomingInvites();
    loadActiveSessions();
  }, [userId]);

  // ----------------------------------
  // Realtime
  // ----------------------------------

  useEffect(() => {
    const channel = supabase
      .channel("chai-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chai_sessions",
        },
        () => {
          loadIncomingInvites();
          loadActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ----------------------------------
  // Loading
  // ----------------------------------

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-2xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(90deg,#a78bfa,#ec4899,#fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  // ----------------------------------
  // UI
  // ----------------------------------

  return (
    <DashboardLayout>

      <div className="p-6 max-w-6xl mx-auto">

        {/* HEADER */}

        <h1 className="text-3xl font-bold text-white">
          ☕ Chai Connect
        </h1>

        <p className="text-white/60 mt-2">
          Meet new students over chai.
        </p>

        {/* TOGGLE */}

        <div className="mt-6 bg-[#17122b] rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-white font-semibold">
                Open For Chai
              </h2>

              <p className="text-white/50 text-sm">
                Let others invite you.
              </p>
            </div>

            <button
              onClick={toggleOpenForChai}
              className={`px-5 py-2 rounded-xl font-medium ${
                openForChai
                  ? "bg-green-500"
                  : "bg-orange-800"
              }`}
            >
              {openForChai
                ? "ON"
                : "OFF"}
            </button>

          </div>

        </div>

        {/* RANDOM MATCH */}

        <div className="mt-6 bg-[#17122b] rounded-2xl p-5">

          <h2 className="text-white font-semibold text-xl">
            🎲 Random Chai Match
          </h2>

          <p className="text-white/50 mt-2">
            Get matched with a random
            student open for chai.
          </p>

          <button
            onClick={randomMatch}
            className="
              mt-4
              bg-orange-500
              hover:bg-orange-600
              px-5
              py-3
              rounded-xl
              text-white
            "
          >
            Find Match ☕
          </button>

        </div>

        {/* AVAILABLE */}

        <div className="mt-8">

          <h2 className="text-white text-2xl font-bold mb-4">
            Available For Chai
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            {availableStudents.map(
              (student) => (
                <div
                  key={student.id}
                  className="
                    bg-[#17122b]
                    rounded-2xl
                    p-4
                  "
                >

                  <div className="flex gap-4">

                    <img
                      src={
                        student.image_url ||
                        "https://ui-avatars.com/api/?name=Student"
                      }
                      className="
                        w-14
                        h-14
                        rounded-full
                      "
                    />

                    <div>

                      <h3 className="text-white font-semibold">
                        {
                          student.full_name
                        }
                      </h3>

                      <p className="text-white/50 text-sm">
                        {
                          student.branch
                        }{" "}
                        • Year{" "}
                        {
                          student.year
                        }
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      sendInvite(
                        student.id
                      )
                    }
                    className="
                      mt-4
                      bg-orange-500
                      px-4
                      py-2
                      rounded-xl
                      text-white
                    "
                  >
                    Invite ☕
                  </button>

                </div>
              )
            )}

          </div>

        </div>

        {/* INCOMING */}

        <div className="mt-10">

          <h2 className="text-white text-2xl font-bold mb-4">
            Incoming Invites
          </h2>

          <div className="space-y-4">

            {incomingInvites.map(
              (invite) => (
                <div
                  key={invite.id}
                  className="
                    bg-[#17122b]
                    rounded-2xl
                    p-4
                  "
                >

                 <div className="flex gap-3 items-center">

                        <img
                          src={
                            invite.sender?.image_url ||
                            "https://ui-avatars.com/api/?name=Student"
                          }
                          className="w-12 h-12 rounded-full object-cover"
                        />

                        <div>

                      <p className="text-white font-semibold">
                        {invite.sender?.full_name || "Student"}
                      </p>

                      <p className="text-white/50 text-sm">
                        {invite.sender?.branch} • Year {invite.sender?.year}
                      </p>

                      <p className="text-yellow-400 text-sm mt-1">
                        invited you for chai ☕
                      </p>

                    </div>

                  </div> 

                  <p className="text-yellow-400 text-sm mt-2">
                    Invite expires
                    in 30 minutes
                  </p>

                  <div className="flex gap-3 mt-4">

                    <button
                      onClick={() =>
                        acceptInvite(
                          invite.id
                        )
                      }
                      className="
                        bg-green-500
                        px-4
                        py-2
                        rounded-xl
                      "
                    >
                      Accept ☕
                    </button>

                    <button
                      onClick={() =>
                        rejectInvite(
                          invite.id
                        )
                      }
                      className="
                        bg-red-500
                        px-4
                        py-2
                        rounded-xl
                      "
                    >
                      Not Now
                    </button>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* ACTIVE */}

        <div className="mt-10">

          <h2 className="text-white text-2xl font-bold mb-4">
            Active Chai Sessions
          </h2>

          <div className="space-y-4">

            {activeSessions.map(
              (session) => (
                <div
                  key={session.id}
                  className="
                    bg-[#17122b]
                    rounded-2xl
                    p-4
                    flex
                    justify-between
                    items-center
                  "
                >

                  <div>

                    <h3 className="text-white">
                      ☕ Chai Session
                    </h3>

                    <p className="text-white/50 text-sm">
                      {
                        session.type
                      }
                    </p>

                  </div>

                  <Link
                    href={`/chai/${session.id}`}
                    className="
                      bg-purple-600
                      px-4
                      py-2
                      rounded-xl
                      text-white
                    "
                  >
                    Open Chat
                  </Link>

                </div>
              )
            )}

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}
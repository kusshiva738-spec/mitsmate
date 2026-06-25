"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

type Chat = {
  id: string;
  user1_id: string;
  user2_id: string;
  message_count: number;
  is_completed: boolean;
};

type Profile = {
  id: string;
  full_name: string | null;
  branch: string | null;
  year: string | null;
  image_url: string | null;
};

type ChatCard = {
  chatId: string;
  messageCount: number;
  isCompleted: boolean;
  profile: Profile | null;
};

export default function ChatsPage() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatCard[]>([]);

  useEffect(() => {
  loadChats();

  const channel = supabase
    .channel("chats-realtime")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_messages",
      },
      () => loadChats()
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chats",
      },
      () => loadChats()
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
  async function loadChats() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: chatData, error } = await supabase
        .from("chats")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const chatsList: Chat[] = chatData || [];

      const otherUserIds = chatsList.map((chat) =>
        chat.user1_id === user.id
          ? chat.user2_id
          : chat.user1_id
      );

      if (otherUserIds.length === 0) {
        setChats([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", otherUserIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      const finalChats: ChatCard[] = await Promise.all(
  chatsList.map(async (chat) => {
    const otherUserId =
      chat.user1_id === user.id
        ? chat.user2_id
        : chat.user1_id;

    const { count } = await supabase
      .from("chat_messages")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("chat_id", chat.id);

    return {
      chatId: chat.id,
      messageCount: count || 0,
      isCompleted:
        chat.is_completed ||
        (count || 0) >= 50,
      profile:
        profileMap.get(otherUserId) || null,
    };
  })
);
      setChats(finalChats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            💬 Chats
          </h1>

          <p className="text-gray-400 mt-2">
            Continue conversations started from Discover.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center text-white py-20">
            Loading chats...
          </div>
        )}

        {/* EMPTY */}
        {!loading && chats.length === 0 && (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-10 text-center">

            <div className="text-6xl mb-4">
              💬
            </div>

            <h2 className="text-2xl font-semibold text-white">
              No Chats Yet
            </h2>

            <p className="text-gray-400 mt-2">
              Start chatting from Discover page.
            </p>

          </div>
        )}

        {/* CHAT LIST */}
        {!loading && chats.length > 0 && (
          <div className="space-y-4">

            {chats.map((chat) => (
              <Link
                key={chat.chatId}
                href={`/chats/${chat.chatId}`}
              >
                <div
                  className="
                    cursor-pointer
                    rounded-3xl
                    border
                    border-white/10
                    bg-gradient-to-r
                    from-blue-500/10
                    via-purple-500/10
                    to-pink-500/10
                    backdrop-blur-xl
                    p-5
                    hover:scale-[1.01]
                    transition
                  "
                >
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      <img
                        src={
                          chat.profile?.image_url ||
                          "https://ui-avatars.com/api/?name=Student"
                        }
                        alt="profile"
                        className="
                          w-14
                          h-14
                          rounded-full
                          object-cover
                        "
                      />

                      <div>

                        <h3 className="text-lg font-bold text-white">
                          {chat.profile?.full_name ||
                            "Student"}
                        </h3>

                        <p className="text-gray-300 text-sm">
                          {chat.profile?.branch} • Year{" "}
                          {chat.profile?.year}
                        </p>

                      </div>

                    </div>

                    <div className="text-right">

                      <div className="text-white font-semibold">
                        {chat.messageCount}/50
                      </div>

                      {chat.messageCount >= 45 &&
                        !chat.isCompleted && (
                          <div className="text-yellow-400 text-xs mt-1">
                            ⚠ Almost Full
                          </div>
                        )}

                      {chat.isCompleted && (
                        <div className="text-red-400 text-xs mt-1">
                          Chat Closed
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              </Link>
            ))}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
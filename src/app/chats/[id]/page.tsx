"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_seen: boolean;
};

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
  image_url: string | null;
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();

  const chatId = params.id as string;

  const [userId, setUserId] = useState("");
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  // -------------------------
  // Load Current User
  // -------------------------
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setUserId(user.id);

      await loadChat(user.id);
      await loadMessages(user.id);
    };

    init();
  }, []);

  // -------------------------
  // Load Chat Details
  // -------------------------
  const loadChat = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (error || !data) {
      router.push("/chats");
      return;
    }

    const chatData = data as Chat;

    setChat(chatData);

    const otherId =
      chatData.user1_id === currentUserId
        ? chatData.user2_id
        : chatData.user1_id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, image_url")
      .eq("id", otherId)
      .single();

    if (profile) {
      setOtherUser(profile);
    }
  };

  // -------------------------
  // Load Messages
  // -------------------------
  const loadMessages = async (
    currentUserId: string
  ) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", {
        ascending: true,
      });

    if (!error && data) {
      setMessages(data);

      // mark seen
      await supabase
        .from("chat_messages")
        .update({ is_seen: true })
        .eq("chat_id", chatId)
        .neq("sender_id", currentUserId);

      scrollBottom();
    }

    setLoading(false);
  };

  // -------------------------
  // Realtime Messages
  // -------------------------
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async () => {
          if (!userId) return;

          await loadMessages(userId);

          const { data: updatedChat } =
            await supabase
              .from("chats")
              .select("*")
              .eq("id", chatId)
              .single();

          if (updatedChat) {
            setChat(updatedChat);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId]);

  // -------------------------
  // Auto Scroll
  // -------------------------
  useEffect(() => {
    scrollBottom();
  }, [messages]);

const messagesUsed = messages.length;

const messagesLeft =
  50 - messages.length;

const warningVisible =
  messages.length >= 40 &&
  messages.length < 50;

const chatClosed =
  chat?.is_completed ||
  messages.length >= 50;
      // -------------------------
  // Send Message
  // -------------------------
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    if (!chat) return;
    if (chatClosed) return;

    const totalMessages = messages.length + 1;

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender_id: userId,
        content: messageText.trim(),
      });

    if (error) {
      console.error(error);
      return;
    }

   

    // -------------------------
    // Auto Delete At 50
    // -------------------------
    if (totalMessages >= 50) {
      await supabase
        .from("chat_messages")
        .delete()
        .eq("chat_id", chatId);

      await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

      alert(
        "50 messages completed. Chat removed for privacy."
      );

      router.push("/chats");
    }
  };

  // -------------------------
  // Loading UI
  // -------------------------
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-white">
          Loading chat...
        </div>
      </DashboardLayout>
    );
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col max-w-5xl mx-auto">

        {/* HEADER */}
        <div
          className="
            sticky
            top-0
            z-20
            bg-[#0b0f1a]
            border-b
            border-white/10
            px-5
            py-4
          "
        >
          <div className="flex items-center gap-4">

            <img
              src={
                otherUser?.image_url ||
                "https://ui-avatars.com/api/?name=Student"
              }
              className="
                w-12
                h-12
                rounded-full
                object-cover
              "
              alt="user"
            />

            <div>
              <h2 className="text-white font-bold text-lg">
                {otherUser?.full_name || "Student"}
              </h2>

              <p className="text-gray-400 text-sm">
                {messagesUsed}/50 messages used,<br></br>
                Note: Chats are not encrypted. keep it friendly and casual! (Developer can see the database)
              </p>
            </div>

          </div>
        </div>

        {/* WARNING */}
        {warningVisible && (
          <div
            className="
              bg-yellow-500/20
              border
              border-yellow-500/40
              text-yellow-300
              px-4
              py-3
              text-center
              text-sm
            "
          >
            ⚠ Only {messagesLeft} messages left.
            Share your social account if you want to continue.
          </div>
        )}

        {/* CHAT CLOSED */}
        {chatClosed && (
          <div
            className="
              bg-red-500/20
              border
              border-red-500/40
              text-red-300
              px-4
              py-3
              text-center
            "
          >
            Chat limit reached.
          </div>
        )}

        {/* MESSAGES */}
        <div
          className="
            flex-1
            overflow-y-auto
            p-5
            space-y-4
          "
        >
          {messages.map((msg) => {
            const own =
              msg.sender_id === userId;

            return (
              <div
                key={msg.id}
                className={`
                  flex
                  ${own ? "justify-end" : "justify-start"}
                `}
              >
                <div
                  className={`
                    max-w-[75%]
                    rounded-2xl
                    px-4
                    py-3
                    shadow-lg
                    ${
                      own
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-white/10 text-white"
                    }
                  `}
                >
                  <div>{msg.content}</div>

                  <div
                    className="
                      mt-2
                      text-[11px]
                      opacity-70
                      flex
                      justify-end
                    "
                  >
                    {own &&
                      (msg.is_seen
                        ? "✓✓ Seen"
                        : "✓ Sent")}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        {!chatClosed && (
          <div
            className="
              border-t
              border-white/10
              p-4
              bg-[#0b0f1a]
            "
          >
            <div className="flex gap-3">

              <input
                value={messageText}
                onChange={(e) =>
                  setMessageText(e.target.value)
                }
                placeholder="Type a message..."
                className="
                  flex-1
                  bg-white/10
                  border
                  border-white/10
                  rounded-xl
                  px-4
                  py-3
                  text-white
                  outline-none
                "
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                className="
                  px-6
                  rounded-xl
                  bg-gradient-to-r
                  from-pink-500
                  to-purple-500
                  text-white
                  font-semibold
                "
              >
                Send
              </button>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
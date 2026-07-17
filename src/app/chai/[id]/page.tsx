"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Session = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  type: string;
  message_count: number;
};

export default function ChaiChatPage() {
  const params = useParams();
  const router = useRouter();

  const sessionId = params.id as string;

  const [userId, setUserId] = useState("");

  const [session, setSession] =
    useState<Session | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  // ----------------------------
  // Current User
  // ----------------------------

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);
  };

  // ----------------------------
  // Session
  // ----------------------------

  const loadSession = async () => {
    const { data } = await supabase
      .from("chai_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!data) {
      router.push("/chai");
      return;
    }

    setSession(data);
  };

  // ----------------------------
  // Messages
  // ----------------------------

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chai_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", {
        ascending: true,
      });

    if (!data) return;

    setMessages(data);
  };

  // ----------------------------
  // Initial Load
  // ----------------------------

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadSession();
      await loadMessages();

      setLoading(false);
    };

    init();
  }, []);

  // ----------------------------
  // Realtime
  // ----------------------------

  useEffect(() => {
    const channel = supabase
      .channel(`chai-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chai_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // ----------------------------
  // Auto Scroll
  // ----------------------------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ----------------------------
  // Counts
  // ----------------------------

  const messagesUsed =
    messages.length;

  const messagesLeft =
    20 - messagesUsed;

  const warningVisible =
    messagesUsed >= 15 &&
    messagesUsed < 20;

  const chatCompleted =
    messagesUsed >= 20;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-white">
          Loading...
        </div>
      </DashboardLayout>
    );
  }
    // ----------------------------
  // Send Message
  // ----------------------------

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (chatCompleted) return;

    const totalMessages =
      messages.length + 1;

    const { error } = await supabase
      .from("chai_messages")
      .insert({
        session_id: sessionId,
        sender_id: userId,
        content: message.trim(),
      });

    if (error) {
      console.error(error);
      return;
    }

    setMessage("");

    // ----------------------------
    // Auto End At 50 Messages
    // ----------------------------

    if (totalMessages >= 50) {

      await supabase
        .from("chai_messages")
        .delete()
        .eq("session_id", sessionId);

      await supabase
        .from("chai_sessions")
        .delete()
        .eq("id", sessionId);

      alert(
        "☕ Chai session completed. Chat removed for privacy."
      );

      router.push("/chai");
    }
  };

  // ----------------------------
  // UI
  // ----------------------------

  return (
    <DashboardLayout>

      <div className="max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col">

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

          <h1 className="text-white text-2xl font-bold">
            ☕ Chai Chat
          </h1>

          <p className="text-white/50 text-sm mt-1">
            {messagesUsed}/20 messages used
          </p>

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
            "
          >
            ⚠ Only {messagesLeft} messages left.
            Exchange socials if you wish to continue.
          </div>

        )}

        {/* COMPLETED */}

        {chatCompleted && (

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
            Session completed.
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
                  ${
                    own
                      ? "justify-end"
                      : "justify-start"
                  }
                `}
              >

                <div
                  className={`
                    max-w-[75%]
                    rounded-2xl
                    px-4
                    py-3
                    ${
                      own
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-white"
                    }
                  `}
                >
                  {msg.content}
                </div>

              </div>

            );
          })}

          <div ref={bottomRef} />

        </div>

        {/* INPUT */}

        {!chatCompleted && (

          <div
            className="
              border-t
              border-white/10
              bg-[#0b0f1a]
              p-4
            "
          >

            <div className="flex gap-3">

              <input
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
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
                  if (
                    e.key === "Enter"
                  ) {
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                className="
                  bg-orange-500
                  hover:bg-orange-600
                  px-6
                  rounded-xl
                  text-white
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
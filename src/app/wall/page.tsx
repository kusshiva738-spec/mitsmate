"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Like {
  id?: string;
  post_id: string;
  user_id: string;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function WallPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [likes, setLikes] = useState<Like[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadWall();

    // ── Realtime: patch state from payload, never refetch everything ──
    const channel = supabase
      .channel("wall-realtime")

      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wall_posts" },
        (payload) => {
          const newRow = payload.new as Post;
          setPosts((prev) =>
            prev.find((p) => p.id === newRow.id)
              ? prev
              : [newRow, ...prev]
          );
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "wall_posts" },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )

      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wall_post_likes" },
        (payload) => {
          const newRow = payload.new as Like;
          setLikes((prev) =>
            prev.find((l) => l.post_id === newRow.post_id && l.user_id === newRow.user_id)
              ? prev
              : [...prev, newRow]
          );
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "wall_post_likes" },
        (payload) => {
          setLikes((prev) =>
            prev.filter(
              (l) => !(l.post_id === payload.old.post_id && l.user_id === payload.old.user_id)
            )
          );
        }
      )

      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wall_replies" },
        (payload) => {
          const newRow = payload.new as Reply;
          setReplies((prev) =>
            prev.find((r) => r.id === newRow.id) ? prev : [...prev, newRow]
          );
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "wall_replies" },
        (payload) => {
          setReplies((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )

      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadWall() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    setUserId(user.id);

    const [postsRes, likesRes, repliesRes] = await Promise.all([
      supabase.from("wall_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("wall_post_likes").select("*"),
      supabase.from("wall_replies").select("*").order("created_at", { ascending: true }),
    ]);

    setPosts(postsRes.data || []);
    setLikes(likesRes.data || []);
    setReplies(repliesRes.data || []);
    setLoading(false);
  }

  async function createPost() {
    if (!newPost.trim() || posting) return;

    const cleaned = newPost.replace(/<[^>]*>?/gm, "").trim();
    if (!cleaned) return;
    if (cleaned.length > 1000) { alert("Maximum 1000 characters"); return; }

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const tempPost: Post = {
      id: tempId,
      user_id: userId,
      content: cleaned,
      created_at: new Date().toISOString(),
    };
    setPosts((prev) => [tempPost, ...prev]);
    setNewPost("");
    setPosting(true);

    const { data, error } = await supabase
      .from("wall_posts")
      .insert({ user_id: userId, content: cleaned })
      .select()
      .single();

    if (error) {
      // Rollback
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      alert(error.message);
    } else {
      // Replace temp with real row (realtime INSERT may also arrive — dedup handled above)
      setPosts((prev) => prev.map((p) => (p.id === tempId ? data : p)));
    }
    setPosting(false);
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post?")) return;

    // Optimistic remove
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    const { error } = await supabase
      .from("wall_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      loadWall(); // Rollback by reloading
    }
  }

  async function toggleLike(postId: string) {
    const alreadyLiked = likes.find(
      (l) => l.post_id === postId && l.user_id === userId
    );

    if (alreadyLiked) {
      // Optimistic unlike
      setLikes((prev) =>
        prev.filter((l) => !(l.post_id === postId && l.user_id === userId))
      );
      const { error } = await supabase
        .from("wall_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) {
        // Rollback
        setLikes((prev) => [...prev, { post_id: postId, user_id: userId }]);
      }
    } else {
      // Optimistic like
      setLikes((prev) => [...prev, { post_id: postId, user_id: userId }]);
      const { error } = await supabase
        .from("wall_post_likes")
        .insert({ post_id: postId, user_id: userId });
      if (error) {
        // Rollback
        setLikes((prev) =>
          prev.filter((l) => !(l.post_id === postId && l.user_id === userId))
        );
      }
    }
  }

  async function addReply(postId: string) {
    const content = replyInputs[postId]?.trim();
    if (!content) return;

    const cleaned = content.replace(/<[^>]*>?/gm, "").trim();
    if (!cleaned) return;
    if (cleaned.length > 500) { alert("Reply must be under 500 characters"); return; }

    // Optimistic insert
    const tempId = `temp-reply-${Date.now()}`;
    const tempReply: Reply = {
      id: tempId,
      post_id: postId,
      user_id: userId,
      content: cleaned,
      created_at: new Date().toISOString(),
    };
    setReplies((prev) => [...prev, tempReply]);
    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));

    const { data, error } = await supabase
      .from("wall_replies")
      .insert({ post_id: postId, user_id: userId, content: cleaned })
      .select()
      .single();

    if (error) {
      setReplies((prev) => prev.filter((r) => r.id !== tempId));
      alert(error.message);
    } else {
      setReplies((prev) => prev.map((r) => (r.id === tempId ? data : r)));
    }
  }

  async function deleteReply(replyId: string) {
    // Optimistic remove
    setReplies((prev) => prev.filter((r) => r.id !== replyId));

    const { error } = await supabase
      .from("wall_replies")
      .delete()
      .eq("id", replyId)
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      loadWall(); // Rollback
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "#a78bfa", borderRightColor: "#ec4899" }} />
            <p className="text-sm font-semibold"
              style={{ background: "linear-gradient(90deg,#a78bfa,#ec4899,#fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Loading Wall...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-indigo-600/20 border border-white/10 p-7">
          <h1 className="text-3xl font-bold text-white">🔥 MITS Wall</h1>
          <p className="text-purple-200 mt-1 text-sm">Anonymous Confessions • Auto Delete in 7 Days</p>
        </div>

        {/* Create Post */}
        <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-3">🎭 Share Anonymously</h2>
          <textarea
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write your confession..."
            className="w-full rounded-xl bg-black/20 border border-white/10 p-4 text-white placeholder:text-slate-500 outline-none resize-none focus:border-purple-500/50 transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{newPost.length}/1000</span>
            <button
              onClick={createPost}
              disabled={posting || !newPost.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {posting ? "Posting..." : "Post Confession"}
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => {
            const postLikes = likes.filter((l) => l.post_id === post.id);
            const liked = postLikes.some((l) => l.user_id === userId);
            const postReplies = replies.filter((r) => r.post_id === post.id);
            const showReplies = openReplies[post.id];
            const isTemp = post.id.startsWith("temp-");

            return (
              <div
                key={post.id}
                className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-all ${isTemp ? "opacity-70" : "opacity-100"}`}
              >
                {/* Post header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-base shrink-0">
                      🎭
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Anonymous Student</p>
                      <p className="text-slate-500 text-xs mt-0.5">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  {post.user_id === userId && !isTemp && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-400 hover:text-red-300 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="mt-4 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  {/* Like button — instant feedback */}
                  <button
                    onClick={() => toggleLike(post.id)}
                    disabled={isTemp}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      liked
                        ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className={`transition-transform ${liked ? "scale-125" : "scale-100"}`}>❤️</span>
                    <span>{postLikes.length}</span>
                  </button>

                  {/* Toggle replies */}
                  <button
                    onClick={() =>
                      setOpenReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    💬 <span>{postReplies.length}</span>
                  </button>
                </div>

                {/* Replies section */}
                {showReplies && (
                  <div className="mt-4 space-y-3">
                    {postReplies.map((reply) => {
                      const isReplyTemp = reply.id.startsWith("temp-reply-");
                      return (
                        <div
                          key={reply.id}
                          className={`rounded-2xl bg-black/20 border border-white/5 p-3 transition-opacity ${isReplyTemp ? "opacity-60" : "opacity-100"}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-300 text-xs font-medium">🎭 Anonymous</span>
                              <span className="text-slate-600 text-xs">{timeAgo(reply.created_at)}</span>
                            </div>
                            {reply.user_id === userId && !isReplyTemp && (
                              <button
                                onClick={() => deleteReply(reply.id)}
                                className="text-red-400 hover:text-red-300 text-xs transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm mt-1.5 break-words">{reply.content}</p>
                        </div>
                      );
                    })}

                    {/* Reply input */}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={replyInputs[post.id] || ""}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => { if (e.key === "Enter") addReply(post.id); }}
                        placeholder="Anonymous reply..."
                        className="flex-1 min-w-0 rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 outline-none focus:border-purple-500/50 transition-colors"
                      />
                      <button
                        onClick={() => addReply(post.id)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {posts.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">🎭</p>
              <p>No confessions yet — be the first!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
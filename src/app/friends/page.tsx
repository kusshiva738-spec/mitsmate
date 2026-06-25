"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

type FriendProfile = {
  id: string;
  full_name: string | null;
  branch: string | null;
  year: string | null;
  bio: string | null;
  image_url: string | null;
};

export default function FriendsPage() {
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendProfile[]>([]);

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: saved, error } = await supabase
        .from("saved_profiles")
        .select("friend_id")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      const friendIds =
        saved?.map((item) => item.friend_id) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const { data: profiles, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .in("id", friendIds);

      if (profileError) {
        console.error(profileError);
        return;
      }

      setFriends((profiles as FriendProfile[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeFriend(friendId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("saved_profiles")
      .delete()
      .eq("user_id", user.id)
      .eq("friend_id", friendId);

    if (error) {
      console.error(error);
      return;
    }

    setFriends((prev) =>
      prev.filter((f) => f.id !== friendId)
    );
  }

  function sayHi(friendId: string) {
    // Chat page later
    console.log("Say Hi:", friendId);
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            ⭐ Saved Profiles
          </h1>

          <p className="text-gray-400 mt-2">
            Students you saved from Discover.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-2xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(90deg,#a78bfa,#ec4899,#fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
            Loading friends...
          </div>
        )}

        {/* EMPTY */}
        {!loading && friends.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">

            <div className="text-6xl mb-4">
              ⭐
            </div>

            <h2 className="text-2xl font-semibold text-white">
              No Saved Profiles Yet
            </h2>

            <p className="text-gray-400 mt-2">
              Save interesting students from Discover.
            </p>

          </div>
        )}

        {/* FRIENDS GRID */}
        {!loading && friends.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {friends.map((friend) => (
              <div
                key={friend.id}
                className="
                  rounded-3xl
                  border
                  border-white/10
                  bg-gradient-to-br
                  from-purple-500/10
                  via-blue-500/10
                  to-pink-500/10
                  backdrop-blur-xl
                  p-6
                "
              >
                <div className="flex items-center gap-4">

                  <img
                    src={
                      friend.image_url ||
                      "https://ui-avatars.com/api/?name=Student"
                    }
                    alt="Profile"
                    className="
                      w-20
                      h-20
                      rounded-full
                      object-cover
                      border-2
                      border-white/20
                    "
                  />

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {friend.full_name || "Anonymous"}
                    </h3>

                    <p className="text-gray-300">
                      {friend.branch || "Branch"} • Year{" "}
                      {friend.year || "-"}
                    </p>
                  </div>

                </div>

                {friend.bio && (
                  <p className="text-gray-300 mt-5">
                    {friend.bio}
                  </p>
                )}

                <div className="mt-6 flex gap-2">

                  <button
                    onClick={() => sayHi(friend.id)}
                    className="
                      flex-1
                      bg-green-500
                      hover:bg-green-600
                      transition
                      px-4
                      py-2
                      rounded-xl
                      text-white
                      font-semibold
                    "
                  >
                    👋 Say Hi
                  </button>

                  <button
                    onClick={() =>
                      removeFriend(friend.id)
                    }
                    className="
                      flex-1
                      bg-red-500
                      hover:bg-red-600
                      transition
                      px-4
                      py-2
                      rounded-xl
                      text-white
                      font-semibold
                    "
                  >
                    Remove
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
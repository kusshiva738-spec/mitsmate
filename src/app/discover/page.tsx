"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  branch: string | null;
  year: string | null;
  bio: string | null;
  interests: string | null;
  image_url: string | null;
  open_for_friendship: boolean | null;
  open_for_chai: boolean | null;
};

export default function DiscoverPage() {
  const [profiles, setProfiles] =
    useState<Profile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [branchFilter, setBranchFilter] =
    useState("all");

  // -----------------------------
  // Initial Load
  // -----------------------------

  useEffect(() => {
    fetchProfiles();
  }, []);

  // -----------------------------
  // Fetch Profiles
  // -----------------------------

  async function fetchProfiles() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            branch,
            year,
            bio,
            interests,
            image_url,
            open_for_friendship,
            open_for_chai,
            created_at
          `)
          .neq("id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(error);
        return;
      }

      setProfiles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Save Profile
  // -----------------------------

  async function saveProfile(
    friendId: string
  ) {
    try {
      const { error } = await supabase
        .from("saved_profiles")
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
        });

      if (error) {
        if (error.code === "23505") {
          alert(
            "Already saved ❤️"
          );
          return;
        }

        console.error(error);
        return;
      }

      alert("Saved ❤️");
    } catch (err) {
      console.error(err);
    }
  }

  // -----------------------------
  // Say Hi
  // -----------------------------

  async function sayHi(
    friendId: string
  ) {
    try {

      // Check existing chat

      const { data: existing } =
        await supabase
          .from("chats")
          .select("*")
          .or(
            `and(user1_id.eq.${currentUserId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${currentUserId})`
          )
          .maybeSingle();

      if (existing) {
        window.location.href =
          `/chats/${existing.id}`;
        return;
      }

      // Create new chat

      const { data, error } =
        await supabase
          .from("chats")
          .insert({
            user1_id: currentUserId,
            user2_id: friendId,
          })
          .select()
          .single();

      if (error) {
        console.error(error);
        return;
      }

      window.location.href =
        `/chats/${data.id}`;

    } catch (err) {
      console.error(err);
    }
  }

  // -----------------------------
  // Filters
  // -----------------------------

  const searchTerm =
    search.trim().toLowerCase();

  const filteredProfiles =
    profiles.filter((profile) => {

      const matchesSearch =
        !searchTerm ||
        profile.full_name
          ?.toLowerCase()
          .includes(searchTerm);

      const matchesBranch =
        branchFilter === "all"
          ? true
          : profile.branch ===
            branchFilter;

      return (
        matchesSearch &&
        matchesBranch
      );
    });

     const branches = [
      ...new Set(
      profiles
      .map((p) => p.branch)
      .filter(
        (branch): branch is string =>
          Boolean(branch)
      )
  ),
];
    // -----------------------------
  // UI
  // -----------------------------

  return (
    <DashboardLayout>

      <div className="space-y-6">

        {/* HEADER */}

        <div>

          <h1 className="text-3xl font-bold text-white">
            👥 Discover Students
          </h1>

          <p className="text-gray-400 mt-2">
            {filteredProfiles.length} students found
          </p>

        </div>

        {/* FILTERS */}

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="
              rounded-xl
              bg-white/5
              border border-white/10
              px-4 py-3
              text-white
              outline-none
            "
          />

          <select
            value={branchFilter}
            onChange={(e) =>
              setBranchFilter(
                e.target.value
              )
            }
            className="
              rounded-xl
              bg-white/5
              border border-white/10
              px-4 py-3
              text-white
              outline-none
            "
          >

            <option value="all">
              All Branches
            </option>

            {branches.map((branch) => (

              <option
                key={branch}
                value={branch}
              >
                {branch}
              </option>

            ))}

          </select>

        </div>

        {/* LOADING */}

        {loading && (

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (

                <div
                  key={item}
                  className="
                    h-80
                    rounded-3xl
                    bg-white/5
                    animate-pulse
                  "
                />

              )
            )}

          </div>

        )}

        {/* EMPTY */}

        {!loading &&
          filteredProfiles.length ===
            0 && (

            <div
              className="
                rounded-3xl
                bg-white/5
                border border-white/10
                p-10
                text-center
                text-gray-400
              "
            >
              No students found.
            </div>

          )}

        {/* STUDENTS */}

        {!loading &&
          filteredProfiles.length >
            0 && (

            <div className="grid md:grid-cols-5 xl:grid-cols-3 gap-6">

              {filteredProfiles.map(
                (profile) => (

                  <div
                    key={profile.id}
                    className="
                      rounded-3xl
                      bg-white/5
                      border border-white/10
                      p-6
                      hover:border-orange-500/50
                      transition-all
                    "
                  >

                    {/* IMAGE */}

                    <div className="flex justify-center">

                      <img
                        src={
                          profile.image_url ||
                          "/default-avatar.png"
                        }
                        alt={
                          profile.full_name ||
                          "Student"
                        }
                        loading="lazy"
                        className="
                          w-24
                          h-24
                          rounded-full
                          object-cover
                        "
                      />

                    </div>

                    {/* NAME */}

                    <div className="text-center mt-4">

                      <h3
                        className="
                          text-white
                          font-semibold
                          truncate
                          w-full
                        "
                      >
                        {profile.full_name}
                      </h3>

                      <p className="text-gray-400">

                        {profile.branch}
                        {" • "}
                        Year {profile.year}

                      </p>

                    </div>

                    {/* BIO */}

                    <div className="mt-4">

                      <p className="text-sm text-gray-300">

                        {profile.bio ||
                          "No bio available"}

                      </p>

                    </div>

                    {/* INTERESTS */}

                    <div className="mt-4">

                      <p className="text-xs text-gray-500 mb-1">
                        Interests
                      </p>

                      <p className="text-sm text-white">

                        {profile.interests ||
                          "Not specified"}

                      </p>

                    </div>

                    {/* TAGS */}

                    <div className="mt-5 flex flex-wrap gap-2">

                      {profile.open_for_friendship && (

                        <span
                          className="
                            text-xs
                            px-3 py-1
                            rounded-full
                            bg-green-500/20
                            text-green-300
                          "
                        >
                          🤝 Friendship
                        </span>

                      )}

                      {profile.open_for_chai && (

                        <span
                          className="
                            text-xs
                            px-3 py-1
                            rounded-full
                            bg-orange-500/20
                            text-orange-300
                          "
                        >
                          ☕ Chai
                        </span>

                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-5 flex gap-2">

                      <button
                        onClick={() =>
                          saveProfile(
                            profile.id
                          )
                        }
                        className="
                          flex-1
                          bg-orange-500
                          hover:bg-orange-600
                          rounded-xl
                          py-2
                          text-white
                          font-medium
                        "
                      >
                        ❤️ Save
                      </button>

                      <button
                        onClick={() =>
                          sayHi(
                            profile.id
                          )
                        }
                        className="
                          flex-1
                          bg-purple-600
                          hover:bg-purple-700
                          rounded-xl
                          py-2
                          text-white
                          font-medium
                        "
                      >
                        👋 Say Hi
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

      </div>

    </DashboardLayout>
  );
}
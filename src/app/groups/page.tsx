
"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface Group {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  category: string;
  max_members: number;
  external_link: string;
  platform: string;
  skills_needed: string;
  created_at: string;
}

export default function GroupsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Study Group");
  const [maxMembers, setMaxMembers] = useState(20);
  const [platform, setPlatform] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [skillsNeeded, setSkillsNeeded] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: allGroups } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: memberships } = await supabase
      .from("group_members")
      .select("*")
      .eq("user_id", user.id);

    const joinedIds =
      memberships?.map((m) => m.group_id) || [];

    setMyGroups(
      (allGroups || []).filter((g) =>
        joinedIds.includes(g.id)
      )
    );

    setGroups(
      (allGroups || []).filter(
        (g) => !joinedIds.includes(g.id)
      )
    );

    setLoading(false);
  }

  async function createGroup() {
    if (!name.trim()) {
      alert("Enter group name");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("groups")
      .insert({
        creator_id: user.id,
        name,
        description,
        category,
        max_members: maxMembers,
        platform,
        external_link: externalLink,
        skills_needed: skillsNeeded,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
      .from("group_members")
      .insert({
        group_id: data.id,
        user_id: user.id,
      });

    setName("");
    setDescription("");
    setPlatform("");
    setExternalLink("");
    setSkillsNeeded("");

    fetchData();
  }

  async function joinGroup(groupId: string) {
    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: userId,
      });

    if (error) {
      alert(error.message);
      return;
    }

    fetchData();
  }

  async function leaveGroup(groupId: string) {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    fetchData();
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-white p-10">
          Loading groups...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-8">

          <h1 className="text-4xl font-bold text-white">
            📚 Study & Project Groups
          </h1>

          <p className="text-purple-100 mt-3">
            Build projects, prepare together and find teammates.
          </p>

        </div>

        {/* Create Group */}
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-pink-500/10 backdrop-blur-xl p-6">

          <h2 className="text-xl font-semibold text-white mb-6">
            Create New Group
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Group Name"
              className="bg-black/20 border border-white/10 rounded-xl p-3 text-white"
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="bg-black/20 border border-white/10 rounded-xl p-3 text-white"
            >
              <option>Study Group</option>
              <option>Project Team</option>
              <option>official club of MITS</option>
               <option>Entertainment</option>
                <option>Research</option>
                 <option>Others</option>
            </select>

            <input
              type="number"
              value={maxMembers}
              onChange={(e) =>
                setMaxMembers(
                  Number(e.target.value)
                )
              }
              placeholder="Max Members"
              className="bg-black/20 border border-white/10 rounded-xl p-3 text-white"
            />

            <input
              value={platform}
              onChange={(e) =>
                setPlatform(e.target.value)
              }
              placeholder="Platform"
              className="bg-black/20 border border-white/10 rounded-xl p-3 text-white"
            />

          </div>

          <textarea
            rows={4}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Description"
            className="w-full mt-4 bg-black/20 border border-white/10 rounded-xl p-3 text-white"
          />

          <textarea
            rows={3}
            value={skillsNeeded}
            onChange={(e) =>
              setSkillsNeeded(e.target.value)
            }
            placeholder="Skills Needed"
            className="w-full mt-4 bg-black/20 border border-white/10 rounded-xl p-3 text-white"
          />

          <input
            value={externalLink}
            onChange={(e) =>
              setExternalLink(e.target.value)
            }
            placeholder="WhatsApp / Telegram / Discord Link"
            className="w-full mt-4 bg-black/20 border border-white/10 rounded-xl p-3 text-white"
          />

          <button
            onClick={createGroup}
            className="mt-5 bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 rounded-xl text-white font-semibold"
          >
            Create Group
          </button>

        </div>

        {/* My Groups */}
        <section>

          <h2 className="text-2xl font-semibold text-white mb-4">
            ⭐ My Groups ({myGroups.length})
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {myGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-red-500/10 p-5"
              >

                <h3 className="text-lg font-semibold text-white">
                  {group.name}
                </h3>

                <p className="text-gray-300 mt-3">
                  {group.description}
                </p>

                <p className="text-orange-200 text-sm mt-3">
                  {group.category}
                </p>

                <p className="text-orange-100 text-sm">
                  Skills: {group.skills_needed}
                </p>

                <div className="mt-5 flex gap-2">

                  {group.external_link && (
                    <a
                      href={group.external_link}
                      target="_blank"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 rounded-lg text-white"
                    >
                      Open Link
                    </a>
                  )}

                  <button
                    onClick={() =>
                      leaveGroup(group.id)
                    }
                    className="bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-lg text-white"
                  >
                    Leave
                  </button>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* Available Groups */}
        <section>

          <h2 className="text-2xl font-semibold text-white mb-4">
            🌎 Available Groups
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-5"
              >

                <h3 className="text-lg font-semibold text-white">
                  {group.name}
                </h3>

                <p className="text-gray-300 mt-3">
                  {group.description}
                </p>

                <p className="text-cyan-100 text-sm mt-3">
                  {group.category}
                </p>

                <p className="text-cyan-100 text-sm">
                  Skills: {group.skills_needed}
                </p>

                <p className="text-cyan-100 text-sm">
                  Max Members: {group.max_members}
                </p>

                <div className="mt-5 flex gap-2">

                  <button
                    onClick={() =>
                      joinGroup(group.id)
                    }
                    className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 rounded-lg text-white"
                  >
                    Join Group
                  </button>

                  {group.external_link && (
                    <a
                      href={group.external_link}
                      target="_blank"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg text-white"
                    >
                      Open Link
                    </a>
                  )}

                </div>

              </div>
            ))}

          </div>

        </section>

      </div>
    </DashboardLayout>
  );
}


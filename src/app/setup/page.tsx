"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetupPage() {

  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [branch, setBranch] =
    useState("");

  const [year, setYear] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [interests, setInterests] =
    useState("");

  const [friendshipOpen, setFriendshipOpen] =
    useState(true);

  const [chaiOpen, setChaiOpen] =
    useState(false);

  async function saveProfile() {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("User not found");
    return;
  }

  const cleanText = (text: string) =>
    text.replace(/<[^>]*>?/gm, "").trim();

  // Validation
  if (!fullName.trim()) {
    alert("Full Name required");
    return;
  }

  if (fullName.length > 50) {
    alert("Name too long");
    return;
  }

  if (bio.length > 300) {
    alert("Bio max 300 characters");
    return;
  }

  const validYears = ["1", "2", "3", "4"];

  if (!validYears.includes(year)) {
    alert("Select valid year");
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,

      full_name: cleanText(fullName),
      branch: cleanText(branch),
      year: cleanText(year),
      bio: cleanText(bio),
      interests: cleanText(interests),

      open_for_friendship: friendshipOpen,
      open_for_chai: chaiOpen,
    });

  if (error) {
    alert(error.message);
  } else {
    router.push("/feed");
  }
}
  return (
    <div className="min-h-screen bg-[#0b071d] flex items-center justify-center p-6">

      <div className="w-full max-w-[700px] bg-[#17122b] rounded-[40px] p-8 text-white">

        <h1 className="text-5xl font-bold">
          Complete Profile ✨
        </h1>

        <div className="mt-8 space-y-5">

          <input
            placeholder="Full Name"
            value={fullName}
            maxLength={50}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            className="w-full bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
          />

          <input
            placeholder="Branch"
            value={branch}
            maxLength={20}
            onChange={(e) =>
              setBranch(e.target.value)
            }
            className="w-full bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
          />

         <select
  value={year}
  onChange={(e) => setYear(e.target.value)}
  className="w-full bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
>
  <option value="">Select Year</option>
  <option value="1">1st Year</option>
  <option value="2">2nd Year</option>
  <option value="3">3rd Year</option>
  <option value="4">4th Year</option>
</select>

          <textarea
            placeholder="Bio"
            value={bio}
            maxLength={300}
            onChange={(e) =>
              setBio(e.target.value)
            }
            className="w-full h-[120px] bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
          />

          <input
            placeholder="music, coding, anime"
            value={interests}
            maxLength={200}
            onChange={(e) =>
              setInterests(
                e.target.value
              )
            }
            className="w-full bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-5 mt-8">

          <button
            onClick={() =>
              setFriendshipOpen(
                !friendshipOpen
              )
            }
            className={`p-5 rounded-3xl ${
              friendshipOpen
                ? "bg-green-500"
                : "bg-[#241b3d]"
            }`}
          >
            Friendship Mode 💜
          </button>

          <button
            onClick={() =>
              setChaiOpen(!chaiOpen)
            }
            className={`p-5 rounded-3xl ${
              chaiOpen
                ? "bg-orange-500"
                : "bg-[#241b3d]"
            }`}
          >
            Open for Chai ☕
          </button>
        </div>

        <button
          onClick={saveProfile}
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-500 py-4 rounded-2xl font-semibold"
        >
          Enter MITS-Mate 🚀
        </button>
      </div>
    </div>
  );
}
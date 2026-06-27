"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [openForFriendship, setOpenForFriendship] =
    useState(false);

  const [openForChai, setOpenForChai] =
    useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);

      setFullName(data.full_name || "");
      setBranch(data.branch || "");
      setYear(data.year || "");
      setGender(data.gender || "");
      setBio(data.bio || "");
      setInterests(data.interests || "");
      setImageUrl(data.image_url || "");

      setOpenForFriendship(
        data.open_for_friendship || false
      );

      setOpenForChai(
        data.open_for_chai || false
      );
    }

    setLoading(false);
  }
     async function uploadAvatar(
  e: React.ChangeEvent<HTMLInputElement>
) {
  try {
    const file = e.target.files?.[0];

    if (!file) return;

    // Image validation
    if (!file.type.startsWith("image/")) {
      alert("Only image files allowed");
      return;
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert("Maximum file size is 5MB");
      return;
    }

    setUploading(true);

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "upload_preset",
      process.env
        .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          "Upload failed"
      );
    }

    const optimizedUrl =
      data.secure_url.replace(
        "/upload/",
        "/upload/w_400,h_400,c_fill,q_auto,f_auto/"
      );

    setImageUrl(optimizedUrl);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          image_url: optimizedUrl,
        })
        .eq("id", user.id);

      if (error) {
        alert(
          "Image URL save failed: " +
            error.message
        );
        return;
      }
    }

    alert("Image uploaded successfully");
  } catch (err) {
    console.error(err);

    alert("Upload failed");
  } finally {
    setUploading(false);
  }

}
                  async function saveProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Sanitization
  const cleanText = (text: string) =>
    text.replace(/<[^>]*>?/gm, "").trim();

  // Validation
  if (fullName.length > 50) {
    alert("Name must be under 50 characters");
    return;
  }

  if (bio.length > 300) {
    alert("Bio must be under 300 characters");
    return;
  }

  const validYear = ["1", "2", "3", "4"];

  if (year && !validYear.includes(year)) {
    alert("Invalid Year");
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: cleanText(fullName),
      branch: cleanText(branch),
      year: cleanText(year),
      gender: cleanText(gender),
      bio: cleanText(bio),
      interests: cleanText(interests),

      image_url: imageUrl,

      open_for_friendship: openForFriendship,
      open_for_chai: openForChai,
    })
    .eq("id", user.id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Profile Updated Successfully");

  fetchProfile();
  setEditing(false);

            }
 return(
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {loading ? (
      <div className="text-2xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(90deg,#a78bfa,#ec4899,#fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
            Loading...
          </div>
        ) : profile ? (

          <div className="space-y-6">

            {/* PROFILE CARD */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

              <div className="flex flex-col md:flex-row items-center gap-6">

                <img
                  src={
                    imageUrl ||
                    "/default-avatar.png"
                  }
                   width={200}
                   height={200}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-white/10"
                />

                <div>

                  <h1 className="text-3xl font-bold text-white">
                    {profile.full_name}
                  </h1>

                  <p className="text-gray-400 mt-2">
                    {profile.branch} • Year {profile.year}
                  </p>

                  <p className="text-gray-400">
                    {profile.gender}
                  </p>

                </div>

              </div>

            </div>

            {/* ABOUT */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

              <h2 className="text-xl font-semibold text-white mb-3">
                About
              </h2>

              <p className="text-gray-300">
                {profile.bio || "No bio added"}
              </p>

            </div>

            {/* INTERESTS */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

              <h2 className="text-xl font-semibold text-white mb-3">
                Interests
              </h2>

              <p className="text-gray-300">
                {profile.interests ||
                  "No interests added"}
              </p>

            </div>

            {/* STATUS */}
            <div className="grid md:grid-cols-2 gap-4">

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

                <h3 className="text-white font-semibold">
                  🤝 Open For Friendship
                </h3>

                <p className="text-gray-300 mt-2">
                  {openForFriendship
                    ? "Enabled"
                    : "Disabled"}
                </p>

              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

                <h3 className="text-white font-semibold">
                  ☕ Open For Chai
                </h3>

                <p className="text-gray-300 mt-2">
                  {openForChai
                    ? "Enabled"
                    : "Disabled"}
                </p>

              </div>

            </div>

            {/* EDIT BUTTON */}
            <button
              onClick={() =>
                setEditing(!editing)
              }
              className="
                px-6 py-3
                rounded-xl
                bg-orange-500
                hover:bg-orange-600
                text-white
                font-semibold
              "
            >
              {editing
                ? "Cancel"
                : "Edit Profile"}
            </button>

            {/* EDIT FORM */}
            {editing && (

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

                <div className="space-y-4">
                <label
                      className="
                        flex
                        items-center
                        justify-center
                        w-full
                        p-4
                        rounded-xl
                        border
                        border-dashed
                        border-white/20
                        cursor-pointer
                        text-white
                      "
                    >
                      {uploading
                        ? "Uploading..."
                        : "📷 Upload Profile Photo"}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        className="hidden"
                      />
                    </label>
                  

                  {uploading && (
                    <p className="text-white">
                      Uploading...
                    </p>
                  )}

                  <input
                    value={fullName}
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    placeholder="Full Name"
                    className="w-full p-3 rounded bg-black/30 text-white"
                  />
                   <select
              value={branch}
              onChange={(e) =>
                setBranch(e.target.value)
              }
              aria-placeholder="branch"
              className="w-full p-3 rounded bg-black/30 text-white"
            >
              <option>CSE</option>
              <option>IT</option>
              <option>CSD</option>
               <option>CIVIL ENG.</option>
                <option>MECH.ENG.</option>
                <option>Electrical ENG. </option>
                 <option>ELECTRONICS ENG. </option>
                  <option>ELECTRONICS & TELECOM. </option>
                  <option>CHEMICAL ENG. </option>
                   <option>IOT(IT) </option>
                    <option>AI&ML </option>
                     <option>IOT(EE) </option>
                      <option>AIDS</option>
                       <option>MATHEMATICS &COMP. </option>
                        <option>AUTOMOBILE </option>
                         <option>ARCHITECTURE </option>
            </select>

                 
                            <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full p-3 rounded bg-black/30 text-white"
                    >
                      
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>

                 

                  <input
                    value={gender}
                    onChange={(e) =>
                      setGender(
                        e.target.value
                      )
                    }
                    placeholder="Gender"
                    className="w-full p-3 rounded bg-black/30 text-white"
                  />

                  <textarea
                    value={bio}
                    onChange={(e) =>
                      setBio(
                        e.target.value
                      )
                    }
                    placeholder="Bio"
                    className="w-full p-3 rounded bg-black/30 text-white"
                  />

                  <textarea
                    value={interests}
                    onChange={(e) =>
                      setInterests(
                        e.target.value
                      )
                    }
                    placeholder="Interests"
                    className="w-full p-3 rounded bg-black/30 text-white"
                  />

                  <label className="flex items-center gap-3 text-white">
                    <input
                      type="checkbox"
                      checked={
                        openForFriendship
                      }
                      onChange={(e) =>
                        setOpenForFriendship(
                          e.target.checked
                        )
                      }
                    />
                    Open For Friendship
                  </label>

                  <label className="flex items-center gap-3 text-white">
                    <input
                      type="checkbox"
                      checked={openForChai}
                      onChange={(e) =>
                        setOpenForChai(
                          e.target.checked
                        )
                      }
                    />
                    Open For Chai
                  </label>

                  <button
                    onClick={saveProfile}
                    className="
                      bg-green-600
                      hover:bg-green-700
                      px-6 py-3
                      rounded-xl
                      text-white
                    "
                  >
                    Save Changes
                  </button>

                </div>

              </div>

            )}

          </div>

        ) : (

          <div className="text-white">
            Profile not found
          </div>

        )}
      </div>
    </DashboardLayout>
  );
}
"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function EditProfileForm() {

  const [image, setImage] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  async function uploadImage() {

    if (!image) {

      alert("Select image first");

      return;
    }

    setUploading(true);

    // CURRENT USER
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {

      alert("User not found");

      setUploading(false);

      return;
    }

    // FILE NAME
    const fileName =
      `${Date.now()}-${image.name}`;

    // UPLOAD IMAGE
    const { error } =
      await supabase.storage
        .from("avatars")
        .upload(fileName, image);

    if (error) {

      console.log(error);

      alert("Upload failed");

      setUploading(false);

      return;
    }

    // GET PUBLIC URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // SAVE URL IN DATABASE
    const { error: updateError } =
      await supabase
        .from("profiles")
        .update({
          image_url: publicUrl,
        })
        .eq("id", user.id);

    if (updateError) {

      console.log(updateError);

      alert("Database update failed");

      setUploading(false);

      return;
    }

    setUploading(false);

    alert("Profile picture updated 🔥");

    window.location.reload();
  }

  return (

    <div className="bg-[#17122b] border border-white/10 rounded-[30px] p-6">

      <h2 className="text-2xl font-bold text-white mb-6">

        Upload Profile Picture

      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setImage(
            e.target.files?.[0] || null
          )
        }
        className="text-white"
      />

      <button
        onClick={uploadImage}
        disabled={uploading}
        className="mt-6 bg-purple-600 hover:bg-purple-500 transition px-6 py-3 rounded-2xl text-white font-semibold"
      >

        {uploading
          ? "Uploading..."
          : "Upload Image"}

      </button>

    </div>
  );
}
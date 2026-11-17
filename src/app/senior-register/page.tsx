
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SeniorRegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [passingYear, setPassingYear] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [idCard, setIdCard] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(file: File | null) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please select a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("ID card image must be smaller than 5 MB.");
      return;
    }

    setIdCard(file);
  }

  async function uploadIdCard(): Promise<string> {
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary configuration is missing. Check .env.local."
      );
    }

    if (!idCard) {
      throw new Error("Please upload your MITS ID card.");
    }

    const formData = new FormData();
    formData.append("file", idCard);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "mits-mate/senior-verifications");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.secure_url) {
      throw new Error(
        result.error?.message || "ID card upload failed."
      );
    }

    return result.secure_url;
  }

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !passingYear ||
      !idCard
    ) {
      alert("Please fill all required fields and upload your ID card.");
      return;
    }

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      // 1. Upload ID card to Cloudinary first.
      const idCardUrl = await uploadIdCard();

      setUploading(false);

      // 2. Create Supabase Auth account.
      // The database trigger saves senior details in
      // senior_verifications, not profiles.
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            account_type: "senior",
            full_name: cleanName,
            branch,
            passing_year: passingYear,
            bio: bio.trim(),
            interests: interests.trim(),
            image_url: "",
            id_card_url: idCardUrl,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error(
          "Account creation could not be confirmed. Please try again."
        );
      }

      alert(
        data.session
          ? "Registration submitted! Your verification is pending admin approval."
          : "Registration submitted! Check your email for confirmation. Your verification is pending admin approval."
      );

      // Do not grant app access based on signup alone.
      router.push("/auth");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      alert(message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-400/60";

  const labelClass = "mb-2 block text-sm text-white/70";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080711] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-purple-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-pink-600/15 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <button
          type="button"
          onClick={() => router.push("/auth")}
          className="mb-6 flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          ← Back to Login
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-3xl">
              🎓
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[3px] text-purple-300">
              SPECIAL REGISTRATION
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, <span className="text-purple-300">Senior.</span>
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/45">
              Register with your personal email and verify your MITS identity.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                maxLength={100}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Personal Email *</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                className={inputClass}
              />
              <p className="mt-2 text-xs text-white/35">
                Use an email address you can access.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Branch *</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={inputClass}
                >
                  <option className="bg-[#11101c]" value="CSE">CSE</option>
                  <option className="bg-[#11101c]" value="IT">IT</option>
                  <option className="bg-[#11101c]" value="ECE">ECE</option>
                  <option className="bg-[#11101c]" value="EE">EE</option>
                  <option className="bg-[#11101c]" value="ME">ME</option>
                  <option className="bg-[#11101c]" value="CE">CE</option>
                  <option className="bg-[#11101c]" value="Chemical">Chemical</option>
                  <option className="bg-[#11101c]" value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Passing Year *</label>
                <select
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option className="bg-[#11101c]" value="">
                    Select year
                  </option>
                  {Array.from({ length: 68 }, (_, i) => 1957 + i).map(
                    (year) => (
                      <option
                        className="bg-[#11101c]"
                        key={year}
                        value={String(year)}
                      >
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself"
                maxLength={500}
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Interests (optional)</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Coding, gaming, music..."
                maxLength={300}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                MITS ID Card Image *
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-purple-400/40 bg-purple-500/[0.06] p-5 text-center transition hover:border-purple-300/70 hover:bg-purple-500/10"
              >
                <span className="text-2xl">🪪</span>
                <p className="mt-2 text-sm font-medium text-white">
                  {idCard ? idCard.name : "Choose ID card image"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  JPG, PNG or WebP · Maximum 5 MB
                </p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] ?? null)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Create Password *</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm Password *</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength={6}
                required
                className={inputClass}
              />
            </div>

            <div className="rounded-xl border border-purple-400/15 bg-purple-500/[0.07] p-3">
              <p className="text-xs leading-5 text-white/55">
                🔒 Your ID card will be submitted for admin verification.
                Your account remains unverified until approval.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-4 py-4 text-sm font-bold shadow-lg shadow-purple-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? uploading
                  ? "Uploading ID Card..."
                  : "Creating Account..."
                : "Submit for Verification →"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs text-white/35">
            Already registered?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="font-semibold text-purple-300 transition hover:text-pink-300"
            >
              Login here
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/25">
          MITS Mate · Your campus, your community.
        </p>
      </motion.div>
    </main>
  );
}

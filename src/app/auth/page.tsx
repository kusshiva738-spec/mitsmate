"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {

  const router = useRouter();

  const [isLogin, setIsLogin] =
    useState(true);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleAuth() {

    setLoading(true);

    if (isLogin) {

      const { error } =
        await supabase.auth
          .signInWithPassword({
            email,
            password,
          });

      if (error) {
        alert(error.message);
      } else {
        router.push("/");
      }

    } else {

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        alert(error.message);
      } else {
        alert("Account created");
        setIsLogin(true);
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0b071d] flex items-center justify-center p-6">

      <div className="w-full max-w-[450px] bg-[#17122b] rounded-[40px] p-8 text-white border border-white/10">

        <h1 className="text-4xl font-bold">
          {isLogin
            ? "Welcome Back 👋"
            : "Create Account ✨"}
        </h1>

        <p className="text-white/60 mt-3">
          Friendship-first campus network.
        </p>

        <div className="mt-8">
          <input
            type="email"
            placeholder="MITS College student Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
          />
        </div>

        <div className="mt-5">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full bg-[#241b3d] rounded-2xl px-5 py-4 outline-none"
          />
        </div>

        <button
          onClick={handleAuth}
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-500 py-4 rounded-2xl font-semibold"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Create Account"}
        </button>

        <button
          onClick={() =>
            setIsLogin(!isLogin)
          }
          className="w-full mt-5 text-white/60"
        >
          {isLogin
            ? "Don't have account? Sign up"
            : "Already have account? Login"}
        </button>
      </div>
    </div>
  );
}
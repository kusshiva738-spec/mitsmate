"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function Home() {

  const router = useRouter();

  useEffect(() => {

    async function checkUser() {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // NOT LOGGED IN
      if (!user) {
        router.push("/auth");
        return;
      }

      // CHECK PROFILE
      const { data } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("email", user.email)
          .single();

      // PROFILE NOT FOUND
      if (!data) {
        router.push("/setup");
      } else {
        router.push("/feed");
      }
    }

    checkUser();

  }, []);

  return (
     <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "#a78bfa", borderRightColor: "#ec4899" }} />
            <p className="text-sm font-semibold"
              style={{ background: "linear-gradient(90deg,#a78bfa,#ec4899,#fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Loading...
            </p>
          </div>
        </div>
  );
}
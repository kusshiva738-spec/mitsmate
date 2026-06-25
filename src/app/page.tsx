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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Loading...
    </div>
  );
}
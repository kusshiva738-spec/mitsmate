"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: any;
  profile: any;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] = useState<any>(null);

  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadUser() {

      try {

        // GET AUTH USER
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        // IF USER EXISTS → FETCH PROFILE
        if (user) {

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.log("PROFILE ERROR:", error);
          }

          console.log("PROFILE DATA:", data);

          setProfile(data);
        }

      } catch (error) {

        console.log("AUTH ERROR:", error);

      } finally {

        setLoading(false);
      }
    }

    loadUser();

    // LISTEN FOR LOGIN / LOGOUT
    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      async (_, session) => {

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (error) {
            console.log("PROFILE FETCH ERROR:", error);
          }

          console.log("PROFILE FETCH:", data);

          setProfile(data);

        } else {

          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  // LOGOUT
  async function logout() {

    await supabase.auth.signOut();
  }

  return (

    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>

  );
}

export function useAuth() {

  return useContext(AuthContext);
}
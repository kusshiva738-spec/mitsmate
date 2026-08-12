"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";

const rotatingTaglines = [
  "MITS Student Community",
  "Connect Beyond Classrooms",
  "Meet. Build. Share.",
  "Your Campus. Your People.",
];

const features = [
  {
    icon: "🤝",
    title: "Campus Connections",
    text: "Meet students beyond your classroom.",
  },
  {
    icon: "🚀",
    title: "Project Teams",
    text: "Find people who match your ideas.",
  },
  {
    icon: "☕",
    title: "Chai Meetups",
    text: "Turn random connections into real ones.",
  },
  {
    icon: "🎓",
    title: "Student Groups",
    text: "Discover and grow campus communities.",
  },
  {
    icon: "💬",
    title: "Confessions",
    text: "Share thoughts and campus stories.",
  },
  {
    icon: "📅",
    title: "Campus Events",
    text: "Discover what's happening around MITS.",
  },
];

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  async function handleAuth() {
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        router.push("/");
      }
    } else {
      const collegeEmail = email.trim().toLowerCase();

      if (!collegeEmail.endsWith("@mitsgwl.ac.in")) {
        alert(
          "Only MITS students can register using their official MITS email."
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: collegeEmail,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Account created, confirmation link sent to your mail");
        setIsLogin(true);
      }
    }

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05030c] text-white">

      {/* ================================================= */}
      {/* ANIMATED BACKGROUND */}
      {/* ================================================= */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        {/* Purple glow */}

        <motion.div
          animate={{
            x: [0, 120, -80, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full bg-purple-700/20 blur-[150px]"
        />

        {/* Pink glow */}

        <motion.div
          animate={{
            x: [0, -120, 70, 0],
            y: [0, 70, -50, 0],
            scale: [1, 0.9, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-60 -right-60 h-[650px] w-[650px] rounded-full bg-pink-600/15 blur-[160px]"
        />

        {/* Orange glow */}

        <motion.div
          animate={{
            opacity: [0.05, 0.18, 0.05],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[130px]"
        />

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />

        {/* Stars */}

        {[
          ["10%", "18%", "purple"],
          ["20%", "75%", "pink"],
          ["35%", "15%", "orange"],
          ["50%", "85%", "purple"],
          ["65%", "12%", "pink"],
          ["78%", "72%", "orange"],
          ["88%", "25%", "purple"],
          ["92%", "60%", "pink"],
        ].map(([top, left, type], i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.15, 0.8, 0.15],
              scale: [0.7, 1.4, 0.7],
            }}
            transition={{
              duration: 2.5 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              top,
              left,
            }}
            className={`absolute h-1 w-1 rounded-full ${
              type === "purple"
                ? "bg-purple-400"
                : type === "pink"
                ? "bg-pink-400"
                : "bg-orange-400"
            } shadow-[0_0_12px_currentColor]`}
          />
        ))}
      </div>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 lg:px-10">

        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">

          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}

          <motion.section
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="hidden lg:block"
          >

            {/* LOGO */}

            <div className="flex items-center gap-5">

              <motion.div
                animate={{
                  rotate: [0, 3, -3, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >

                {/* Orbit */}

                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -inset-3 rounded-[28px] border border-purple-500/30"
                />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-[2px] shadow-[0_0_45px_rgba(236,72,153,0.4)]">

                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[22px] bg-[#080510]">

                    <Image
                      src="/logo.png"
                      alt="MITS Mate"
                      width={70}
                      height={70}
                      className="h-full w-full object-cover"
                    />

                  </div>

                </div>
              </motion.div>

              <div>
                <h1 className="text-5xl font-black tracking-tight">
                  MITS{" "}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                    MATE
                  </span>
                </h1>

                <p className="mt-1 text-xs font-medium tracking-[0.35em] text-white/40">
                  CONNECT • SHARE • GROW TOGETHER
                </p>
              </div>

            </div>

            {/* ================================================= */}
            {/* ANIMATED HEADLINE */}
            {/* ================================================= */}

            <div className="mt-14">

              <p className="mb-4 text-sm font-medium uppercase tracking-[0.35em] text-purple-300/70">
                Welcome to your campus
              </p>

              <h2 className="text-6xl font-black leading-[0.98] xl:text-7xl">

                Your campus.

                <br />

                <motion.span
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="bg-[length:200%_auto] bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent"
                >
                  Your people.
                </motion.span>

                <br />

                Your vibes.

              </h2>

              {/* Rotating tagline */}

              <div className="mt-7 h-8 overflow-hidden">

                <AnimatePresence mode="wait">

                  <motion.p
                    key={taglineIndex}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -25 }}
                    transition={{ duration: 0.45 }}
                    className="text-xl font-semibold text-white/80"
                  >
                    ✦ {rotatingTaglines[taglineIndex]}
                  </motion.p>

                </AnimatePresence>

              </div>

              {/* Automatically change tagline */}

              <motion.div
                onAnimationComplete={() => {
                  setTaglineIndex(
                    (prev) =>
                      (prev + 1) % rotatingTaglines.length
                  );
                }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 0,
                }}
                className="hidden"
              />

              {/* Description */}

              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/45">
                A student-built connection platform for MITS students.
                Discover people, projects, events, groups and
                conversations beyond your classroom.
              </p>

            </div>

            {/* ================================================= */}
            {/* FEATURE CARDS */}
            {/* ================================================= */}

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">

              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.5 + index * 0.5,
                    duration: 0.5,
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.04,
                  }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl transition hover:border-pink-500/30 hover:bg-white/[0.06]"
                >

                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 3 + index * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-2xl"
                  >
                    {feature.icon}
                  </motion.div>

                  <h3 className="mt-3 text-sm font-bold">
                    {feature.title}
                  </h3>

                  <p className="mt-1 text-[11px] leading-4 text-white/35">
                    {feature.text}
                  </p>

                </motion.div>
              ))}

            </div>

            {/* Bottom */}

            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="mt-8 flex items-center gap-3 text-sm text-white/40"
            >
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_15px_#4ade80]" />

              Built by students, for students.
            </motion.div>

          </motion.section>

          {/* ================================================= */}
          {/* AUTH CARD */}
          {/* ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 40,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: "easeOut",
            }}
            className="mx-auto w-full max-w-[480px]"
          >

            {/* Animated outer glow */}

            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px rgba(168,85,247,0.08)",
                  "0 0 80px rgba(236,72,153,0.18)",
                  "0 0 40px rgba(168,85,247,0.08)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
              className="rounded-[34px] bg-gradient-to-br from-purple-500/50 via-pink-500/30 to-orange-400/40 p-[1px]"
            >

              <div className="rounded-[33px] border border-white/10 bg-[#0d0918]/95 p-7 backdrop-blur-2xl sm:p-9">

                {/* MOBILE BRAND */}

                <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

                  <div className="relative">

                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute -inset-2 rounded-2xl border border-pink-500/30"
                    />

                    <div className="relative flex h-14 w-14 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-[2px]">

                      <Image
                        src="/logo.png"
                        alt="MITS Mate"
                        width={60}
                        height={60}
                        className="h-full w-full rounded-[14px] object-cover"
                      />

                    </div>

                  </div>

                  <div>

                    <h1 className="text-2xl font-black">
                      MITS{" "}
                      <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        MATE
                      </span>
                    </h1>

                    <p className="text-[9px] tracking-[0.25em] text-white/35">
                      CONNECT • SHARE • GROW
                    </p>

                  </div>

                </div>

                {/* BADGE */}

                <motion.div
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                  className="inline-flex rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300"
                >
                  ✦ MITS Student 1st Community Platform
                </motion.div>

                {/* TITLE */}

                <h2 className="mt-6 text-4xl font-black tracking-tight">

                  {isLogin ? (
                    <>
                      Welcome{" "}
                      <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        back.
                      </span>
                    </>
                  ) : (
                    <>
                      Join the{" "}
                      <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        vibe.
                      </span>
                    </>
                  )}

                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  {isLogin
                    ? "Your campus network is waiting for you."
                    : "Meet people. Build teams. Discover your campus."}
                </p>

                {/* EMAIL */}

                <div className="mt-8">

                  <label className="mb-2 block text-xs font-medium text-white/45">
                    College Email
                  </label>

                  <div className="group relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      🎓
                    </span>

                    <input
                      type="email"
                      placeholder="you@mitsgwl.ac.in"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      autoComplete="email"
                      className="w-full rounded-2xl border border-white/10 bg-[#181128] py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition duration-300 focus:border-purple-500/60 focus:bg-[#1d1434] focus:ring-2 focus:ring-purple-500/10"
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div className="mt-5">

                  <label className="mb-2 block text-xs font-medium text-white/45">
                    Password
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      🔐
                    </span>

                    <input
                      type="password"
                      placeholder="Your MITS Mate password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      autoComplete={
                        isLogin
                          ? "current-password"
                          : "new-password"
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#181128] py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition duration-300 focus:border-pink-500/60 focus:bg-[#1d1434] focus:ring-2 focus:ring-pink-500/10"
                    />

                  </div>

                </div>

                {/* SECURITY */}

                <AnimatePresence>

                  {!isLogin && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        y: -10,
                      }}
                      className="mt-4 overflow-hidden"
                    >

                      <div className="rounded-2xl border border-orange-400/10 bg-orange-400/[0.04] px-4 py-3">

                        <p className="text-xs leading-5 text-orange-200/60">
                          🔐 Use a separate password for MITS Mate.
                          Never use your actual college email password.
                        </p>

                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>

                {/* BUTTON */}

                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  onClick={handleAuth}
                  disabled={loading}
                  className="relative mt-7 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 py-4 font-bold shadow-[0_10px_40px_rgba(236,72,153,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {/* shine */}

                  <motion.div
                    animate={{
                      x: ["-150%", "200%"],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                      repeatDelay: 1,
                    }}
                    className="absolute inset-y-0 w-24 skew-x-[-20deg] bg-white/20 blur-lg"
                  />

                  <span className="relative">
                    {loading
                      ? "Please wait..."
                      : isLogin
                      ? "Enter MITS Mate →"
                      : "Create My Account →"}
                  </span>

                </motion.button>

                {/* SWITCH */}

                <div className="mt-7 flex items-center gap-3">

                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-[10px] text-white/20">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-white/10" />

                </div>

                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  onClick={() =>
                    setIsLogin(!isLogin)
                  }
                  className="mt-6 w-full text-sm text-white/45 transition hover:text-white"
                >
                  {isLogin
                    ? "New to MITS Mate? Create an account →"
                    : "Already part of MITS Mate? Login →"}
                </motion.button>

                {/* FOOTER */}

                <div className="mt-8 border-t border-white/5 pt-6 text-center">

                  <p className="text-[11px] text-white/25">
                    Student-built • Student-focused • Campus-powered
                  </p>

                  <p className="mt-2 text-[10px] leading-4 text-white/15">
                    MITS Mate is an independent student-developed
                    platform and is not the official college website.
                  </p>

                </div>

              </div>

            </motion.div>

          </motion.div>

        </div>

      </div>
    </main>
  );
}
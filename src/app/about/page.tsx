"use client";

import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0b071d] text-white">

      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-18">

        {/* Hero */}

        <div className="text-center mb-16">

          <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-orange-300">
            Built By Students • For Students
          </div>
           <Image
            src="/logo.png"
            alt="MITS Mate"
            width={120}
            height={80}
            className="max-w-4xl mx-auto px-2 py-2 rounded-full"
          />

          <h1 className="mt-6 text-4xl md:text-6xl font-bold">
            About
            <span className="text-orange-400">
              {" "}MITS-Mate
            </span>
          </h1>

          <p className="mt-5 text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-7">
            MITS-Mate is a student community platform
            designed to help students connect, collaborate,
            discover opportunities, join study groups,
            share ideas, and build meaningful friendships.
          </p>

        </div>

        {/* Vision & Mission */}

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Vision */}

          <div
            className=" bg-white/[0.04]
              backdrop-blur-xl
              border border-white/10
              rounded-[30px]
              p-8
              transition-all
              duration-300
              hover:-translate-y-2
              hover:border-blue-500
              hover:bg-white/[0.06]
              
            
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5 text-xl">
              🚀
            </div>

            <h2 className="text-2xl font-semibold">
              Vision
            </h2>

            <p className="mt-4 text-gray-400 text-sm leading-7">
              To build a connected student ecosystem where
              every learner can discover opportunities,
              mentors, friendships, study groups, and
              meaningful collaborations effortlessly.
            </p>
          </div>

          {/* Mission */}

          <div
            className="
              bg-white/[0.04]
              backdrop-blur-xl
              border border-white/10
              rounded-[30px]
              p-8
              transition-all
              duration-300
              hover:-translate-y-2
              hover:border-red-500
              hover:bg-white/[0.06]
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5 text-xl">
              🎯
            </div>

            <h2 className="text-2xl font-semibold">
              Mission
            </h2>

            <p className="mt-4 text-gray-400 text-sm leading-7">
              Empower students through networking,
              friendship, chai meetups, project
              collaboration, study groups, and community
              engagement in one unified platform.
            </p>
          </div>

        </div>

        {/* Why We Built This */}

        <div className="mt-10">

          <h2 className="text-3xl font-semibold text-center mb-10">
            Why We Built This
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-white/[0.04] border border-white/10 rounded-[24px] p-6 hover:border-orange-500/30 transition">
              <div className="text-3xl mb-3">🤝</div>

              <h3 className="font-semibold">
                Student Connections
              </h3>

              <p className="text-sm text-gray-400 mt-3">
                Meet like-minded students beyond your
                classroom and expand your network.
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-[24px] p-6 hover:border-orange-500/30 transition">
              <div className="text-3xl mb-3">☕</div>

              <h3 className="font-semibold">
                Chai Meetups
              </h3>

              <p className="text-sm text-gray-400 mt-3">
                Build genuine friendships through simple
                conversations and interactions.
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-[24px] p-6 hover:border-orange-500/30 transition">
              <div className="text-3xl mb-3">📚</div>

              <h3 className="font-semibold">
                Collaborative Learning
              </h3>

              <p className="text-sm text-gray-400 mt-3">
                Discover study groups, projects, and
                communities to learn together.
              </p>
            </div>

          </div>

        </div>

        {/* Donation */}

        <div
          className="
            mt-10
            bg-white/[0.04]
            border border-white/10
            backdrop-blur-xl
            rounded-[30px]
            p-25
            text-center
        
          "
        >

          <h4 className="text-3xl font-semibold p-5 ">
            Support MITS-Mate ❤️
          </h4>

          <p className="text-gray-400 text-sm max-w-xl mx-auto mt-0 leading-7 text-center">
            Your support helps us improve the platform,
            maintain servers, and build impactful
            student-focused solutions for society.
          </p>

          <div className="mt-8 flex justify-center">

            <div className="bg-white/5 border border-white/10 rounded-[24px] p-4">

              <Image
                src="/qr1.jpeg"
                alt="Donation QR"
                width={220}
                height={220}
                className="rounded-xl"
              />

            </div>

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Scan QR to contribute
          </p>

        </div>

        {/* Footer */}

        <footer className="mt-5 border-t border-white/10 pt-5 text-center">

          <p className="text-gray-200 text-sm item-center text-center">
            Designed & Developed by MITSian
                    
          </p>
           <p className="text-gray-400 text-sm item-center text-center">
            contact us📧 : mitsmate@gmail.com
                    
          </p>

          <p className="text-gray-600 text-xs mt-2">
            Copyright © 2026 MITS-Mate. All Rights Reserved.
          </p>

        </footer>

      </div>

    </div>
  );
}
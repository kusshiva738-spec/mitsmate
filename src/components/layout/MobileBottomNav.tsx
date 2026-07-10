 "use client";

import Link from "next/link";
export default function MobileBottomNav() {

  return (

    <div className="fixed bottom-0 left-0 w-full bg-[#120d25] border-t border-white/10 flex justify-around py-3 xl:hidden z-50">

      <button className="text-white text-2xl">
         <Link
                  href="/feed"
                  className="text-orange-400 hover:text-orange-300"
                >
                    🏠
              
                </Link>
          
      </button>
      

      <button className="text-white text-2xl">
        
        <Link
                  href="/discover"
                  className="text-orange-400 hover:text-orange-300"
                >
                    🔍
              
                </Link>
        
      </button>

      <button className="text-white text-2xl">
        
        <Link
                  href="/chai"
                  className="text-orange-400 hover:text-orange-300"
                >
                  🫖
              
                </Link>

      </button>

      <button className="text-white text-2xl">
         <Link
                  href="/wall"
                  className="text-orange-400 hover:text-orange-300"
                >
                  🔥
              
                </Link>
      </button>
      <button className="text-white text-2xl">
         <Link
                  href="/event"
                  className="text-orange-400 hover:text-orange-300"
                >
                  🎊
              
                </Link>
      </button>

      <button className="text-white text-2xl">
        <Link
                  href="/chats"
                  className="text-orange-400 hover:text-orange-300"
                >
                   💬
              
                </Link>
      </button>
      <button className="text-white text-2xl">
         <Link
                  href="/profile"
                  className="text-orange-400 hover:text-orange-300"
                >
                    👤
              
                </Link>
                </button>
      <button className="text-white text-2xl">
         <Link
                  href="/about"
                  className="text-orange-400 hover:text-orange-300"
                >
                    ✨
              
                </Link>
          
      </button>
    </div>
  );
}

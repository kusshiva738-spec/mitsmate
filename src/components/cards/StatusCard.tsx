export default function StatusCard() {

  return (

    <div className="bg-[#17122b] rounded-[30px] p-5 border border-white/10">

      <div className="flex items-start gap-4">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-2xl">
          👥
        </div>

        <div>

          <h2 className="text-white text-xl font-bold">
            Friendship Mode
          </h2>

          <p className="text-white/60 mt-2 text-sm leading-relaxed">
            You're visible to students open for friendship.
          </p>

        </div>

      </div>

      <button className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 py-3 rounded-2xl text-white font-semibold">
        You're Open 🎉
      </button>

    </div>
  );
}
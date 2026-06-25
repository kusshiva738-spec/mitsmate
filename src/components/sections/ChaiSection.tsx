type Props = {
  user: any;
};

export default function ChaiCard({
  user,
}: Props) {

  return (

    <div className="bg-[#17122b] border border-orange-500/20 rounded-[30px] overflow-hidden">

      <img
        src={
          user?.avatar_url ||
          "https://i.pravatar.cc/300"
        }
        className="w-full h-[240px] object-cover"
      />

      <div className="p-5">

        <div className="flex items-center justify-between">

          <h2 className="text-white text-2xl font-bold">
            {user?.full_name}
          </h2>

          <div className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs">

            OPEN ☕

          </div>

        </div>

        <p className="text-white/60 mt-2">
          {user?.branch}
        </p>

        <button className="w-full mt-5 bg-orange-500 hover:bg-orange-400 transition py-3 rounded-2xl text-white font-semibold">

          Ask for Chai ☕

        </button>

      </div>

    </div>
  );
}
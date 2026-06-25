type Props = {
  openFriendship?: boolean;
  openChai?: boolean;
};

export default function FriendshipStatus({
  openFriendship,
  openChai,
}: Props) {

  return (

    <div className="grid md:grid-cols-2 gap-5">

      <div className="bg-[#17122b] border border-white/10 rounded-[32px] p-6">

        <h3 className="text-xl font-bold text-white">
          Friendship Mode
        </h3>

        <div className="mt-4">

          {openFriendship ? (

            <div className="bg-green-500/20 text-green-400 px-4 py-3 rounded-2xl inline-block">
              Open for Friendship 🎉
            </div>

          ) : (

            <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-2xl inline-block">
              Closed Right Now
            </div>

          )}

        </div>

      </div>

      <div className="bg-[#17122b] border border-white/10 rounded-[32px] p-6">

        <h3 className="text-xl font-bold text-white">
          Chai Mode ☕
        </h3>

        <div className="mt-4">

          {openChai ? (

            <div className="bg-orange-500/20 text-orange-400 px-4 py-3 rounded-2xl inline-block">
              Open for Chai
            </div>

          ) : (

            <div className="bg-white/10 text-white/60 px-4 py-3 rounded-2xl inline-block">
              Not Available
            </div>

          )}

        </div>

      </div>

    </div>
  );
}
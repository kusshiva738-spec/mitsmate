type User = {
  id: string;
  full_name: string;
  branch: string;
  year: string;
  bio: string;
  interests: string;
};

export default function UserCard({
  user,
}: {
  user: User;
}) {

  return (

    <div className="bg-[#17122b] rounded-3xl p-5 border border-white/10">

      <div className="h-[220px] rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500" />

      <h2 className="text-white text-2xl font-bold mt-5">
        {user.full_name}
      </h2>

      <p className="text-white/60 mt-1">
        {user.branch} • {user.year}
      </p>

      <p className="text-white/70 mt-4 text-sm">
        {user.bio}
      </p>

      <div className="flex flex-wrap gap-2 mt-5">

        {user.interests
          ?.split(",")
          .map((item) => (

            <div
              key={item}
              className="bg-white/10 px-3 py-1 rounded-full text-xs text-white"
            >
              {item}
            </div>
          ))}
      </div>

      <button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-500 py-3 rounded-2xl text-white">
        Say Hi 👋
      </button>

    </div>
  );
}
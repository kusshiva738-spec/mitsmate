type ProfileHeaderProps = {
  user: any;
};

export default function ProfileHeader({
  user,
}: ProfileHeaderProps) {

  return (

    <div className="bg-[#17122b] border border-white/10 rounded-[32px] p-6 flex flex-col md:flex-row gap-6 items-center">

      <img
        src={
          user?.avatar_url ||
          "https://i.pravatar.cc/300"
        }
        className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
      />

      <div className="flex-1">

        <h1 className="text-3xl font-bold text-white">
          {user?.full_name || "Student"}
        </h1>

        <p className="text-white/60 mt-2">
          {user?.year || "Year"} • {user?.branch || "Branch"}
        </p>

        <p className="text-white/50 mt-4">
          {user?.email}
        </p>

      </div>

    </div>
  );
}
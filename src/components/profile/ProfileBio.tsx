type Props = {
  bio?: string;
};

export default function ProfileBio({
  bio,
}: Props) {

  return (

    <div className="bg-[#17122b] border border-white/10 rounded-[32px] p-6">

      <h2 className="text-2xl font-bold text-white">
        Bio
      </h2>

      <p className="text-white/60 mt-4 leading-relaxed">
        {bio || "No bio added yet."}
      </p>

    </div>
  );
}
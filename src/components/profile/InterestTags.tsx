type Props = {
  interests?: string[];
};

export default function InterestTags({
  interests,
}: Props) {

  return (

    <div className="bg-[#17122b] border border-white/10 rounded-[32px] p-6">

      <h2 className="text-2xl font-bold text-white mb-5">
        Interests
      </h2>

      <div className="flex flex-wrap gap-3">

        {interests?.length ? (
          interests.map((item: string) => (

            <div
              key={item}
              className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm"
            >
              {item}
            </div>

          ))
        ) : (

          <p className="text-white/50">
            No interests added.
          </p>

        )}

      </div>

    </div>
  );
}
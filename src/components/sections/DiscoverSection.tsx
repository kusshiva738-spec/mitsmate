import UserCard from "@/components/cards/UserCard";

type Props = {
  users: any[];
};

export default function DiscoverSection({
  users,
}: Props) {

  return (

    <section>

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-3xl font-bold text-white">
          Discover People
        </h2>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        {users.map((user) => (

          <UserCard
            key={user.id}
            user={user}
          />

        ))}

      </div>

    </section>
  );
}
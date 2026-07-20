import Link from "next/link";
import { getAllBoats } from "@/db/queries";
import { formatEuros } from "@/lib/pricing";

export default async function AdminBoatsPage() {
  const boats = await getAllBoats();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-marine-950">Boats</h1>
        <Link
          href="/admin/boats/new"
          className="rounded-full bg-marine-950 px-5 py-2 text-sm uppercase tracking-widest text-sand-50 hover:bg-marine-900"
        >
          New boat
        </Link>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-marine-950/10 text-left text-xs uppercase tracking-wide text-marine-900/50">
            <th className="py-3">Name</th>
            <th className="py-3">Slug</th>
            <th className="py-3">Full day</th>
            <th className="py-3">Published</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {boats.map((boat) => (
            <tr key={boat.id} className="border-b border-marine-950/5">
              <td className="py-3 text-marine-950">{boat.nameEn}</td>
              <td className="py-3 text-marine-900/60">{boat.slug}</td>
              <td className="py-3 text-marine-900/60">
                {boat.priceFullDay > 0 ? formatEuros(boat.priceFullDay, "en") : "—"}
              </td>
              <td className="py-3 text-marine-900/60">
                {boat.isPublished ? "Yes" : "No"}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/boats/${boat.id}/edit`}
                  className="text-marine-700 hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

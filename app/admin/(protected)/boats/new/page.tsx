import BoatFormFields from "../boat-form";
import { createBoat } from "../actions";

export default function NewBoatPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-marine-950">New boat</h1>
      <form action={createBoat} className="mt-8">
        <BoatFormFields isNew />
        <button
          type="submit"
          className="mt-8 rounded-full bg-gold-500 px-8 py-3 text-sm uppercase tracking-widest text-marine-950 hover:bg-gold-300"
        >
          Create boat
        </button>
      </form>
    </div>
  );
}

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
          className="mt-8 rounded-full bg-marine-950 px-8 py-3 text-sm uppercase tracking-widest text-sand-50 hover:bg-marine-900"
        >
          Create boat
        </button>
      </form>
    </div>
  );
}

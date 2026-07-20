type BoatFormValues = {
  slug?: string;
  nameEn?: string;
  nameEs?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  lengthFt?: number;
  capacity?: number;
  cabins?: number;
  homeMarina?: string;
  priceFullDay?: number;
  priceMorning?: number;
  priceAfternoon?: number;
  sortOrder?: number;
  isPublished?: boolean;
};

const inputClass =
  "w-full rounded-sm border border-marine-950/20 bg-white px-4 py-2.5 text-marine-950 focus:border-marine-700 focus:outline-none";
const labelClass = "text-xs uppercase tracking-wide text-marine-900/50";

export default function BoatFormFields({
  boat,
  isNew,
}: {
  boat?: BoatFormValues;
  isNew: boolean;
}) {
  return (
    <div className="grid gap-6">
      {isNew && (
        <div>
          <label className={labelClass}>Slug</label>
          <input
            required
            name="slug"
            className={inputClass}
            placeholder="e.g. cranchi-32"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name (EN)</label>
          <input required name="nameEn" defaultValue={boat?.nameEn} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Name (ES)</label>
          <input required name="nameEs" defaultValue={boat?.nameEs} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Description (EN)</label>
          <textarea
            required
            name="descriptionEn"
            defaultValue={boat?.descriptionEn}
            rows={4}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description (ES)</label>
          <textarea
            required
            name="descriptionEs"
            defaultValue={boat?.descriptionEs}
            rows={4}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Length (ft)</label>
          <input
            required
            type="number"
            name="lengthFt"
            defaultValue={boat?.lengthFt}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Capacity</label>
          <input
            required
            type="number"
            min={1}
            name="capacity"
            defaultValue={boat?.capacity}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Cabins</label>
          <input
            required
            type="number"
            name="cabins"
            defaultValue={boat?.cabins}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Sort order</label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={boat?.sortOrder ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Home marina</label>
        <input
          required
          name="homeMarina"
          defaultValue={boat?.homeMarina}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Full day price (€)</label>
          <input
            required
            type="number"
            step="1"
            min={0}
            name="priceFullDay"
            defaultValue={boat?.priceFullDay ? boat.priceFullDay / 100 : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Morning price (€)</label>
          <input
            required
            type="number"
            step="1"
            min={0}
            name="priceMorning"
            defaultValue={boat?.priceMorning ? boat.priceMorning / 100 : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Afternoon price (€)</label>
          <input
            required
            type="number"
            step="1"
            min={0}
            name="priceAfternoon"
            defaultValue={boat?.priceAfternoon ? boat.priceAfternoon / 100 : undefined}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-marine-950">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={boat?.isPublished ?? true}
          className="h-4 w-4 accent-marine-700"
        />
        Published (visible on the public site)
      </label>
    </div>
  );
}

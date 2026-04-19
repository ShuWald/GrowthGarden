import Image from "next/image";

import type { PlantDefinition } from "@/lib/plants";

type PlantLibraryProps = {
  plants: readonly PlantDefinition[];
  selectedPlantId: string;
  onPlantSelect: (plantId: string) => void;
};

export function PlantLibrary({
  plants,
  selectedPlantId,
  onPlantSelect,
}: PlantLibraryProps) {
  return (
    <section className="garden-card rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
            Plant Library
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Swap plants without touching the layout
          </h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-foreground/72">
          Each card is driven by the registry in <code>lib/plants.ts</code> and
          a matching image folder in <code>public/plants</code>.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plants.map((plant) => {
          const previewStage = plant.stages[plant.stages.length - 1];
          const isSelected = plant.id === selectedPlantId;

          return (
            <button
              key={plant.id}
              type="button"
              onClick={() => onPlantSelect(plant.id)}
              className={[
                "group rounded-[1.6rem] border p-4 text-left",
                "bg-surface-strong/88 shadow-[0_18px_40px_-32px_rgba(43,63,45,0.55)]",
                isSelected
                  ? "border-moss bg-[rgba(246,248,239,0.98)] ring-2 ring-moss/25"
                  : "border-border hover:-translate-y-0.5 hover:border-moss/60 hover:bg-white",
              ].join(" ")}
            >
              <div className="relative overflow-hidden rounded-[1.2rem] border border-border bg-[linear-gradient(180deg,#f7f4ec_0%,#edf1e5_100%)]">
                <div className="absolute inset-x-0 top-0 h-14 bg-[radial-gradient(circle_at_top_left,rgba(159,178,143,0.28),transparent_60%)]" />
                <div className="relative aspect-[4/3]">
                  <Image
                    src={previewStage.imageSrc}
                    alt={previewStage.alt}
                    fill
                    sizes="(min-width: 1280px) 24vw, (min-width: 640px) 42vw, 100vw"
                    className="object-contain p-4"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl text-foreground">
                    {plant.name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-foreground/58">
                    {plant.stages.length} stages
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="mt-1 h-3 w-3 rounded-full border border-white/70 shadow-sm"
                  style={{ backgroundColor: plant.accent }}
                />
              </div>

              <p className="mt-3 text-sm leading-7 text-foreground/72">
                {plant.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

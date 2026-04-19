import Image from "next/image";

import type { PlantDefinition, PlantStage } from "@/lib/plants";

type PlantDisplayProps = {
  plant: PlantDefinition;
  stage: PlantStage;
  stageIndex: number;
};

export function PlantDisplay({
  plant,
  stage,
  stageIndex,
}: PlantDisplayProps) {
  return (
    <section className="garden-card relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(159,178,143,0.34),transparent_64%),radial-gradient(circle_at_top_right,rgba(239,228,181,0.34),transparent_56%)]" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">
              Garden Preview
            </p>
            <h2 className="mt-2 font-serif text-3xl text-foreground sm:text-[2.5rem]">
              {plant.name}
            </h2>
            <p className="mt-2 text-sm italic text-foreground/70">
              {plant.botanicalName}
            </p>
          </div>
          <div className="rounded-full border border-border bg-surface-strong px-4 py-2 text-sm text-foreground/80">
            Stage {stageIndex + 1} of {plant.stages.length}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,#f8f6ef_0%,#eef2e5_64%,#e2e8d6_100%)]">
          <div className="garden-grid absolute inset-0 opacity-60" />
          <div className="absolute left-6 top-6 h-18 w-18 rounded-full bg-[rgba(255,255,255,0.45)] blur-2xl sm:h-24 sm:w-24" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-[radial-gradient(circle_at_top,rgba(128,94,64,0.18),transparent_58%),linear-gradient(180deg,rgba(201,170,136,0)_0%,rgba(201,170,136,0.24)_100%)]" />
          <div className="relative aspect-[4/3] min-h-[320px] sm:min-h-[420px]">
            <Image
              src={stage.imageSrc}
              alt={stage.alt}
              fill
              priority
              sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 52vw, 100vw"
              className="object-contain p-6 sm:p-10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-[1.5rem] border border-border bg-surface-strong/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
              Current Stage
            </p>
            <h3 className="mt-2 font-serif text-2xl text-foreground">
              {stage.label}
            </h3>
            <p className="mt-3 text-sm leading-7 text-foreground/78">
              {stage.note}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-surface-strong/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
              Care Note
            </p>
            <p className="mt-3 text-sm leading-7 text-foreground/78">
              {plant.careNote}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

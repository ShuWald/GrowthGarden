"use client";

import { useState } from "react";

import { PlantDisplay } from "@/components/PlantDisplay";
import { PlantLibrary } from "@/components/PlantLibrary";
import type { PlantDefinition } from "@/lib/plants";

type GardenDashboardProps = {
  plants: PlantDefinition[];
};

export function GardenDashboard({ plants }: GardenDashboardProps) {
  const [selectedPlantId, setSelectedPlantId] = useState(plants[0]?.id ?? "");
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);

  const selectedPlant =
    plants.find((plant) => plant.id === selectedPlantId) ?? plants[0];

  if (!selectedPlant) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="garden-card max-w-xl rounded-[2rem] p-8 text-center">
          <h1 className="font-serif text-3xl text-foreground">
            No plants in the catalog yet
          </h1>
          <p className="mt-4 text-sm leading-7 text-foreground/75">
            Add a plant entry in <code>frontend/lib/plants.ts</code> and pair it
            with local assets under <code>frontend/public/plants</code>.
          </p>
        </div>
      </main>
    );
  }

  const safeStageIndex = Math.min(
    selectedStageIndex,
    selectedPlant.stages.length - 1,
  );
  const selectedStage = selectedPlant.stages[safeStageIndex];
  const totalStages = plants.reduce((sum, plant) => sum + plant.stages.length, 0);

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(173,194,151,0.44),transparent_60%)]" />
      <div className="absolute -left-16 top-20 h-44 w-44 rounded-full bg-[rgba(239,228,181,0.34)] blur-3xl" />
      <div className="absolute -right-16 top-64 h-56 w-56 rounded-full bg-[rgba(159,178,143,0.28)] blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <section className="garden-card relative overflow-hidden rounded-[2.25rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(159,178,143,0.16),transparent_36%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-moss">
                Growth Garden
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                A soft garden interface built to let your plants change without
                rewriting the page.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-foreground/75 sm:text-lg">
                Browse each plant, preview its growth stages, and keep every
                image local so swapping assets is a simple content task instead
                of a component refactor.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-foreground/76 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-border bg-surface-strong/88 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Catalog
                </p>
                <p className="mt-2 font-serif text-3xl text-foreground">
                  {plants.length}
                </p>
                <p className="mt-1">Plants ready to preview</p>
              </div>
              <div className="rounded-[1.4rem] border border-border bg-surface-strong/88 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Stages
                </p>
                <p className="mt-2 font-serif text-3xl text-foreground">
                  {totalStages}
                </p>
                <p className="mt-1">Flexible stage images</p>
              </div>
              <div className="rounded-[1.4rem] border border-border bg-surface-strong/88 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Assets
                </p>
                <p className="mt-2 font-serif text-3xl text-foreground">
                  Local
                </p>
                <p className="mt-1">Stored under `public/plants`</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <PlantDisplay
            plant={selectedPlant}
            stage={selectedStage}
            stageIndex={safeStageIndex}
          />

          <aside className="garden-card rounded-[2rem] p-5 sm:p-6">
            <div className="flex h-full flex-col gap-6">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Selected Plant
                </p>
                <h2 className="mt-2 font-serif text-3xl text-foreground">
                  {selectedPlant.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-foreground/76">
                  {selectedPlant.description}
                </p>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                      Stage Rail
                    </p>
                    <p className="mt-2 text-sm text-foreground/72">
                      Click through any available stage without introducing
                      scoring logic yet.
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-surface-strong px-3 py-1 text-xs uppercase tracking-[0.18em] text-foreground/65">
                    Preview only
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {selectedPlant.stages.map((stage, index) => {
                    const isActive = index === safeStageIndex;

                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setSelectedStageIndex(index)}
                        className={[
                          "flex items-center gap-4 rounded-[1.4rem] border px-4 py-3 text-left",
                          isActive
                            ? "border-moss bg-[rgba(242,246,237,0.95)] shadow-[0_18px_36px_-30px_rgba(50,77,57,0.55)]"
                            : "border-border bg-surface-strong/75 hover:border-moss/60 hover:bg-white",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                            isActive
                              ? "border-moss bg-moss text-white"
                              : "border-border bg-white text-foreground/70",
                          ].join(" ")}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">
                            {stage.label}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-foreground/68">
                            {stage.note}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-border bg-surface-strong/82 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Asset Workflow
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-foreground/75">
                  <p>
                    1. Add or replace image files in{" "}
                    <code>frontend/public/plants/&lt;plant-id&gt;/</code>.
                  </p>
                  <p>
                    2. Register the new plant or stage paths in{" "}
                    <code>frontend/lib/plants.ts</code>.
                  </p>
                  <p>
                    3. Feed a future backend-driven stage index into this same
                    UI without changing the asset structure.
                  </p>
                </div>
              </section>
            </div>
          </aside>
        </section>

        <PlantLibrary
          plants={plants}
          selectedPlantId={selectedPlant.id}
          onPlantSelect={(plantId) => {
            setSelectedPlantId(plantId);
            setSelectedStageIndex(0);
          }}
        />
      </div>
    </main>
  );
}

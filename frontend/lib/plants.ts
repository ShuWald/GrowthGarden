export type PlantStage = {
  id: string;
  label: string;
  imageSrc: string;
  alt: string;
  note: string;
};

export type PlantDefinition = {
  id: string;
  name: string;
  botanicalName: string;
  description: string;
  careNote: string;
  accent: string;
  stages: PlantStage[];
};

// Centralize plant content here so images can be added, removed, or replaced
// without touching any page or component logic.
export const PLANT_CATALOG: PlantDefinition[] = [
  {
    id: "sunflower",
    name: "Sunflower",
    botanicalName: "Helianthus annuus",
    description:
      "Bright, optimistic growth with a clear journey from tucked-away seed to open bloom.",
    careNote: "Thrives with strong light and a little breathing room between waterings.",
    accent: "#d69942",
    stages: [
      {
        id: "seed",
        label: "Seed",
        imageSrc: "/plants/sunflower/seed.svg",
        alt: "A sunflower seed nestled in warm soil.",
        note: "Dormant, grounded, and ready for the first stretch upward.",
      },
      {
        id: "sprout",
        label: "Sprout",
        imageSrc: "/plants/sunflower/sprout.svg",
        alt: "A young sunflower sprout with two fresh leaves.",
        note: "The first green leaves appear with a sturdy little stem.",
      },
      {
        id: "bud",
        label: "Bud",
        imageSrc: "/plants/sunflower/bud.svg",
        alt: "A sunflower plant with a developing golden bud.",
        note: "Structure is in place and the bloom is beginning to gather.",
      },
      {
        id: "bloom",
        label: "Bloom",
        imageSrc: "/plants/sunflower/bloom.svg",
        alt: "A fully opened sunflower standing above the soil.",
        note: "The full reward stage with bright petals and a wide-open face.",
      },
    ],
  },
  {
    id: "basil",
    name: "Basil",
    botanicalName: "Ocimum basilicum",
    description:
      "A soft kitchen-garden herb with compact leaves and a calming green silhouette.",
    careNote: "Prefers warm light, regular pinching, and evenly damp soil.",
    accent: "#5a8a58",
    stages: [
      {
        id: "seed",
        label: "Seed",
        imageSrc: "/plants/basil/seed.svg",
        alt: "Tiny basil seeds resting in a shallow bed of soil.",
        note: "A quiet starting point with small seeds spread near the surface.",
      },
      {
        id: "sprout",
        label: "Sprout",
        imageSrc: "/plants/basil/sprout.svg",
        alt: "A basil sprout with rounded early leaves.",
        note: "Tender early leaves emerge in a compact, rounded shape.",
      },
      {
        id: "harvest",
        label: "Harvestable",
        imageSrc: "/plants/basil/harvest.svg",
        alt: "A mature basil plant with layered leafy stems.",
        note: "Dense foliage is ready for a harvest-focused stage in future scoring.",
      },
    ],
  },
  {
    id: "tomato",
    name: "Tomato Vine",
    botanicalName: "Solanum lycopersicum",
    description:
      "A taller garden plant that shows a longer life cycle from seedling to fruiting vine.",
    careNote: "Needs support as it climbs and benefits from deep, regular watering.",
    accent: "#bf5c4d",
    stages: [
      {
        id: "seed",
        label: "Seed",
        imageSrc: "/plants/tomato/seed.svg",
        alt: "A tomato seed planted in soft raised soil.",
        note: "The vine begins with a single seed tucked low in the bed.",
      },
      {
        id: "sprout",
        label: "Sprout",
        imageSrc: "/plants/tomato/sprout.svg",
        alt: "A tomato sprout with a thin stem and small leaves.",
        note: "Delicate leaf pairs start to form on a narrow stem.",
      },
      {
        id: "leafing",
        label: "Leafing",
        imageSrc: "/plants/tomato/leafing.svg",
        alt: "A tomato plant with multiple branching leaves.",
        note: "The structure broadens before flowers or fruit arrive.",
      },
      {
        id: "flowering",
        label: "Flowering",
        imageSrc: "/plants/tomato/flowering.svg",
        alt: "A tomato vine carrying yellow blossoms.",
        note: "Flower clusters mark the transition toward productive growth.",
      },
      {
        id: "fruiting",
        label: "Fruiting",
        imageSrc: "/plants/tomato/fruiting.svg",
        alt: "A tomato vine with ripe red tomatoes.",
        note: "A high-energy final stage with visible fruit ready to be scored later.",
      },
    ],
  },
];

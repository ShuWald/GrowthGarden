import { GardenDashboard } from "@/components/GardenDashboard";
import { PLANT_CATALOG } from "@/lib/plants";

export default function Home() {
  return <GardenDashboard plants={PLANT_CATALOG} />;
}

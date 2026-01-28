import { ClientPage } from "../components/ClientPage";
import { WidgetScriptLoader } from "../components/WidgetScriptLoader";
import { fetchAcrossStats } from "../lib/across-stats";

export default async function Home() {
  const acrossStats = await fetchAcrossStats();

  return (
    <>
      <WidgetScriptLoader />
      <ClientPage acrossStats={acrossStats} />
    </>
  );
}

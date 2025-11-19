import { ClientPage } from "../components/ClientPage";
import { WidgetScriptLoader } from "../components/WidgetScriptLoader";

export default function Home() {
  return (
    <>
      <WidgetScriptLoader />
      <ClientPage />
    </>
  );
}

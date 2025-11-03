import { loadWidgetScript } from "../lib/load-widget-script";
import { ClientPage } from "../components/ClientPage";
import Script from "next/script";

export default async function Home() {
  // Load widget script on the server side (runs once during build)
  const widgetScript = await loadWidgetScript();

  return (<>
    <ClientPage widgetScript={widgetScript} />
    <Script id="donation-widget-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: widgetScript }} />
  </>);
}

import styles from "./ServiceLayout.module.css";
import { MapContainer } from "./MapContainer";
import { MapResultPanel } from "./MapResultPanel";
import { ServiceSidebar } from "./ServiceSidebar";

export function ServiceLayout() {
  return (
    <section className={styles.workspace} aria-label="도시계획 분석 워크스페이스">
      <ServiceSidebar />
      <MapContainer />
      <MapResultPanel />
    </section>
  );
}

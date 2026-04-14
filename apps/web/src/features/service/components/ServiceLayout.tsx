import styles from "./ServiceLayout.module.css";
import { ServiceMapPlaceholder } from "./ServiceMapPlaceholder";
import { ServiceSidebar } from "./ServiceSidebar";
import { ServiceTopHeader } from "./ServiceTopHeader";

export function ServiceLayout() {
  return (
    <section className={styles.workspace}>
      <ServiceTopHeader />
      <div className={styles.contentArea}>
        <ServiceSidebar />
        <ServiceMapPlaceholder />
      </div>
    </section>
  );
}

import React, { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Location, ArrowLeft } from "@carbon/react/icons";
import { formatDate, useSession } from "@openmrs/esm-framework";
import styles from "./header.scss";

const Header: React.FC<{
  title?: string;
  illustrationComponent: JSX.Element;
  backButton?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, illustrationComponent, backButton }) => {
  const { t } = useTranslation();
  const userSession = useSession();
  const userLocation = userSession?.sessionLocation?.display;

  return (
    <>
      <div className={styles.header}>
        <div className={styles["left-justified-items"]}>
          {backButton && (
            <button className={styles.backButton} onClick={backButton.onClick}>
              <ArrowLeft size={16} />
              {backButton.label}
            </button>
          )}
          {illustrationComponent}
          <div className={styles["page-labels"]}>
            <p>{t("facility", "Facility")}</p>
            <p className={styles["page-name"]}>
              {title ?? t("healthExchange", "Facility")}
            </p>
          </div>
        </div>
        <div className={styles["right-justified-items"]}>
          <div className={styles["date-and-location"]}>
            <Location size={16} />
            <span className={styles.value}>{userLocation}</span>
            <span className={styles.middot}>&middot;</span>
            <Calendar size={16} />
            <span className={styles.value}>
              {formatDate(new Date(), { mode: "standard" })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;

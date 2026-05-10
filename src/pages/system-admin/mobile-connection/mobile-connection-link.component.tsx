import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tile } from '@carbon/react';
import { useLocation } from 'react-router-dom';
import { ExtensionSlot } from '@openmrs/esm-framework';
import styles from './mobile-connection-link.scss';

const MobileConnectionLink: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Tile className={styles.tile}>
      <ExtensionSlot
        name="mobile-connection-left-panel-slot"
        state={{
          basePath: location.pathname,
        }}
      />
    </Tile>
  );
};

export default MobileConnectionLink;

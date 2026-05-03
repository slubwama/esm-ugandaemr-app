import React from 'react';
import styles from '../item.scss';
import { Connect } from '@carbon/react/icons';
import Item from '../item.component';

const SyncConfigurationApp = () => {
  return <Item className={styles.customTile} title="Sync Configuration" to="sync/configuration" icon={Connect} />;
};

export default SyncConfigurationApp;

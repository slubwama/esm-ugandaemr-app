import React from 'react';
import styles from '../item.scss';
import { Settings } from '@carbon/react/icons';
import Item from '../item.component';

const SystemAdminApp = () => {
  return <Item className={styles.customTile} title="System Admin" to="system-admin" icon={Settings} />;
};

export default SystemAdminApp;

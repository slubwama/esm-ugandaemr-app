import React from 'react';
import styles from '../item.scss';
import { Play } from '@carbon/react/icons';
import Item from '../item.component';

const RunReportsItem = () => {
  return <Item className={styles.customTile} title="Run Reports" to="report-builder/run" icon={Play} />;
};

export default RunReportsItem;

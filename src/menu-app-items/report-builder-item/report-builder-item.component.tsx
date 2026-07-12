import React from 'react';
import styles from '../item.scss';
import { ReportData } from '@carbon/react/icons';
import Item from '../item.component';

const ReportBuilderApp = () => {
  return <Item className={styles.customTile} title="Report Builder" to="report-builder" icon={ReportData} />;
};

export default ReportBuilderApp;

import React, { useMemo } from 'react';
import last from 'lodash/last';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ConfigurableLink } from '@openmrs/esm-framework';
import { type CarbonIconType } from '@carbon/react/icons';

export interface LinkConfig {
  name: string;
  title: string;
  slot?: string;
  icon?: CarbonIconType;
}

function LinkExtension({ config }: { config: LinkConfig }) {
  const { name, title, icon: Icon } = config;
  const location = useLocation();

  let urlSegment = useMemo(
    () => decodeURIComponent(last(location.pathname.split('/'))),
    [location.pathname]
  );

  const isUUID = (value) => {
    const regex =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    return regex.test(value);
  };

  if (isUUID(urlSegment)) {
    urlSegment = 'overview';
  }

  return (
    <ConfigurableLink
      to={`${window.getOpenmrsSpaBase()}system-admin${
        name ? `/${name}` : ''
      }`}
      className={`cds--side-nav__link ${
        name === urlSegment && 'active-left-nav-link'
      }`}
    >
      {Icon && <Icon size={20} />}
      <span>{title}</span>
    </ConfigurableLink>
  );
}

export const createLeftPanelLink = (config: LinkConfig) => () =>
  (
    <BrowserRouter>
      <LinkExtension config={config} />
    </BrowserRouter>
  );

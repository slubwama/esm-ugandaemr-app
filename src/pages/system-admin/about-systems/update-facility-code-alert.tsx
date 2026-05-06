import React, { useEffect, useState } from 'react';
import { ActionableNotification } from '@carbon/react';
import { navigate, UserHasAccess } from '@openmrs/esm-framework';
import { useRetrieveFacilityCode } from './about-systems.resources';
import { PRIVILEGE_UPDATE_FACILITY_CODE } from '../../../constants';

const UpdateFacilityCodeAlert = () => {
  const [showAlert, setShowAlert] = useState(false);

  const { facilityIds, isLoading, isError } = useRetrieveFacilityCode();

  useEffect(() => {
    if (facilityIds && facilityIds.length) {
      if (facilityIds[0]['value'] === null) {
        setShowAlert(true);
      } else {
        setShowAlert(false);
      }
    }
  }, [facilityIds]);

  const handleClose = () => {
    setShowAlert(false);
  };

  if (showAlert) {
    return (
      <UserHasAccess privilege={PRIVILEGE_UPDATE_FACILITY_CODE}>
        <ActionableNotification
          actionButtonLabel="Go to About Systems"
          aria-label="closes notification"
          onActionButtonClick={() => navigate({ to: '${openmrsSpaBase}/system-admin' })}
          onClose={handleClose}
          inline={true}
          statusIconDescription="notification"
          role="alert"
          kind="warning"
          subtitle="Check the About Systems page to ensure the facility details are up to date"
          title="Update Facility Information"
        />
      </UserHasAccess>
    );
  }
};

export default UpdateFacilityCodeAlert;

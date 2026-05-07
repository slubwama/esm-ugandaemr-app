import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Select,
  SelectItem,
  InlineLoading,
  Tag,
} from '@carbon/react';
import { TrashCan, Renew, Group } from '@carbon/react/icons';
import { showNotification, showSnackbar, openmrsFetch } from '@openmrs/esm-framework';
import {
  useCohortTypes,
  removePatientFromCohort,
  getPatientData,
} from './cohort-management.resources';
import { type CohortType, type Patient } from './cohort-management.types';
import SystemAdminDataTable from '../shared-components/data-table';
import styles from './cohort-management.scss';

interface PatientMember {
  uuid: string;
  patient: Patient;
  cohortName: string;
  startDate: string;
}

const PatientExit: React.FC = () => {
  const { t } = useTranslation();
  const { cohortTypes, isLoading: typesLoading, isError: typesError } = useCohortTypes();

  const [selectedCohortType, setSelectedCohortType] = useState('');
  const [patients, setPatients] = useState<Array<PatientMember>>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Load patients when cohort type changes
  const loadPatientsForCohortType = useCallback(async (cohortTypeUuid: string) => {
    if (!cohortTypeUuid) {
      setPatients([]);
      return;
    }

    setIsLoadingPatients(true);
    try {
      const response = await openmrsFetch(
        `/ws/rest/v1/cohortm/cohort?v=custom:(name,cohortMembers,voided)&cohortType=${cohortTypeUuid}`
      );
      const cohorts = response.data.results;

      const allPatients: Array<PatientMember> = [];

      for (const cohort of cohorts) {
        if (!cohort.voided && cohort.cohortMembers && cohort.cohortMembers.length > 0) {
          for (const member of cohort.cohortMembers) {
            if (!member.voided) {
              try {
                const patientUri = member.patient.links[0]?.uri;
                if (patientUri) {
                  const person = await getPatientData(patientUri);
                  const startDate = new Date(member.startDate).toLocaleDateString();

                  allPatients.push({
                    uuid: member.uuid,
                    patient: person,
                    cohortName: cohort.name,
                    startDate: startDate,
                  });
                }
              } catch (error) {
                console.error('Error fetching patient data:', error);
              }
            }
          }
        }
      }

      setPatients(allPatients);
    } catch (error) {
      showNotification({
        title: t('errorLoadingPatients', 'Error loading patients'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    } finally {
      setIsLoadingPatients(false);
    }
  }, [t]);

  // Load patients when selected cohort type changes
  React.useEffect(() => {
    if (selectedCohortType) {
      loadPatientsForCohortType(selectedCohortType);
    } else {
      setPatients([]);
    }
  }, [selectedCohortType, loadPatientsForCohortType]);

  const handleRefresh = useCallback(async () => {
    if (selectedCohortType) {
      await loadPatientsForCohortType(selectedCohortType);
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('refreshSuccess', 'Refresh Successful'),
        subtitle: t('dataRefreshed', 'Data has been refreshed'),
        autoClose: true,
      });
    }
  }, [selectedCohortType, loadPatientsForCohortType, t]);

  const handleRemovePatient = useCallback(
    async (memberUuid: string) => {
      if (!confirm(t('confirmRemovePatient', 'Are you sure you want to remove this patient from the group?'))) {
        return;
      }

      try {
        await removePatientFromCohort(memberUuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('patientRemoved', 'Patient Removed'),
          subtitle: t('patientRemovedSuccess', 'Client removed from group successfully'),
          autoClose: true,
        });

        if (selectedCohortType) {
          await loadPatientsForCohortType(selectedCohortType);
        }
      } catch (error) {
        showNotification({
          title: t('errorRemovingPatient', 'Error removing patient'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, selectedCohortType, loadPatientsForCohortType]
  );

  const columns = [
    { key: 'name', header: t('name', 'Name') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'birthdate', header: t('birthdate', 'Birthdate') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'group', header: t('group', 'Group') },
    { key: 'dateEnrolled', header: t('dateEnrolled', 'Date Enrolled on Program') },
    { key: 'actions', header: t('actions', 'Actions') },
  ];

  const renderCell = (columnKey: string, row: PatientMember) => {
    switch (columnKey) {
      case 'name':
        return row.patient.display;
      case 'age':
        return row.patient.age;
      case 'birthdate':
        return new Date(row.patient.birthdate).toLocaleDateString();
      case 'gender':
        return row.patient.gender;
      case 'group':
        return row.cohortName;
      case 'dateEnrolled':
        return row.startDate;
      case 'actions':
        return (
          <Button
            kind="ghost"
            renderIcon={TrashCan}
            iconDescription={t('remove', 'Remove')}
            onClick={() => handleRemovePatient(row.uuid)}
            hasIconOnly
          />
        );
      default:
        return null;
    }
  };

  if (typesLoading) {
    return (
      <div className={styles.patientExitContent}>
        <InlineLoading description={t('loading', 'Loading...')} />
      </div>
    );
  }

  if (typesError) {
    return (
      <div className={styles.patientExitContent}>
        <div className={styles.errorState}>
          <h3>{t('errorLoadingData', 'Error Loading Data')}</h3>
          <p>{typesError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.patientExitContent}>
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <Select
            id="cohort-type-select"
            labelText={t('groupType', 'Group Type')}
            value={selectedCohortType}
            onChange={(e) => setSelectedCohortType(e.target.value)}
            className={styles.cohortTypeSelect}
          >
            <SelectItem value="" text={t('select', 'Select ---')} />
            {cohortTypes.map((type) => (
              <SelectItem key={type.uuid} value={type.uuid} text={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </Select>

          <Button
            kind="ghost"
            renderIcon={Renew}
            onClick={handleRefresh}
            disabled={isLoadingPatients}
            hasIconOnly
            iconDescription={t('refresh', 'Refresh')}
          />

          {isLoadingPatients && (
            <div className={styles.loadingSection}>
              <InlineLoading />
            </div>
          )}
        </div>
      </div>

      <SystemAdminDataTable
        columns={columns}
        data={patients}
        isLoading={isLoadingPatients}
        searchPlaceholder={t('searchPatients', 'Search patients...')}
        emptyState={{
          title: t('noPatientsFound', 'No Patients Found'),
          description: t('noPatientsDesc', 'Select a group type to view enrolled patients'),
          icon: <Group size={48} />,
        }}
        renderCell={renderCell}
      />
    </div>
  );
};

export default PatientExit;

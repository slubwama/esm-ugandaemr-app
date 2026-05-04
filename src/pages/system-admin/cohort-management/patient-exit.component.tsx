import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  Button,
  Select,
  SelectItem,
  InlineLoading,
  Tag,
} from '@carbon/react';
import { TrashCan, Renew } from '@carbon/react/icons';
import { showNotification, showSnackbar, openmrsFetch } from '@openmrs/esm-framework';
import {
  useCohortTypes,
  useCohortsWithMembers,
  removePatientFromCohort,
  getPatientData,
} from './cohort-management.resources';
import { type CohortWithMembers, type CohortType, type Patient } from './cohort-management.types';
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
  const {
    cohortsWithMembers,
    isLoading: membersLoading,
    isError: membersError,
  } = useCohortsWithMembers('');

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
  }, []);

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

  const tableHeaders = useMemo(
    () => [
      { key: 'name', header: t('name', 'Name') },
      { key: 'age', header: t('age', 'Age') },
      { key: 'birthdate', header: t('birthdate', 'Birthdate') },
      { key: 'gender', header: t('gender', 'Gender') },
      { key: 'group', header: t('group', 'Group') },
      { key: 'dateEnrolled', header: t('dateEnrolled', 'Date Enrolled on Program') },
      { key: 'actions', header: t('actions', 'Actions') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      patients.map((patientMember) => {
        const birthdate = new Date(patientMember.patient.birthdate).toLocaleDateString();
        return {
          id: patientMember.uuid,
          name: patientMember.patient.display,
          age: patientMember.patient.age,
          birthdate: birthdate,
          gender: patientMember.patient.gender,
          group: patientMember.cohortName,
          dateEnrolled: patientMember.startDate,
          actions: (
            <Button
              kind="ghost"
              renderIcon={TrashCan}
              iconDescription={t('remove', 'Remove')}
              onClick={() => handleRemovePatient(patientMember.uuid)}
              hasIconOnly
            />
          ),
        };
      }),
    [patients, t, handleRemovePatient]
  );

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
            kind="tertiary"
            renderIcon={Renew}
            onClick={handleRefresh}
            disabled={isLoadingPatients}
          >
            {t('refresh', 'Refresh')}
          </Button>

          {isLoadingPatients && (
            <div className={styles.loadingSection}>
              <InlineLoading />
            </div>
          )}
        </div>
      </div>

      {patients.length > 0 ? (
        <DataTable rows={tableRows} headers={tableHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      ) : (
        !isLoadingPatients && (
          <div className={styles.emptyState}>
            <p>{t('noPatientsFound', 'No patients found for this group type')}</p>
          </div>
        )
      )}
    </div>
  );
};

export default PatientExit;

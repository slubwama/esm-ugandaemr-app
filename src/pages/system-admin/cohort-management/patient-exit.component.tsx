import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { TrashCan } from '@carbon/react/icons';
import { showNotification, showSnackbar, openmrsFetch } from '@openmrs/esm-framework';
import {
  useCohortTypes,
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
  const { fetchCohortTypes } = useCohortTypes();

  const [cohortTypes, setCohortTypes] = useState<Array<CohortType>>([]);
  const [selectedCohortType, setSelectedCohortType] = useState('');
  const [patients, setPatients] = useState<Array<PatientMember>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const fetchCohortsWithMembers = async (cohortTypeUuid: string) => {
    const response = await openmrsFetch(
      `/ws/rest/v1/cohortm/cohort?v=custom:(name,cohortMembers,voided)&cohortType=${cohortTypeUuid}`
    );
    return response.data.results;
  };

  useEffect(() => {
    const loadCohortTypes = async () => {
      try {
        const types = await fetchCohortTypes();
        setCohortTypes(types);
      } catch (error) {
        showNotification({
          title: t('errorLoadingCohortTypes', 'Error loading cohort types'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    };

    loadCohortTypes();
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      if (!selectedCohortType) {
        setPatients([]);
        return;
      }

      setIsLoadingPatients(true);
      try {
        const cohorts = await fetchCohortsWithMembers(selectedCohortType);

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
    };

    loadPatients();
  }, [selectedCohortType]);

  const handleRemovePatient = useCallback(
    async (memberUuid: string) => {
      if (!confirm(t('confirmRemovePatient', 'Are you sure you want to remove this patient from the group?'))) {
        return;
      }

      setIsLoading(true);
      try {
        await removePatientFromCohort(memberUuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('patientRemoved', 'Patient Removed'),
          subtitle: t('patientRemovedSuccess', 'Client removed from group successfully'),
          autoClose: true,
        });

        const cohorts = await fetchCohortsWithMembers(selectedCohortType);
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
          title: t('errorRemovingPatient', 'Error removing patient'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [t, selectedCohortType]
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

          {isLoadingPatients && (
            <div className={styles.loadingSection}>
              <InlineLoading />
            </div>
          )}
        </div>
      </div>

      {!selectedCohortType ? (
        <div className={styles.emptyState}>
          <p>{t('selectCohortType', 'Please select a cohort type to view patients')}</p>
        </div>
      ) : isLoadingPatients ? (
        <div className={styles.loadingSection}>
          <InlineLoading />
        </div>
      ) : patients.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('noPatientsFound', 'No patients found in this cohort')}</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default PatientExit;

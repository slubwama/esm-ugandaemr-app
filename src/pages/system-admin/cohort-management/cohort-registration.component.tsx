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
  TextInput,
  Select,
  SelectItem,
  Modal,
  FormGroup,
  InlineLoading,
} from '@carbon/react';
import { Add, Edit, TrashCan, Search } from '@carbon/react/icons';
import { showNotification, showSnackbar, openmrsFetch } from '@openmrs/esm-framework';
import {
  useCohortTypes,
  createCohort,
  updateCohort,
  deleteCohort,
  getCohortForEdit,
} from './cohort-management.resources';
import { type Cohort, type CohortFormData, type CohortType } from './cohort-management.types';
import styles from './cohort-management.scss';

const CohortRegistration: React.FC = () => {
  const { t } = useTranslation();
  const { fetchCohortTypes } = useCohortTypes();

  const [cohortTypes, setCohortTypes] = useState<Array<CohortType>>([]);
  const [cohorts, setCohorts] = useState<Array<Cohort>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCohortsByType = async (cohortTypeUuid: string) => {
    const response = await openmrsFetch(
      `/ws/rest/v1/cohortm/cohort?v=custom:(name,uuid,description,voided,cohortType,startDate)&cohortType=${cohortTypeUuid}`
    );
    return response.data.results;
  };

  const [formData, setFormData] = useState<CohortFormData>({
    name: '',
    description: '',
    uuid: '',
    cohortType: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    uuid: '',
    cohortType: '',
  });

  // Specific cohort type UUIDs from the GSP
  const cohortTypeUuids = [
    'e50fa0af-df36-4a26-853f-feb05244e5ca',
    'aa536e57-a3c3-453c-9413-cf70b5d2ad5d',
    'da964ff0-648e-440b-a219-d2aeba3670d0',
    '5b7136fa-d207-4229-94a8-da6661ae00bf',
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const types = await fetchCohortTypes();
        setCohortTypes(types);

        const allCohorts: Array<Cohort> = [];
        for (const uuid of cohortTypeUuids) {
          const typeCohorts = await fetchCohortsByType(uuid);
          allCohorts.push(...typeCohorts);
        }
        setCohorts(allCohorts);
      } catch (error) {
        showNotification({
          title: t('errorLoadingData', 'Error loading data'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const filteredCohorts = useMemo(() => {
    if (!searchQuery) return cohorts;
    const query = searchQuery.toLowerCase();
    return cohorts.filter(
      (cohort) =>
        cohort.name?.toLowerCase().includes(query) ||
        cohort.description?.toLowerCase().includes(query) ||
        cohort.cohortType?.name?.toLowerCase().includes(query)
    );
  }, [cohorts, searchQuery]);

  const handleOpenModal = useCallback(() => {
    setEditingCohort(null);
    setFormData({
      name: '',
      description: '',
      uuid: '',
      cohortType: '',
    });
    setFormErrors({
      name: '',
      description: '',
      uuid: '',
      cohortType: '',
    });
    setIsModalOpen(true);
  }, []);

  const handleEditCohort = useCallback(
    async (cohort: Cohort) => {
      setIsLoading(true);
      try {
        const data = await getCohortForEdit(cohort.uuid);
        setEditingCohort(cohort);
        setFormData({
          name: data.name,
          description: data.description,
          uuid: data.uuid,
          cohortType: data.cohortType?.uuid || cohort.cohortType?.uuid || '',
        });
        setIsModalOpen(true);
      } catch (error) {
        showNotification({
          title: t('errorLoadingCohort', 'Error loading cohort'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const handleDeleteCohort = useCallback(
    async (cohort: Cohort) => {
      if (!confirm(t('confirmDeleteCohort', 'Are you sure you want to delete this cohort?'))) {
        return;
      }

      setIsLoading(true);
      try {
        await deleteCohort(cohort.uuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('cohortDeleted', 'Cohort deleted'),
          subtitle: t('cohortDeletedSuccess', 'Cohort has been deleted successfully'),
          autoClose: true,
        });

        const allCohorts: Array<Cohort> = [];
        for (const uuid of cohortTypeUuids) {
          const typeCohorts = await fetchCohortsByType(uuid);
          allCohorts.push(...typeCohorts);
        }
        setCohorts(allCohorts);
      } catch (error) {
        showNotification({
          title: t('errorDeletingCohort', 'Error deleting cohort'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const validateForm = useCallback(() => {
    const errors = {
      name: '',
      description: '',
      uuid: '',
      cohortType: '',
    };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = t('nameRequired', 'Name is required');
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = t('descriptionRequired', 'Description is required');
      isValid = false;
    }

    if (!formData.uuid.trim()) {
      errors.uuid = t('identifierRequired', 'Identifier is required');
      isValid = false;
    } else if (/\s/.test(formData.uuid)) {
      errors.uuid = t('noSpacesAllowed', 'No spaces are allowed in the identifier');
      isValid = false;
    }

    if (!formData.cohortType) {
      errors.cohortType = t('cohortTypeRequired', 'Group type is required');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCohort) {
        await updateCohort(editingCohort.uuid, formData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('cohortUpdated', 'Cohort updated'),
          subtitle: t('cohortUpdatedSuccess', 'Cohort has been updated successfully'),
          autoClose: true,
        });
      } else {
        await createCohort(formData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('cohortCreated', 'Cohort created'),
          subtitle: t('cohortCreatedSuccess', 'Cohort has been created successfully'),
          autoClose: true,
        });
      }

      setIsModalOpen(false);

      const allCohorts: Array<Cohort> = [];
      for (const uuid of cohortTypeUuids) {
        const typeCohorts = await fetchCohortsByType(uuid);
        allCohorts.push(...typeCohorts);
      }
      setCohorts(allCohorts);
    } catch (error) {
      showNotification({
        title: editingCohort
          ? t('errorUpdatingCohort', 'Error updating cohort')
          : t('errorCreatingCohort', 'Error creating cohort'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingCohort, validateForm, t]);

  const tableHeaders = useMemo(
    () => [
      { key: 'name', header: t('name', 'Name') },
      { key: 'description', header: t('description', 'Description') },
      { key: 'cohortType', header: t('groupType', 'Group Type') },
      { key: 'createdOn', header: t('createdOn', 'Created On') },
      { key: 'identifier', header: t('identifier', 'Identifier') },
      { key: 'actions', header: t('actions', 'Actions') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      filteredCohorts
        .filter((cohort) => !cohort.voided)
        .map((cohort) => {
          const createdDate = new Date(cohort.startDate);
          return {
            id: cohort.uuid,
            name: cohort.name || '-',
            description: cohort.description || '-',
            cohortType: cohort.cohortType?.name || '-',
            createdOn: `${createdDate.getFullYear()}-${createdDate.getMonth() + 1}-${createdDate.getDate()}`,
            identifier: cohort.uuid,
            actions: (
              <div className={styles.actionButtons}>
                <Button
                  kind="ghost"
                  renderIcon={Edit}
                  iconDescription={t('edit', 'Edit')}
                  onClick={() => handleEditCohort(cohort)}
                  hasIconOnly
                />
                <Button
                  kind="ghost"
                  renderIcon={TrashCan}
                  iconDescription={t('delete', 'Delete')}
                  onClick={() => handleDeleteCohort(cohort)}
                  hasIconOnly
                />
              </div>
            ),
          };
        }),
    [filteredCohorts, t, handleEditCohort, handleDeleteCohort]
  );

  if (isLoading && cohorts.length === 0) {
    return <InlineLoading />;
  }

  return (
    <div className={styles.cohortRegistrationContent}>
      <div className={styles.headerSection}>
        <h2 className={styles.pageTitle}>{t('dsdRefillGroups', 'DSD Refill Groups')}</h2>
        <div className={styles.headerActions}>
          <TextInput
            id="cohort-search"
            labelText=""
            placeholder={t('searchCohorts', 'Search cohorts...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <Button kind="primary" renderIcon={Add} onClick={handleOpenModal}>
            {t('create', 'Create')}
          </Button>
        </div>
      </div>

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

      <Modal
        open={isModalOpen}
        modalHeading={editingCohort ? t('editCohort', 'Edit Cohort') : t('createCohort', 'Create Cohort')}
        primaryButtonText={isSubmitting ? '' : t('save', 'Save')}
        secondaryButtonText={t('cancel', 'Cancel')}
        onRequestClose={() => setIsModalOpen(false)}
        onRequestSubmit={handleSubmit}
        primaryButtonDisabled={isSubmitting}
      >
        <div className={styles.modalContent}>
          <FormGroup legendText="">
            <TextInput
              id="cohort-name"
              labelText={t('name', 'Name')}
              placeholder={t('cohortNamePlaceholder', 'CDDP Group Name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              invalid={!!formErrors.name}
              invalidText={formErrors.name}
            />
          </FormGroup>

          <FormGroup legendText="">
            <TextInput
              id="cohort-description"
              labelText={t('description', 'Description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              invalid={!!formErrors.description}
              invalidText={formErrors.description}
            />
          </FormGroup>

          <FormGroup legendText="">
            <TextInput
              id="cohort-uuid"
              labelText={t('identifierCode', 'Identifier Code')}
              value={formData.uuid}
              onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
              invalid={!!formErrors.uuid}
              invalidText={formErrors.uuid}
            />
          </FormGroup>

          <FormGroup legendText="">
            <Select
              id="cohort-type"
              labelText={t('groupType', 'Group Type')}
              value={formData.cohortType}
              onChange={(e) => setFormData({ ...formData, cohortType: e.target.value })}
              invalid={!!formErrors.cohortType}
              invalidText={formErrors.cohortType}
            >
              <SelectItem value="" text={t('select', 'Select ---')} />
              {cohortTypes.map((type) => (
                <SelectItem key={type.uuid} value={type.uuid} text={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </Select>
          </FormGroup>
        </div>
      </Modal>
    </div>
  );
};

export default CohortRegistration;

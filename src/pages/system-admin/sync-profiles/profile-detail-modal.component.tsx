import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  TextInput,
  TextArea,
  Button,
  Select,
  SelectItem,
  Tile,
  Checkbox,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  NumberInput,
  DatePicker,
  DatePickerInput,
} from '@carbon/react';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import { updateSyncProfile, createSyncProfile, testSyncConnection } from './sync-profiles.resources';
import {
  type SyncFhirProfile,
  type SyncProfileFormData,
  type ResourceSearchParameter,
  type ConceptReference,
  type CodeField,
  type EncounterTypeReference,
  type ProgramReference,
  isConceptReferenceArray,
  extractUuidsFromCode,
  isEncounterTypeReferenceArray,
  isProgramReferenceArray,
  ALL_RESOURCE_TYPES,
  CASE_BASED_RESOURCE_TYPES,
} from './sync-profiles.types';
import { getConceptsByUuids, toSelectedConcept } from './resources/concepts.resource';
import { getEncounterTypesByUuids, toSelectedEncounterType } from './resources/encountertypes.resource';
import { getProgramsByUuids, toSelectedProgram } from './resources/programs.resource';
import type { SelectedConcept } from './resources/concept-types';
import ConceptSearchMultiSelect from './resources/concept-search-multiselect.component';
import EncounterTypeSearchMultiSelect from './resources/encountertype-search-multiselect.component';
import ProgramSearchMultiSelect from './resources/program-search-multiselect.component';
import styles from './profile-detail-modal.scss';

interface ProfileDetailModalProps {
  open: boolean;
  onClose: () => void;
  profile?: SyncFhirProfile;
  onSave: () => void;
  patientIdentifierTypes?: Array<{ uuid: string; name: string }>;
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  open,
  onClose,
  profile,
  onSave,
  patientIdentifierTypes = [],
}) => {
  const { t } = useTranslation();

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const [formData, setFormData] = useState<SyncProfileFormData>({
    name: '',
    description: '',
    profileEnabled: true,
    serverUrl: '',
    username: '',
    password: '',
    urlToken: '',
    syncFrequency: 'manual',
    resourceTypes: [],
    generateBundle: false,
    syncDataEverSince: false,
    dataToSyncStartDate: '',
    numberOfResourcesInBundle: 50,
    durationToKeepSyncedResources: 7,
    isCaseBasedProfile: false,
    caseBasedPrimaryResourceType: '',
    caseBasedPrimaryResourceTypeId: '',
    patientIdentifierType: '',
    resourceSearchParameter: {},
    syncLimit: 50,
    searchable: false,
    searchURL: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [conceptsLoading, setConceptsLoading] = useState(false);

  // Store concept display info for each filter type
  const [conceptDisplays, setConceptDisplays] = useState<{
    observationCode?: SelectedConcept[];
    medicationRequestCode?: SelectedConcept[];
    medicationDispenseCode?: SelectedConcept[];
    conditionCode?: SelectedConcept[];
    diagnosticReportCode?: SelectedConcept[];
    serviceRequestCode?: SelectedConcept[];
  }>({});

  // Store encounter type display info
  const [encounterTypeDisplays, setEncounterTypeDisplays] = useState<EncounterTypeReference[]>([]);

  // Store program display info
  const [programDisplays, setProgramDisplays] = useState<ProgramReference[]>([]);

  // Load concept and encounter type display information from stored codes
  // Handles both legacy format (string[] of UUIDs) and new format (ConceptReference[])
  const loadConceptDisplays = async (params: ResourceSearchParameter) => {
    setConceptsLoading(true);
    try {
      const loadForFilter = async (codes: CodeField | undefined): Promise<SelectedConcept[]> => {
        if (!codes || codes.length === 0) return [];

        // Check if codes are already in the new format (objects with uuid and display)
        if (isConceptReferenceArray(codes)) {
          // New format - concepts are already objects with all needed data
          return codes as SelectedConcept[];
        }

        // Legacy format - codes are UUIDs that need to be fetched
        const uuids = extractUuidsFromCode(codes);
        if (uuids.length === 0) return [];
        const concepts = await getConceptsByUuids(uuids);
        return concepts.map(toSelectedConcept);
      };

      const displays: typeof conceptDisplays = {};

      if (params.observationFilter?.code) {
        displays.observationCode = await loadForFilter(params.observationFilter.code);
      }
      if (params.medicationrequestFilter?.code) {
        displays.medicationRequestCode = await loadForFilter(params.medicationrequestFilter.code);
      }
      if (params.medicationdispenseFilter?.code) {
        displays.medicationDispenseCode = await loadForFilter(params.medicationdispenseFilter.code);
      }
      if (params.conditionFilter?.code) {
        displays.conditionCode = await loadForFilter(params.conditionFilter.code);
      }
      if (params.diagnosticreportFilter?.code) {
        displays.diagnosticReportCode = await loadForFilter(params.diagnosticreportFilter.code);
      }
      if (params.servicerequestFilter?.code) {
        displays.serviceRequestCode = await loadForFilter(params.servicerequestFilter.code);
      }

      setConceptDisplays(displays);

      // Load encounter types
      if (params.encounterFilter?.type) {
        const encounterTypes = params.encounterFilter.type;
        if (isEncounterTypeReferenceArray(encounterTypes)) {
          // New format - already objects
          setEncounterTypeDisplays(encounterTypes);
        } else {
          // Legacy format - UUID strings
          const uuids = encounterTypes.filter(Boolean);
          if (uuids.length > 0) {
            const types = await getEncounterTypesByUuids(uuids);
            setEncounterTypeDisplays(types);
          }
        }
      }

      // Load programs (EpisodeOfCare)
      if (params.episodeofcareFilter?.type) {
        const programs = params.episodeofcareFilter.type;
        if (isProgramReferenceArray(programs)) {
          // New format - already objects
          setProgramDisplays(programs);
        } else {
          // Legacy format - UUID strings (or numbers)
          const uuids = programs.map(String).filter(Boolean);
          if (uuids.length > 0) {
            const progs = await getProgramsByUuids(uuids);
            setProgramDisplays(progs);
          }
        }
      }
    } catch (error) {
      console.error('Error loading concept displays:', error);
    } finally {
      setConceptsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      // Parse resourceTypes from comma-separated string to array
      let parsedResourceTypes: string[] = [];
      const resourceTypesValue = (profile as any).resourceTypes || profile.resourceTypes;
      if (typeof resourceTypesValue === 'string') {
        parsedResourceTypes = resourceTypesValue ? resourceTypesValue.split(',').filter(Boolean) : [];
      } else if (Array.isArray(resourceTypesValue)) {
        parsedResourceTypes = resourceTypesValue;
      }

      // Parse resourceSearchParameter from JSON string if needed
      let parsedResourceSearchParameter: ResourceSearchParameter = {};
      const resourceSearchParamValue = profile.resourceSearchParameter;
      if (resourceSearchParamValue) {
        if (typeof resourceSearchParamValue === 'string') {
          try {
            parsedResourceSearchParameter = JSON.parse(resourceSearchParamValue);
          } catch (e) {
            console.error('Error parsing resourceSearchParameter:', e);
            parsedResourceSearchParameter = {};
          }
        } else {
          parsedResourceSearchParameter = resourceSearchParamValue;
        }
      }

      // Helper function to convert array to comma-separated string
      const arrayToCsv = (arr: any[] | undefined | null): string => {
        if (!arr || !Array.isArray(arr)) return '';
        return arr.filter(v => v !== null && v !== undefined && v !== '').join(',');
      };

      // Handle patientIdentifierType - could be object with uuid or just uuid string
      let patientIdentifierTypeValue = '';
      const pType = (profile as any).patientIdentifierType || profile.patientIdentifierType;
      if (pType) {
        if (typeof pType === 'object' && pType.uuid) {
          patientIdentifierTypeValue = pType.uuid;
        } else if (typeof pType === 'string') {
          patientIdentifierTypeValue = pType;
        }
      }

      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        profileEnabled: profile.profileEnabled ?? true,
        // Handle both 'url' (from GSP) and 'serverUrl' field names
        serverUrl: (profile as any).url || profile.serverUrl || '',
        // Handle both 'urlUserName' (from GSP) and 'username' field names
        username: (profile as any).urlUserName || profile.username || '',
        password: '', // Don't pre-fill password for security
        // Handle both 'urlToken' (from GSP) and 'urlToken' field names
        urlToken: profile.urlToken || (profile as any).urlToken || '',
        syncFrequency: profile.syncFrequency || 'manual',
        resourceTypes: parsedResourceTypes,
        generateBundle: profile.generateBundle ?? false,
        syncDataEverSince: profile.syncDataEverSince ?? false,
        dataToSyncStartDate: profile.dataToSyncStartDate || '',
        numberOfResourcesInBundle: profile.numberOfResourcesInBundle ?? 50,
        durationToKeepSyncedResources: profile.durationToKeepSyncedResources ?? 7,
        isCaseBasedProfile: profile.isCaseBasedProfile ?? false,
        caseBasedPrimaryResourceType: profile.caseBasedPrimaryResourceType || '',
        caseBasedPrimaryResourceTypeId: profile.caseBasedPrimaryResourceTypeId || '',
        patientIdentifierType: patientIdentifierTypeValue,
        resourceSearchParameter: parsedResourceSearchParameter,
        syncLimit: profile.syncLimit ?? 50,
        searchable: profile.searchable ?? false,
        searchURL: profile.searchURL || '',
      });

      // Load concept details for existing codes
      if (parsedResourceSearchParameter) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        loadConceptDisplays(parsedResourceSearchParameter);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        profileEnabled: true,
        serverUrl: '',
        username: '',
        password: '',
        urlToken: '',
        syncFrequency: 'manual',
        resourceTypes: [],
        generateBundle: false,
        syncDataEverSince: false,
        dataToSyncStartDate: '',
        numberOfResourcesInBundle: 50,
        durationToKeepSyncedResources: 7,
        isCaseBasedProfile: false,
        caseBasedPrimaryResourceType: '',
        caseBasedPrimaryResourceTypeId: '',
        patientIdentifierType: '',
        resourceSearchParameter: {},
        syncLimit: 50,
        searchable: false,
        searchURL: '',
      });
    }
    setTestResult(null);
    setSelectedTabIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, open]);

  const handleChange = (field: keyof SyncProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  // Helper to convert array to CSV for display
  const getFilterValue = (filter: any, key: string): string => {
    if (!filter || !filter[key]) return '';
    const value = filter[key];
    if (Array.isArray(value)) {
      return value.filter(v => v !== null && v !== undefined && v !== '').join(',');
    }
    return String(value || '');
  };

  // Helper to convert CSV to array for saving
  const csvToArray = (csv: string): (string | number)[] => {
    if (!csv) return [];
    return csv.split(',').map(v => v.trim()).filter(Boolean);
  };

  const handleResourceSearchParamChange = (filterKey: keyof ResourceSearchParameter, innerKey: string, value: string) => {
    // Convert CSV string to array
    const arrayValue = csvToArray(value);
    setFormData(prev => ({
      ...prev,
      resourceSearchParameter: {
        ...prev.resourceSearchParameter,
        [filterKey]: {
          ...(prev.resourceSearchParameter?.[filterKey as keyof ResourceSearchParameter] as any || {}),
          [innerKey]: arrayValue.length > 0 ? arrayValue : '',
        },
      },
    }));
  };

  // Handle concept selection changes
  const handleConceptsChange = (filterType: keyof typeof conceptDisplays, concepts: SelectedConcept[]) => {
    setConceptDisplays(prev => ({ ...prev, [filterType]: concepts }));

    // Map filter type to the actual resource search parameter key
    const filterKeyMap: Record<typeof filterType, keyof ResourceSearchParameter> = {
      observationCode: 'observationFilter',
      medicationRequestCode: 'medicationrequestFilter',
      medicationDispenseCode: 'medicationdispenseFilter',
      conditionCode: 'conditionFilter',
      diagnosticReportCode: 'diagnosticreportFilter',
      serviceRequestCode: 'servicerequestFilter',
    };

    const filterKey = filterKeyMap[filterType];
    if (filterKey) {
      // Store concept objects directly in the code field as ConceptReference[]
      const conceptReferences: ConceptReference[] = concepts.map(c => ({
        uuid: c.uuid,
        display: c.display,
        id: c.id,
        conceptClass: c.conceptClass,
        datatype: c.datatype,
      }));

      setFormData(prev => ({
        ...prev,
        resourceSearchParameter: {
          ...prev.resourceSearchParameter,
          [filterKey]: {
            ...(prev.resourceSearchParameter?.[filterKey] as any || {}),
            code: conceptReferences.length > 0 ? conceptReferences : undefined,
          },
        },
      }));
    }
  };

  // Handle encounter type selection changes
  const handleEncounterTypesChange = (encounterTypes: EncounterTypeReference[]) => {
    setEncounterTypeDisplays(encounterTypes);

    // Store encounter type objects directly in the type field
    const encounterTypeReferences: EncounterTypeReference[] = encounterTypes.map(et => ({
      uuid: et.uuid,
      display: et.display,
      description: et.description,
    }));

    setFormData(prev => ({
      ...prev,
      resourceSearchParameter: {
        ...prev.resourceSearchParameter,
        encounterFilter: {
          ...(prev.resourceSearchParameter?.encounterFilter || {}),
          type: encounterTypeReferences.length > 0 ? encounterTypeReferences : undefined,
        },
      },
    }));
  };

  // Handle program selection changes
  const handleProgramsChange = (programs: ProgramReference[]) => {
    setProgramDisplays(programs);

    // Store program objects directly in the type field
    const programReferences: ProgramReference[] = programs.map(p => ({
      uuid: p.uuid,
      display: p.display,
      description: p.description,
    }));

    setFormData(prev => ({
      ...prev,
      resourceSearchParameter: {
        ...prev.resourceSearchParameter,
        episodeofcareFilter: {
          ...(prev.resourceSearchParameter?.episodeofcareFilter || {}),
          type: programReferences.length > 0 ? programReferences : undefined,
        },
      },
    }));
  };

  const handleResourceTypeChange = (resourceType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      resourceTypes: checked
        ? [...(prev.resourceTypes || []), resourceType]
        : (prev.resourceTypes || []).filter(rt => rt !== resourceType),
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (profile?.uuid) {
        await testSyncConnection(profile.uuid);
        setTestResult({ success: true, message: t('connectionSuccessful', 'Connection successful!') });
      }
    } catch (error: any) {
      let errorMessage = error?.message || t('unknownError', 'An unknown error occurred');

      // Clean up common error prefixes
      errorMessage = errorMessage
        .replace(/^Error testing connection:\s*/i, '')
        .replace(/^Failed to test connection:\s*/i, '');

      setTestResult({
        success: false,
        message: t('connectionFailed', 'Connection failed: ') + errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      // Format the date properly for the backend
      let formattedStartDate = formData.dataToSyncStartDate;
      if (formattedStartDate && formData.syncDataEverSince) {
        // Convert yyyy-MM-dd to ISO8601 format with time (yyyy-MM-dd'T'00:00:00.000+0000)
        // The backend expects: yyyy-MM-dd'T'HH:mm:ss.SSSZ
        try {
          const date = new Date(formattedStartDate);
          // Set time to start of day in UTC
          date.setUTCHours(0, 0, 0, 0);
          formattedStartDate = date.toISOString();
        } catch {
          formattedStartDate = '';
        }
      }

      // Map frontend field names to backend field names
      // Backend uses: url, urlUserName, urlPassword (not serverUrl, username, password)
      const submissionData: any = {
        name: formData.name,
        resourceTypes: formData.resourceTypes?.join(','),
        resourceSearchParameter: JSON.stringify(formData.resourceSearchParameter || {}),
        profileEnabled: formData.profileEnabled,
        patientIdentifierType: formData.patientIdentifierType,
        numberOfResourcesInBundle: formData.numberOfResourcesInBundle,
        durationToKeepSyncedResources: formData.durationToKeepSyncedResources,
        generateBundle: formData.generateBundle,
        isCaseBasedProfile: formData.isCaseBasedProfile,
        caseBasedPrimaryResourceType: formData.caseBasedPrimaryResourceType,
        caseBasedPrimaryResourceTypeId: formData.caseBasedPrimaryResourceTypeId,
        syncLimit: formData.syncLimit,
        url: formData.serverUrl,
        urlUserName: formData.username,
        urlPassword: formData.password,
        urlToken: formData.urlToken,
        syncDataEverSince: formData.syncDataEverSince,
        // Only send dataToSyncStartDate if syncDataEverSince is true and date is valid
        dataToSyncStartDate: formData.syncDataEverSince ? formattedStartDate : null,
        searchable: formData.searchable,
        searchURL: formData.searchURL,
      };

      if (profile?.uuid) {
        await updateSyncProfile(profile.uuid, submissionData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('profileUpdated', 'Profile updated'),
          subtitle: t('profileUpdatedSuccess', 'Sync profile has been updated successfully'),
          autoClose: true,
        });
      } else {
        await createSyncProfile(submissionData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('profileCreated', 'Profile created'),
          subtitle: t('profileCreatedSuccess', 'Sync profile has been created successfully'),
          autoClose: true,
        });
      }
      onSave();
      onClose();
    } catch (error: any) {
      // Extract a meaningful error message for the user
      let errorMessage = error?.message || t('unknownError', 'An unknown error occurred');

      // Clean up common error prefixes to avoid redundant messages
      errorMessage = errorMessage
        .replace(/^Failed to (create|update) sync profile:\s*/i, '')
        .replace(/^Error (creating|updating) sync profile:\s*/i, '')
        .replace(/^Error saving profile:\s*/i, '');

      // Create a user-friendly description
      const description = profile?.uuid
        ? t('errorUpdatingProfileDescription', 'Could not update the sync profile. Please check your input and try again.')
        : t('errorCreatingProfileDescription', 'Could not create the sync profile. Please check your input and try again.');

      showNotification({
        title: profile?.uuid
          ? t('errorUpdatingProfile', 'Error updating profile')
          : t('errorCreatingProfile', 'Error creating profile'),
        kind: 'error',
        critical: true,
        description: `${description} ${errorMessage}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.name && formData.serverUrl;

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading={profile ? t('editSyncProfile', 'Edit Sync Profile') : t('createSyncProfile', 'Create Sync Profile')}
      modalLabel={t('syncConfiguration', 'Sync Configuration')}
      primaryButtonText={t('save', 'Save')}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={!isFormValid || isSaving || isTesting}
      size="lg"
    >
      <div className={styles.modalContent}>
        <Tabs selectedIndex={selectedTabIndex} onChange={({ selectedIndex }) => setSelectedTabIndex(selectedIndex)}>
          <TabList aria-label="Sync profile tabs" className={styles.tabList}>
            <Tab>{t('resourceDefinition', 'Resource Definition')}</Tab>
            <Tab>{t('resourceFilters', 'Resource Filters')}</Tab>
            <Tab>{t('syncSettings', 'Sync Settings')}</Tab>
          </TabList>
          <TabPanels>
            {/* Resource Definition Tab */}
            <TabPanel>
              <div className={styles.tabPanelContent}>
                {/* Profile Details Card */}
                <Tile className={styles.card}>
                  <h4 className={styles.cardHeader}>{t('profileDetails', 'Profile Details')}</h4>

                  <TextInput
                    id="profile-name"
                    labelText={t('profileName', 'Profile Name')}
                    placeholder={t('enterProfileName', 'Enter profile name')}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className={styles.formField}
                  />

                  <TextArea
                    id="profile-description"
                    labelText={t('description', 'Description')}
                    placeholder={t('enterDescription', 'Enter description')}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={styles.formField}
                  />

                  <div className={styles.checkboxRow}>
                    <Checkbox
                      id="profile-enabled"
                      labelText={t('enableProfile', 'Enable Profile')}
                      checked={formData.profileEnabled}
                      onChange={(value) => handleChange('profileEnabled', value)}
                    />
                    <Checkbox
                      id="generate-bundle"
                      labelText={t('generateBundle', 'Generate Bundle')}
                      checked={formData.generateBundle}
                      onChange={(value) => handleChange('generateBundle', value)}
                    />
                  </div>

                  <div className={styles.checkboxRow}>
                    <Checkbox
                      id="sync-historical"
                      labelText={t('syncHistoricalData', 'Sync Historical Data')}
                      checked={formData.syncDataEverSince}
                      onChange={(value) => handleChange('syncDataEverSince', value)}
                    />
                  </div>

                  {formData.syncDataEverSince && (
                    <DatePicker
                      dateFormat="Y-m-d"
                      datePickerType="single"
                      value={formData.dataToSyncStartDate}
                      onChange={(dates) => {
                        const date = dates.length > 0 ? dates[0] : null;
                        handleChange('dataToSyncStartDate', date ? date.toISOString().split('T')[0] : '');
                      }}
                    >
                      <DatePickerInput
                        id="data-to-sync-start-date"
                        labelText={t('dataToSyncStartDate', 'Data To Sync Start Date')}
                        placeholder="yyyy-mm-dd"
                        className={styles.formField}
                      />
                    </DatePicker>
                  )}

                  <NumberInput
                    id="resources-in-bundle"
                    label={t('noOfResourcesInBundle', 'No of Resources in Bundle')}
                    value={formData.numberOfResourcesInBundle}
                    onChange={(e) => handleChange('numberOfResourcesInBundle', parseInt((e.target as HTMLInputElement).value) || 50)}
                    min={1}
                    max={1000}
                    className={styles.formField}
                  />

                  <NumberInput
                    id="duration-keep-resources"
                    label={t('durationToKeepSyncedResources', 'Duration To Keep Synced Resources (Days)')}
                    value={formData.durationToKeepSyncedResources}
                    onChange={(e) => handleChange('durationToKeepSyncedResources', parseInt((e.target as HTMLInputElement).value) || 7)}
                    min={1}
                    max={365}
                    className={styles.formField}
                  />
                </Tile>

                {/* Resource Type Card */}
                <Tile className={styles.card}>
                  <h4 className={styles.cardHeader}>{t('resourceType', 'Resource Type')}</h4>
                  <div className={styles.resourceTypesGrid}>
                    {ALL_RESOURCE_TYPES.map((resource) => (
                      <Checkbox
                        key={resource}
                        id={`resource-${resource}`}
                        labelText={resource === 'EpisodeOfCare' ? `${resource} (Program)` : resource}
                        checked={formData.resourceTypes?.includes(resource)}
                        onChange={(e) => handleResourceTypeChange(resource, e.target.checked)}
                        className={styles.resourceCheckbox}
                      />
                    ))}
                  </div>
                </Tile>

                {/* Case Based Settings Card */}
                <Tile className={styles.card}>
                  <h4 className={styles.cardHeader}>{t('caseBasedSettings', 'Case Based Settings')}</h4>

                  <Checkbox
                    id="is-case-based"
                    labelText={t('isProfileCaseBased', 'Is Profile Case Based')}
                    checked={formData.isCaseBasedProfile}
                    onChange={(value) => handleChange('isCaseBasedProfile', value)}
                    className={styles.formField}
                  />

                  <Select
                    id="case-based-resource-type"
                    labelText={t('caseBasedPrimaryResourceType', 'Case Based Primary Resource Type')}
                    value={formData.caseBasedPrimaryResourceType}
                    onChange={(e) => handleChange('caseBasedPrimaryResourceType', e.target.value)}
                    disabled={!formData.isCaseBasedProfile}
                    className={styles.formField}
                  >
                    <SelectItem value="" text={t('selectPrimaryResourceType', 'Select Primary Resource Type')} />
                    {CASE_BASED_RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} text={type.label} />
                    ))}
                  </Select>

                  <TextInput
                    id="case-based-resource-type-id"
                    labelText={t('caseBasedPrimaryResourceTypeId', 'Case Based Primary Resource Type Identifier')}
                    placeholder={t('uuidOfPrimaryResourceType', 'UUID of primary resource type')}
                    value={formData.caseBasedPrimaryResourceTypeId}
                    onChange={(e) => handleChange('caseBasedPrimaryResourceTypeId', e.target.value)}
                    disabled={!formData.isCaseBasedProfile}
                    className={styles.formField}
                  />
                </Tile>
              </div>
            </TabPanel>

            {/* Resource Filters Tab */}
            <TabPanel>
              <div className={styles.tabPanelContent}>
                <Tile className={styles.card}>
                  <h4 className={styles.cardHeader}>{t('patientIdentifier', 'Patient Identifier')}</h4>

                  <Select
                    id="patient-identifier-type"
                    labelText={t('patientIdentifierType', 'Patient Identifier Type')}
                    value={formData.patientIdentifierType}
                    onChange={(e) => handleChange('patientIdentifierType', e.target.value)}
                    className={styles.formField}
                  >
                    <SelectItem value="" text={t('selectPatientIdentifierType', 'Select Patient Identifier Type')} />
                    {patientIdentifierTypes.map((type) => (
                      <SelectItem key={type.uuid} value={type.uuid} text={type.name} />
                    ))}
                  </Select>
                </Tile>

                <Tile className={styles.card}>
                  <h4 className={styles.cardHeader}>{t('resourceFilters', 'Resource Filters')}</h4>
                  <p className={styles.cardDescription}>
                    {t('resourceFiltersDescription', 'Select specific types and concepts to filter resources during synchronization.')}
                  </p>

                  {/* Encounter Types Section */}
                  <div className={styles.filterSection}>
                    <h5 className={styles.filterSectionHeader}>{t('encounter', 'Encounter')}</h5>
                    {conceptsLoading ? (
                      <div className={styles.formField}>{t('loadingFilters', 'Loading filters...')}</div>
                    ) : (
                      <EncounterTypeSearchMultiSelect
                        id="encounter-type-search"
                        labelText={t('encounterTypes', 'Encounter Types')}
                        placeholder={t('searchEncounterTypes', 'Search for encounter types...')}
                        helperText={t('selectEncounterTypesToFilter', 'Select encounter types to filter by')}
                        value={encounterTypeDisplays}
                        onChange={handleEncounterTypesChange}
                      />
                    )}
                  </div>

                  {/* EpisodeOfCare Programs Section */}
                  <div className={styles.filterSection}>
                    <h5 className={styles.filterSectionHeader}>{t('episodeOfCare', 'EpisodeOfCare (Programs)')}</h5>
                    {conceptsLoading ? (
                      <div className={styles.formField}>{t('loadingFilters', 'Loading filters...')}</div>
                    ) : (
                      <ProgramSearchMultiSelect
                        id="program-search"
                        labelText={t('episodeOfCarePrograms', 'Programs')}
                        placeholder={t('searchPrograms', 'Search for programs...')}
                        helperText={t('selectProgramsToFilter', 'Select programs to filter by')}
                        value={programDisplays}
                        onChange={handleProgramsChange}
                      />
                    )}
                  </div>

                  {/* Clinical Concepts Section */}
                  <div className={styles.filterSection}>
                    <h5 className={styles.filterSectionHeader}>{t('clinicalConcepts', 'Clinical Concepts')}</h5>

                    <ConceptSearchMultiSelect
                      id="observation-code-concepts"
                      labelText={t('observationConceptIds', 'Observation Concepts')}
                      placeholder={t('searchObservationConcepts', 'Search for observation concepts...')}
                      value={conceptDisplays.observationCode ?? []}
                      onChange={(concepts) => handleConceptsChange('observationCode', concepts)}
                    />

                    <ConceptSearchMultiSelect
                      id="medication-request-code-concepts"
                      labelText={t('medicationRequestConceptIds', 'Medication Request Concepts')}
                      placeholder={t('searchMedicationRequestConcepts', 'Search for medication request concepts...')}
                      value={conceptDisplays.medicationRequestCode ?? []}
                      onChange={(concepts) => handleConceptsChange('medicationRequestCode', concepts)}
                    />

                    <ConceptSearchMultiSelect
                      id="medication-dispense-code-concepts"
                      labelText={t('medicationDispenseConceptIds', 'Medication Dispense Concepts')}
                      placeholder={t('searchMedicationDispenseConcepts', 'Search for medication dispense concepts...')}
                      value={conceptDisplays.medicationDispenseCode ?? []}
                      onChange={(concepts) => handleConceptsChange('medicationDispenseCode', concepts)}
                    />

                    <ConceptSearchMultiSelect
                      id="condition-code-concepts"
                      labelText={t('conditionConceptIds', 'Condition Concepts')}
                      placeholder={t('searchConditionConcepts', 'Search for condition concepts...')}
                      value={conceptDisplays.conditionCode ?? []}
                      onChange={(concepts) => handleConceptsChange('conditionCode', concepts)}
                    />

                    <ConceptSearchMultiSelect
                      id="diagnostic-report-code-concepts"
                      labelText={t('diagnosticReportConceptIds', 'Diagnostic Report Concepts')}
                      placeholder={t('searchDiagnosticReportConcepts', 'Search for diagnostic report concepts...')}
                      value={conceptDisplays.diagnosticReportCode ?? []}
                      onChange={(concepts) => handleConceptsChange('diagnosticReportCode', concepts)}
                    />

                    <ConceptSearchMultiSelect
                      id="service-request-code-concepts"
                      labelText={t('serviceRequestConceptIds', 'Service Request Concepts')}
                      placeholder={t('searchServiceRequestConcepts', 'Search for service request concepts...')}
                      value={conceptDisplays.serviceRequestCode ?? []}
                      onChange={(concepts) => handleConceptsChange('serviceRequestCode', concepts)}
                    />
                  </div>
                </Tile>
              </div>
            </TabPanel>

            {/* Sync Settings Tab */}
            <TabPanel>
              <div className={styles.tabPanelContent}>
                <Tile className={styles.card}>
                  <h4 className={styles.cardHeader}>{t('authenticationAuthorization', 'Authentication and Authorization')}</h4>

                  <TextInput
                    id="server-url"
                    labelText={t('url', 'URL')}
                    placeholder={t('urlOrIpAddressToSendDataTo', 'URL or IP Address to send data to')}
                    value={formData.serverUrl}
                    onChange={(e) => handleChange('serverUrl', e.target.value)}
                    required
                    className={styles.formField}
                  />

                  <NumberInput
                    id="sync-limit"
                    label={t('numberOfResourcesToSync', 'Number of Resources to Sync at a time')}
                    value={formData.syncLimit}
                    onChange={(e) => handleChange('syncLimit', parseInt((e.target as HTMLInputElement).value) || 50)}
                    min={1}
                    max={1000}
                    className={styles.formField}
                  />

                  <TextInput
                    id="username"
                    labelText={t('username', 'Username')}
                    placeholder={t('enterUsername', 'Enter username')}
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className={styles.formField}
                  />

                  <TextInput
                    id="password"
                    type="password"
                    labelText={t('password', 'Password')}
                    placeholder={t('enterPassword', 'Enter password')}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={styles.formField}
                  />

                  <TextInput
                    id="auth-token"
                    labelText={t('authToken', 'Auth Token')}
                    placeholder={t('token', 'Token')}
                    value={formData.urlToken}
                    onChange={(e) => handleChange('urlToken', e.target.value)}
                    className={styles.formField}
                  />

                  <Checkbox
                    id="searchable"
                    labelText={t('isProfileSearchable', 'Is Profile Searchable')}
                    checked={formData.searchable}
                    onChange={(value) => handleChange('searchable', value)}
                    className={styles.formField}
                  />

                  {formData.searchable && (
                    <TextInput
                      id="search-url"
                      labelText={t('searchURL', 'Search URL')}
                      placeholder={t('searchUrlPlaceholder', 'Search URL')}
                      value={formData.searchURL}
                      onChange={(e) => handleChange('searchURL', e.target.value)}
                      className={styles.formField}
                    />
                  )}

                  {profile?.uuid && (
                    <Button
                      kind="secondary"
                      onClick={handleTestConnection}
                      disabled={isTesting || !formData.serverUrl}
                      className={styles.testButton}
                    >
                      {isTesting ? t('testing', 'Testing...') : t('testConnection', 'Test Connection')}
                    </Button>
                  )}

                  {testResult && (
                    <Tile className={testResult.success ? styles.successTile : styles.errorTile}>
                      {testResult.message}
                    </Tile>
                  )}
                </Tile>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Modal>
  );
};

export default ProfileDetailModal;

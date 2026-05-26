import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineLoading,
  Toggle,
  Tag,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { updateLocation, retireLocation, unretireLocation, getLocationPath } from './location-management.resources';
import type { Location } from './location-management.resources';
import styles from './location-management.scss';

interface EditLocationModalProps {
  location: Location;
  closeModal: () => void;
  onSuccess: () => void;
  locations: Array<Location>;
}

const EditLocationModal: React.FC<EditLocationModalProps> = ({
  location,
  closeModal,
  onSuccess,
  locations,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(location.name || '');
  const [description, setDescription] = useState(location.description || '');
  const [parentUuid, setParentUuid] = useState(location.parentLocation?.uuid || '');
  const [isRetired, setIsRetired] = useState(location.retired || false);
  const [retireReason, setRetireReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(location.name || '');
    setDescription(location.description || '');
    setParentUuid(location.parentLocation?.uuid || '');
    setIsRetired(location.retired || false);
  }, [location]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('nameRequired', 'Name is required'));
      return;
    }

    if (isRetired && !location.retired && !retireReason.trim()) {
      setError(t('retireReasonRequired', 'Retire reason is required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isRetiring = isRetired && !location.retired;
      const isUnretiring = !isRetired && location.retired;
      const hasOtherChanges =
        name.trim() !== location.name ||
        (description?.trim() || '') !== (location.description || '') ||
        parentUuid !== (location.parentLocation?.uuid || '');

      // Handle retire/unretire
      if (isRetiring) {
        await retireLocation(location.uuid, retireReason.trim());
      } else if (isUnretiring) {
        await unretireLocation(location.uuid);
      }

      // Handle other field changes
      if (hasOtherChanges) {
        await updateLocation(location.uuid, {
          name: name.trim(),
          description: description.trim() || undefined,
          parentLocation: parentUuid || null,
        });
      }

      onSuccess();
      closeModal();
    } catch (err) {
      setError(err.message || t('errorUpdatingLocation', 'Failed to update location'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available parent locations (exclude current location and its descendants)
  const getAvailableParentLocations = () => {
    const excludeUuids = new Set([location.uuid]);

    // Add all descendant UUIDs to exclude set
    const addDescendants = (loc: Location) => {
      excludeUuids.add(loc.uuid);
      if (loc.childLocations) {
        loc.childLocations.forEach(addDescendants);
      }
    };

    const currentLoc = locations.find(l => l.uuid === location.uuid);
    if (currentLoc) {
      addDescendants(currentLoc);
    }

    return locations.filter(loc => !excludeUuids.has(loc.uuid));
  };

  const availableParents = getAvailableParentLocations();

  return (
    <Modal
      open
      modalHeading={t('editLocation', 'Edit Location')}
      primaryButtonText={t('save', 'Save')}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestClose={closeModal}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting || !name.trim() || (isRetired && !location.retired && !retireReason.trim())}
      size="md"
    >
      <div className={styles.editLocationModalContent}>
        <TextInput
          id="edit-location-name"
          labelText={t('locationName', 'Location Name')}
          placeholder={t('enterLocationName', 'Enter location name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={!!error && !name.trim()}
          invalidText={error}
          autoFocus
        />

        <TextArea
          id="edit-location-description"
          labelText={t('description', 'Description')}
          placeholder={t('enterDescription', 'Enter description (optional)')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <Select
          id="edit-parent-location"
          labelText={t('parentLocation', 'Parent Location')}
          value={parentUuid}
          onChange={(e) => setParentUuid(e.target.value)}
        >
          <SelectItem value="" text={t('noParent', 'No Parent (Root Level)')} />
          {availableParents.map((loc) => (
            <SelectItem key={loc.uuid} value={loc.uuid} text={getLocationPath(loc, locations)}>
              {getLocationPath(loc, locations)}
            </SelectItem>
          ))}
        </Select>

        <div className={styles.retireToggle}>
          <Toggle
            id="retire-location"
            labelText={t('retireLocation', 'Retire this location')}
            labelA={t('active', 'Active')}
            labelB={t('retired', 'Retired')}
            toggled={isRetired}
            onToggle={setIsRetired}
          />
          {isRetired && (
            <>
              <p className={styles.retireNote}>
                {t('retireLocationNote', 'Retired locations will not be available for new data entry but historical data will be preserved.')}
              </p>
              <TextArea
                id="retire-reason"
                labelText={t('retireReason', 'Retire reason')}
                placeholder={t('enterRetireReason', 'Enter reason for retiring this location')}
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                invalid={!!error && isRetired && !retireReason.trim()}
                invalidText={error}
                rows={2}
              />
            </>
          )}
        </div>

        {location.tags && location.tags.length > 0 && (
          <div className={styles.tagsDisplay}>
            <label className={styles.tagsLabel}>{t('tags', 'Tags')}:</label>
            <div className={styles.tagsList}>
              {location.tags.map((tag) => (
                <Tag key={tag.uuid} type="blue" size="sm">
                  {tag.display}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {isSubmitting && (
          <InlineLoading description={t('savingLocation', 'Saving location...')} />
        )}

        {error && name.trim() && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditLocationModal;

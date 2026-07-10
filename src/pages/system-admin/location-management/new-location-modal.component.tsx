import React, { useState } from 'react';
import {
  Modal,
  Button,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineLoading,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { createLocation, getLocationPath } from './location-management.resources';
import styles from './location-management.scss';

interface NewLocationModalProps {
  closeModal: () => void;
  onSuccess: () => void;
  defaultParentUuid?: string;
  locations: Array<any>;
}

const NewLocationModal: React.FC<NewLocationModalProps> = ({
  closeModal,
  onSuccess,
  defaultParentUuid,
  locations,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentUuid, setParentUuid] = useState(defaultParentUuid || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('nameRequired', 'Name is required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createLocation({
        name: name.trim(),
        description: description.trim() || undefined,
        parentLocation: parentUuid || undefined,
      });
      onSuccess();
      closeModal();
    } catch (err) {
      setError(err.message || t('errorCreatingLocation', 'Failed to create location'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      modalHeading={t('addNewLocation', 'Add New Location')}
      primaryButtonText={t('add', 'Add')}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestClose={closeModal}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting || !name.trim()}
    >
      <div className={styles.newLocationModalContent}>
        <TextInput
          id="location-name"
          labelText={t('locationName', 'Location Name')}
          placeholder={t('enterLocationName', 'Enter location name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={!!error && !name.trim()}
          invalidText={error}
          autoFocus
        />

        <TextArea
          id="location-description"
          labelText={t('description', 'Description')}
          placeholder={t('enterDescription', 'Enter description (optional)')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <Select
          id="parent-location"
          labelText={t('parentLocation', 'Parent Location')}
          value={parentUuid}
          onChange={(e) => setParentUuid(e.target.value)}
        >
          <SelectItem value="" text={t('noParent', 'No Parent (Root Level)')} />
          {locations.map((loc) => (
            <SelectItem key={loc.uuid} value={loc.uuid} text={getLocationPath(loc, locations)}>
              {getLocationPath(loc, locations)}
            </SelectItem>
          ))}
        </Select>

        {isSubmitting && (
          <InlineLoading description={t('creatingLocation', 'Creating location...')} />
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

export default NewLocationModal;

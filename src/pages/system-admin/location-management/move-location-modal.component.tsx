import React, { useState } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Select,
  SelectItem,
  Layer,
  Tile,
  InlineLoading,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { updateLocationParent, buildLocationTree, getLocationPath } from './location-management.resources';
import styles from './location-management.scss';

interface MoveLocationModalProps {
  location: {
    uuid: string;
    display: string;
    name: string;
    parentLocation?: {
      uuid: string;
      display: string;
    };
  };
  closeModal: () => void;
  onSuccess: () => void;
  locations: Array<any>;
}

const MoveLocationModal: React.FC<MoveLocationModalProps> = ({
  location,
  closeModal,
  onSuccess,
  locations,
}) => {
  const { t } = useTranslation();
  const [selectedParent, setSelectedParent] = useState(location.parentLocation?.uuid || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationTree = buildLocationTree(locations);

  const getDescendantUuids = (node: any, uuids: Set<string> = new Set()): Set<string> => {
    uuids.add(node.uuid);
    if (node.children) {
      node.children.forEach((child) => getDescendantUuids(child, uuids));
    }
    return uuids;
  };

  const descendants = locationTree.find((n) => n.uuid === location.uuid)
    ? getDescendantUuids(locationTree.find((n) => n.uuid === location.uuid))
    : new Set([location.uuid]);

  const validParentLocations = locations.filter(
    (loc) => loc.uuid !== location.uuid && !descendants.has(loc.uuid),
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateLocationParent(location.uuid, selectedParent || null);
      onSuccess();
      closeModal();
    } catch (err) {
      setError(err.message || t('errorMovingLocation', 'Failed to move location'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentParentPath = location.parentLocation
    ? getLocationPath(location.parentLocation, locations)
    : t('rootLevel', 'Root level (no parent)');

  const newParentPath = selectedParent
    ? getLocationPath(locations.find((l) => l.uuid === selectedParent), locations)
    : t('rootLevel', 'Root level (no parent)');

  return (
    <Modal
      open
      modalHeading={t('moveLocation', 'Move Location')}
      modalLabel={location.name}
      primaryButtonText={t('move', 'Move')}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestClose={closeModal}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting}
      danger={descendants.has(selectedParent)}
    >
      <div className={styles.moveModalContent}>
        <p className={styles.modalDescription}>
          {t('moveLocationDescription', 'Select a new parent location for this location. Moving a location will also move all its child locations.')}
        </p>

        <Tile className={styles.currentStatusTile}>
          <h6>{t('currentLocation', 'Current Location')}</h6>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>{t('name', 'Name')}:</span>
            <span className={styles.statusValue}>{location.name}</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>{t('currentParent', 'Current Parent')}:</span>
            <span className={styles.statusValue}>{currentParentPath}</span>
          </div>
        </Tile>

        <div className={styles.selectContainer}>
          <Select
            id="new-parent-location"
            labelText={t('selectNewParent', 'Select new parent location')}
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            invalid={descendants.has(selectedParent)}
            invalidText={t('cannotMoveToChild', 'Cannot move to a child location')}
          >
            <SelectItem value="" text={t('noParent', 'No Parent (Root Level)')} />
            {validParentLocations.map((loc) => (
              <SelectItem key={loc.uuid} value={loc.uuid} text={getLocationPath(loc, locations)}>
                {getLocationPath(loc, locations)}
              </SelectItem>
            ))}
          </Select>
        </div>

        {selectedParent && (
          <Tile className={styles.previewTile}>
            <h6>{t('preview', 'Preview')}</h6>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>{t('newPath', 'New Path')}:</span>
              <span className={styles.statusValue}>
                {locations.find((l) => l.uuid === selectedParent).name} &gt; {location.name}
              </span>
            </div>
          </Tile>
        )}

        {isSubmitting && (
          <InlineLoading description={t('movingLocation', 'Moving location...')} />
        )}

        {error && (
          <div className={styles.errorMessage}>
            <Tile>{error}</Tile>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MoveLocationModal;

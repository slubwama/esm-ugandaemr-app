import React, { useState } from 'react';
import { Modal, Button, InlineLoading, Tag, TextArea } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { retireLocation, unretireLocation, getLocationPath } from './location-management.resources';
import type { Location } from './location-management.resources';
import styles from './location-management.scss';

interface RetireLocationModalProps {
  location: Location;
  closeModal: () => void;
  onSuccess: () => void;
  locations: Array<Location>;
}

const RetireLocationModal: React.FC<RetireLocationModalProps> = ({
  location,
  closeModal,
  onSuccess,
  locations,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retireReason, setRetireReason] = useState('');

  const isRetired = location.retired;
  const actionText = isRetired ? t('unretire', 'Unretire') : t('retire', 'Retire');

  const handleSubmit = async () => {
    if (!isRetired && !retireReason.trim()) {
      setError(t('retireReasonRequired', 'Retire reason is required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isRetired) {
        await unretireLocation(location.uuid);
      } else {
        await retireLocation(location.uuid, retireReason.trim());
      }
      onSuccess();
      closeModal();
    } catch (err) {
      setError(err.message || t('errorUpdatingLocation', 'Failed to update location'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      modalHeading={t('confirmLocationStatus', 'Confirm Location Status Change')}
      primaryButtonText={isSubmitting ? '' : actionText}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestClose={closeModal}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting || (!isRetired && !retireReason.trim())}
      danger={!isRetired}
      size="sm"
    >
      <div className={styles.newLocationModalContent}>
        <p>
          {isRetired
            ? t('confirmUnretireLocation', 'Are you sure you want to unretire this location? It will become available for new data entry.')
            : t('confirmRetireLocation', 'Are you sure you want to retire this location? It will not be available for new data entry but historical data will be preserved.')}
        </p>

        <div className={styles.currentStatusTile}>
          <h5>{t('location', 'Location')}</h5>
          <p><strong>{t('name', 'Name')}:</strong> {location.name}</p>
          {location.description && (
            <p><strong>{t('description', 'Description')}:</strong> {location.description}</p>
          )}
          <p><strong>{t('path', 'Path')}:</strong> {getLocationPath(location, locations)}</p>
          <p>
            <strong>{t('status', 'Status')}:</strong> {' '}
            {location.retired ? (
              <Tag type="red" size="sm">{t('retired', 'Retired')}</Tag>
            ) : (
              <Tag type="green" size="sm">{t('active', 'Active')}</Tag>
            )}
          </p>
        </div>

        {!isRetired && (
          <TextArea
            id="retire-reason"
            labelText={t('retireReason', 'Retire reason')}
            placeholder={t('enterRetireReason', 'Enter reason for retiring this location')}
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
            invalid={!!error && !retireReason.trim()}
            invalidText={error}
            rows={3}
            autoFocus
          />
        )}

        {isSubmitting && (
          <InlineLoading description={t('updatingLocation', 'Updating location...')} />
        )}

        {error && retireReason.trim() && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RetireLocationModal;

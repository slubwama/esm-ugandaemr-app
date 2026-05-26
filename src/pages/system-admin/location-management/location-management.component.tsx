import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tile,
  TextInput,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  Toggle,
} from '@carbon/react';
import { Add, Search, Information, Renew, Edit, TrashCan } from '@carbon/react/icons';
import { Header } from '../shared-components';
import Illustration from './location-management-illustration.component';
import { useLocations, buildLocationTree, flattenLocationTree, getLocationPath, updateLocationParent } from './location-management.resources';
import type { LocationTree, Location } from './location-management.resources';
import styles from './location-management.scss';
import MoveLocationModal from './move-location-modal.component';
import NewLocationModal from './new-location-modal.component';
import EditLocationModal from './edit-location-modal.component';
import RetireLocationModal from './retire-location-modal.component';
import InteractiveHierarchyTree from './InteractiveHierarchyTree';

interface LocationManagementProps {
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

const LocationManagement: React.FC<LocationManagementProps> = ({ backButton }) => {
  const { t } = useTranslation();
  const [includeRetired, setIncludeRetired] = useState(false);
  const { locations, isLoading, isError } = useLocations(includeRetired);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [moveModalLocation, setMoveModalLocation] = useState(null);
  const [newLocationModalOpen, setNewLocationModalOpen] = useState(false);
  const [newLocationParent, setNewLocationParent] = useState<string | undefined>();
  const [editModalLocation, setEditModalLocation] = useState(null);
  const [retireModalLocation, setRetireModalLocation] = useState(null);

  const locationTree = buildLocationTree(locations);
  const flatLocations = flattenLocationTree(locationTree);

  const filteredLocations = searchQuery
    ? flatLocations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getLocationPath(loc, locations).toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : flatLocations;

  const handleMoveSuccess = () => {
    setMoveModalLocation(null);
    setSelectedLocation(null);
    window.location.reload();
  };

  const handleNewLocationSuccess = () => {
    setNewLocationModalOpen(false);
    setNewLocationParent(undefined);
  };

  const handleEditSuccess = () => {
    setEditModalLocation(null);
    setSelectedLocation(null);
    window.location.reload();
  };

  const handleRetireSuccess = () => {
    setRetireModalLocation(null);
    setSelectedLocation(null);
    window.location.reload();
  };

  const openMoveModal = (location) => {
    setMoveModalLocation(location);
  };

  const openEditModal = (location) => {
    setEditModalLocation(location);
  };

  const openRetireModal = (location) => {
    setRetireModalLocation(location);
  };

  const openNewLocationModal = (parentUuid?: string) => {
    setNewLocationParent(parentUuid);
    setNewLocationModalOpen(true);
  };

  const handleDropLocation = async (draggedUuid: string, targetParentUuid: string | null) => {
    try {
      await updateLocationParent(draggedUuid, targetParentUuid);
      // Refresh the page to show updated hierarchy
      window.location.reload();
    } catch (error) {
      console.error('Failed to move location:', error);
      // You could show an error message here
    }
  };

  if (isLoading) {
    return (
      <>
        <Header
          illustrationComponent={<Illustration />}
          title={t('locationManagement', 'Location Management')}
          backButton={backButton}
        />
        <div className={styles.loadingContainer}>
          <p>{t('loadingLocations', 'Loading locations...')}</p>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header
          illustrationComponent={<Illustration />}
          title={t('locationManagement', 'Location Management')}
          backButton={backButton}
        />
        <div className={styles.errorContainer}>
          <p>{t('errorLoadingLocations', 'Error loading locations. Please try again.')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        illustrationComponent={<Illustration />}
        title={t('locationManagement', 'Location Management')}
        backButton={backButton}
      />
      <div className={styles.locationManagementWrapper}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <TextInput
              id="location-search"
              labelText=""
              placeholder={t('searchLocations', 'Search locations...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.toolbarActions}>
            <Toggle
              id="include-retired"
              labelText={t('includeRetired', 'Include retired')}
              labelA={t('no', 'No')}
              labelB={t('yes', 'Yes')}
              toggled={includeRetired}
              onToggle={setIncludeRetired}
            />
            <Button
              renderIcon={Add}
              onClick={() => openNewLocationModal()}
              kind="primary"
            >
              {t('addRootLocation', 'Add Root Location')}
            </Button>
          </div>
        </div>

        <div className={styles.contentSplit}>
          <div className={styles.mainPanel}>
            {!searchQuery && (
              <InteractiveHierarchyTree
                tree={locationTree}
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                onAddChild={openNewLocationModal}
                onEdit={openEditModal}
                onMove={openMoveModal}
                onRetire={openRetireModal}
                onDropLocation={handleDropLocation}
              />
            )}

            {searchQuery && (
              <div className={styles.searchResults}>
                <StructuredListWrapper>
                  <StructuredListHead>
                    <StructuredListRow head>
                      <StructuredListCell head>{t('name', 'Name')}</StructuredListCell>
                      <StructuredListCell head>{t('path', 'Path')}</StructuredListCell>
                      <StructuredListCell head>{t('actions', 'Actions')}</StructuredListCell>
                    </StructuredListRow>
                  </StructuredListHead>
                  <StructuredListBody>
                    {filteredLocations.map((location) => (
                      <StructuredListRow key={location.uuid} className={location.retired ? styles.retiredRow : ''}>
                        <StructuredListCell>
                          {location.name}
                          {location.retired && <span style={{ color: '#da1e28', marginLeft: '8px', fontSize: '0.875rem' }}>({t('retired', 'Retired')})</span>}
                        </StructuredListCell>
                        <StructuredListCell className={styles.pathCell}>
                          {getLocationPath(location, locations)}
                        </StructuredListCell>
                        <StructuredListCell>
                          <Button
                            size="sm"
                            kind="ghost"
                            onClick={() => openEditModal(location)}
                            iconDescription={t('edit', 'Edit')}
                            renderIcon={Edit}
                          >
                            {t('edit', 'Edit')}
                          </Button>
                          <Button
                            size="sm"
                            kind="ghost"
                            onClick={() => openMoveModal(location)}
                            iconDescription={t('move', 'Move')}
                          >
                            {t('move', 'Move')}
                          </Button>
                          <Button
                            size="sm"
                            kind={location.retired ? 'ghost' : 'danger'}
                            onClick={() => openRetireModal(location)}
                            iconDescription={location.retired ? t('unretire', 'Unretire') : t('retire', 'Retire')}
                            renderIcon={TrashCan}
                            hasIconOnly
                          />
                        </StructuredListCell>
                      </StructuredListRow>
                    ))}
                    {filteredLocations.length === 0 && (
                      <StructuredListRow>
                        <StructuredListCell>
                          {t('noResultsFound', 'No results found')}
                        </StructuredListCell>
                        <StructuredListCell></StructuredListCell>
                        <StructuredListCell></StructuredListCell>
                      </StructuredListRow>
                    )}
                  </StructuredListBody>
                </StructuredListWrapper>
              </div>
            )}
          </div>

          {selectedLocation && !searchQuery && (() => {
            const loc = flatLocations.find((l) => l.uuid === selectedLocation);
            return loc ? (
              <div className={styles.detailsPanel}>
                <Tile>
                  <h5>{t('selectedLocation', 'Selected Location')}</h5>
                  <div className={styles.detailsContent}>
                    <p>
                      <strong>{t('name', 'Name')}:</strong> {loc.name}
                    </p>
                    {loc.description && (
                      <p>
                        <strong>{t('description', 'Description')}:</strong> {loc.description}
                      </p>
                    )}
                    <p>
                      <strong>{t('parent', 'Parent')}:</strong>{' '}
                      {loc.parentLocation ? loc.parentLocation.display : t('none', 'None')}
                    </p>
                    <p>
                      <strong>{t('path', 'Path')}:</strong> {getLocationPath(loc, locations)}
                    </p>
                    {loc.tags && loc.tags.length > 0 && (
                      <p>
                        <strong>{t('tags', 'Tags')}:</strong>{' '}
                        {loc.tags.map((tag) => tag.display).join(', ')}
                      </p>
                    )}
                    <div className={styles.detailsActions}>
                      <Button
                        size="sm"
                        kind="secondary"
                        renderIcon={Add}
                        onClick={() => openNewLocationModal(loc.uuid)}
                      >
                        {t('addChild', 'Add Child')}
                      </Button>
                      <Button
                        size="sm"
                        kind="secondary"
                        renderIcon={Edit}
                        onClick={() => openEditModal(loc)}
                      >
                        {t('edit', 'Edit')}
                      </Button>
                      <Button
                        size="sm"
                        kind="secondary"
                        renderIcon={Renew}
                        onClick={() => openMoveModal(loc)}
                      >
                        {t('move', 'Move')}
                      </Button>
                      <Button
                        size="sm"
                        kind={loc.retired ? 'secondary' : 'danger'}
                        renderIcon={TrashCan}
                        onClick={() => openRetireModal(loc)}
                      >
                        {loc.retired ? t('unretire', 'Unretire') : t('retire', 'Retire')}
                      </Button>
                    </div>
                  </div>
                </Tile>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {moveModalLocation && (
        <MoveLocationModal
          location={moveModalLocation}
          closeModal={() => setMoveModalLocation(null)}
          onSuccess={handleMoveSuccess}
          locations={locations}
        />
      )}

      {editModalLocation && (
        <EditLocationModal
          location={editModalLocation}
          closeModal={() => setEditModalLocation(null)}
          onSuccess={handleEditSuccess}
          locations={locations}
        />
      )}

      {retireModalLocation && (
        <RetireLocationModal
          location={retireModalLocation}
          closeModal={() => setRetireModalLocation(null)}
          onSuccess={handleRetireSuccess}
          locations={locations}
        />
      )}

      {newLocationModalOpen && (
        <NewLocationModal
          closeModal={() => setNewLocationModalOpen(false)}
          onSuccess={handleNewLocationSuccess}
          defaultParentUuid={newLocationParent}
          locations={locations}
        />
      )}
    </>
  );
};

export default LocationManagement;

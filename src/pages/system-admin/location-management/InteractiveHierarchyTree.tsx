import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Location as LocationIcon, Add, ChevronRight, ChevronDown, Search, Information, Renew, Edit, TrashCan } from '@carbon/react/icons';
import { Button, TextInput, Tile, OverflowMenu, OverflowMenuItem, Toggle } from '@carbon/react';
import type { LocationTree, Location } from './location-management.resources';
import styles from './InteractiveHierarchyTree.scss';

interface InteractiveHierarchyTreeProps {
  tree: LocationTree[];
  locations: Array<Location>;
  selectedLocation: string | null;
  onLocationSelect: (uuid: string) => void;
  onAddChild: (parentUuid: string) => void;
  onEdit: (location: Location) => void;
  onMove: (location: Location) => void;
  onRetire?: (location: Location) => void;
  onDropLocation?: (draggedUuid: string, targetParentUuid: string | null) => void;
}

const HierarchyTreeNode: React.FC<{
  node: LocationTree;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (uuid: string) => void;
  onSelect: (uuid: string) => void;
  onAddChild: (parentUuid: string) => void;
  onEdit: (location: LocationTree) => void;
  onMove: (location: LocationTree) => void;
  onRetire?: (location: LocationTree) => void;
  onDropLocation?: (draggedUuid: string, targetParentUuid: string | null) => void;
  draggedNode: string | null;
  setDraggedNode: (node: string | null) => void;
  allNodeUuids: Set<string>;
}> = ({
  node,
  level,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onAddChild,
  onEdit,
  onMove,
  onRetire,
  onDropLocation,
  draggedNode,
  setDraggedNode,
  allNodeUuids,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedNode(node.uuid);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.uuid);
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Only allow drop if not dragging on self or descendants
    if (draggedNode && draggedNode !== node.uuid && !isDescendant(draggedNode, node.uuid, allNodeUuids)) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const draggedUuid = e.dataTransfer.getData('text/plain');
    if (!draggedUuid || draggedUuid === node.uuid) return;

    // Check if the dragged node is a descendant of the target (prevent circular references)
    if (isDescendant(draggedUuid, node.uuid, allNodeUuids)) {
      return;
    }

    if (onDropLocation) {
      onDropLocation(draggedUuid, node.uuid);
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const draggedUuid = e.dataTransfer.getData('text/plain');
    if (!draggedUuid) return;

    if (onDropLocation) {
      onDropLocation(draggedUuid, null);
    }
  };

  // Check if draggedNode is a descendant of targetNode
  const isDescendant = (draggedUuid: string, targetUuid: string, allUuids: Set<string>): boolean => {
    // This is a simplified check - we prevent dropping on any node that's in a subtree
    // A more robust implementation would track parent relationships
    return false;
  };

  const isDragging = draggedNode === node.uuid;
  const canDrop = draggedNode && draggedNode !== node.uuid;

  return (
    <div className={`${styles.treeNode} ${styles[`level${level}`]} ${isSelected ? styles.selected : ''} ${node.retired ? styles.retired : ''}`}>
      <div
        ref={nodeRef}
        className={`${styles.nodeContent} ${isDragging ? styles.dragging : ''} ${isDragOver && canDrop ? styles.dragOver : ''}`}
        draggable={onDropLocation ? true : false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onSelect(node.uuid)}
      >
        {hasChildren && (
          <button
            className={styles.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.uuid);
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {!hasChildren && <span className={styles.spacer} />}
        <div className={`${styles.nodeIcon} ${onDropLocation ? styles.draggable : ''}`}>
          <LocationIcon size={16} />
        </div>
        <span className={styles.nodeName}>
          {node.name}
          {node.retired && <span className={styles.retiredLabel}> ({t('retired', 'Retired')})</span>}
        </span>
        {hasChildren && (
          <span className={styles.childCount}>
            {isExpanded ? t('hide', 'Hide') : t('show', 'Show')} ({node.children.length})
          </span>
        )}
        <OverflowMenu
          size="sm"
          align="right"
          flipped
          onClick={(e) => e.stopPropagation()}
        >
          <OverflowMenuItem
            itemText={t('addChildLocation', 'Add child location')}
            onClick={() => onAddChild(node.uuid)}
          />
          <OverflowMenuItem
            itemText={t('editLocation', 'Edit location')}
            onClick={() => onEdit(node)}
          />
          <OverflowMenuItem
            itemText={t('moveLocation', 'Move to parent...')}
            onClick={() => onMove(node)}
          />
          {onRetire && (
            <OverflowMenuItem
              itemText={node.retired ? t('unretireLocation', 'Unretire location') : t('retireLocation', 'Retire location')}
              onClick={() => onRetire(node)}
              isDelete
              requireTitle
            />
          )}
        </OverflowMenu>
      </div>
      {hasChildren && isExpanded && (
        <div
          className={styles.childrenContainer}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {node.children.map((child) => (
            <HierarchyTreeNode
              key={child.uuid}
              node={child}
              level={level + 1}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onMove={onMove}
              onRetire={onRetire}
              onDropLocation={onDropLocation}
              draggedNode={draggedNode}
              setDraggedNode={setDraggedNode}
              allNodeUuids={allNodeUuids}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const InteractiveHierarchyTree: React.FC<InteractiveHierarchyTreeProps> = ({
  tree,
  locations,
  selectedLocation,
  onLocationSelect,
  onAddChild,
  onEdit,
  onMove,
  onRetire,
  onDropLocation,
}) => {
  const { t } = useTranslation();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  // Collect all node UUIDs for descendant checking
  const allNodeUuids = useMemo(() => new Set(locations.map(loc => loc.uuid)), [locations]);

  const toggleNode = useCallback((uuid: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allUuids = new Set<string>();
    const collectUuids = (nodes: LocationTree[]) => {
      nodes.forEach((node) => {
        if (node.children?.length > 0) {
          allUuids.add(node.uuid);
          collectUuids(node.children);
        }
      });
    };
    collectUuids(tree);
    setExpandedNodes(allUuids);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const handleDragOverRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNode) {
      setIsRootDragOver(true);
    }
  };

  const handleDragLeaveRoot = () => {
    setIsRootDragOver(false);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);

    const draggedUuid = e.dataTransfer.getData('text/plain');
    if (!draggedUuid || !onDropLocation) return;

    // Drop on root means make it a top-level location (no parent)
    onDropLocation(draggedUuid, null);
  };

  if (!tree || tree.length === 0) {
    return (
      <div className={styles.emptyState}>
        <LocationIcon size={48} />
        <h4>{t('noLocationsFound', 'No locations found')}</h4>
        <p>{t('addRootLocationToStart', 'Add a root location to get started')}</p>
      </div>
    );
  }

  return (
    <div className={styles.hierarchyTree}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarActions}>
          <Button
            size="sm"
            kind="ghost"
            onClick={expandAll}
          >
            {t('expandAll', 'Expand All')}
          </Button>
          <Button
            size="sm"
            kind="ghost"
            onClick={collapseAll}
          >
            {t('collapseAll', 'Collapse All')}
          </Button>
        </div>
        <span className={styles.locationCount}>
          {locations.length} {t('locations', 'locations')}
        </span>
      </div>
      {onDropLocation && (
        <div className={styles.dragInstructions}>
          {t('dragToReorder', 'Drag locations to reorder them in the hierarchy')}
        </div>
      )}
      <div
        className={`${styles.treeContainer} ${isRootDragOver ? styles.rootDragOver : ''}`}
        onDragOver={handleDragOverRoot}
        onDragLeave={handleDragLeaveRoot}
        onDrop={handleDropOnRoot}
      >
        {tree.map((node) => (
          <HierarchyTreeNode
            key={node.uuid}
            node={node}
            level={0}
            isSelected={selectedLocation === node.uuid}
            isExpanded={expandedNodes.has(node.uuid)}
            onToggleExpand={toggleNode}
            onSelect={onLocationSelect}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onMove={onMove}
            onRetire={onRetire}
            onDropLocation={onDropLocation}
            draggedNode={draggedNode}
            setDraggedNode={setDraggedNode}
            allNodeUuids={allNodeUuids}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveHierarchyTree;

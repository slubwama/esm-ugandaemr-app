import React from 'react';
import { Location } from '@carbon/react/icons';
import styles from './HierarchyTree.scss';

interface HierarchyNode {
  uuid: string;
  name: string;
  children: HierarchyNode[];
}

interface HierarchyTreeProps {
  tree: HierarchyNode[];
}

const HierarchyTreeNode: React.FC<{ node: HierarchyNode; level: number }> = ({ node, level }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`${styles.treeNode} ${styles[`level${level}`]}`}>
      <div className={styles.nodeContent}>
        <div className={styles.nodeIcon}>
          <Location size={16} />
        </div>
        <span className={styles.nodeName}>{node.name}</span>
        {hasChildren && (
          <span className={styles.childCount}>{node.children.length}</span>
        )}
      </div>
      {hasChildren && (
        <div className={styles.childrenContainer}>
          {node.children.map((child) => (
            <HierarchyTreeNode key={child.uuid} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchyTree: React.FC<HierarchyTreeProps> = ({ tree }) => {
  if (!tree || tree.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Location size={32} />
        <p>No locations to display</p>
      </div>
    );
  }

  return (
    <div className={styles.hierarchyTree}>
      <div className={styles.treeContainer}>
        {tree.map((node) => (
          <HierarchyTreeNode key={node.uuid} node={node} level={0} />
        ))}
      </div>
    </div>
  );
};

export default HierarchyTree;

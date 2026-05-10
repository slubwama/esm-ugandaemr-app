export interface LocationManagementProps {
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

export interface MoveLocationModalProps {
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
}

export interface NewLocationModalProps {
  closeModal: () => void;
  onSuccess: () => void;
  defaultParentUuid?: string;
}

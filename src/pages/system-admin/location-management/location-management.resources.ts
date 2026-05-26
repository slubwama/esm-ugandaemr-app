import useSWR, { mutate } from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';

export interface Location {
  uuid: string;
  display: string;
  name: string;
  description?: string;
  parentLocation?: Location;
  childLocations?: Location[];
  tags: Array<{ display: string; uuid: string }>;
  latitude?: string;
  longitude?: string;
  retired?: boolean;
}

export interface LocationTree extends Location {
  children: LocationTree[];
  level: number;
}

const LOCATIONRepresentation = 'custom:(uuid,display,name,description,parentLocation:(uuid,display,name),tags:(uuid,display),childLocations:(uuid,display,name))';

export function useLocations(includeAll: boolean = false) {
  const apiUrl = `/ws/rest/v1/location?v=${LOCATIONRepresentation}&limit=100${includeAll ? '&includeAll=true' : ''}`;

  const { data, error, isLoading } = useSWR<{ results: Array<Location> }, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then((res) => res.json())
  );

  return {
    locations: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export function useLocation(uuid: string) {
  const apiUrl = uuid ? `/ws/rest/v1/location/${uuid}?v=full` : null;

  const { data, error, isLoading } = useSWR<Location, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then((res) => res.json()) : null
  );

  return {
    location: data,
    isLoading,
    isError: error,
  };
}

export async function updateLocationParent(locationUuid: string, parentLocationUuid: string | null) {
  const response = await openmrsFetch(`/ws/rest/v1/location/${locationUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parentLocation: parentLocationUuid ? { uuid: parentLocationUuid } : null,
    }),
  });

  mutate((key) => typeof key === 'string' && key.includes('/ws/rest/v1/location'));

  return response.data;
}

export async function createLocation(locationData: {
  name: string;
  description?: string;
  parentLocation?: string;
  tags?: Array<{ uuid: string }>;
}) {
  const response = await openmrsFetch('/ws/rest/v1/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  mutate((key) => typeof key === 'string' && key.includes('/ws/rest/v1/location'));

  return response.data;
}

export async function updateLocation(uuid: string, locationData: {
  name?: string;
  description?: string;
  parentLocation?: string | null;
  tags?: Array<{ uuid: string }>;
  retired?: boolean;
  retireReason?: string;
}) {
  const response = await openmrsFetch(`/ws/rest/v1/location/${uuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  mutate((key) => typeof key === 'string' && key.includes('/ws/rest/v1/location'));

  return response.data;
}

export async function retireLocation(uuid: string, reason: string) {
  const response = await openmrsFetch(`/ws/rest/v1/location/${uuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ retired: true, retireReason: reason }),
  });

  mutate((key) => typeof key === 'string' && key.includes('/ws/rest/v1/location'));

  return response.data;
}

export async function unretireLocation(uuid: string) {
  const response = await openmrsFetch(`/ws/rest/v1/location/${uuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ retired: false }),
  });

  mutate((key) => typeof key === 'string' && key.includes('/ws/rest/v1/location'));

  return response.data;
}

export function buildLocationTree(locations: Array<Location>): LocationTree[] {
  const locationMap = new Map<string, LocationTree>();
  const rootLocations: LocationTree[] = [];

  locations.forEach((loc) => {
    locationMap.set(loc.uuid, { ...loc, children: [], level: 0 });
  });

  locations.forEach((loc) => {
    const node = locationMap.get(loc.uuid);
    if (loc.parentLocation?.uuid) {
      const parent = locationMap.get(loc.parentLocation.uuid);
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootLocations.push(node);
      }
    } else {
      rootLocations.push(node);
    }
  });

  return sortLocationsAlphabetically(rootLocations);
}

function sortLocationsAlphabetically(locations: LocationTree[]): LocationTree[] {
  return locations
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((loc) => ({
      ...loc,
      children: sortLocationsAlphabetically(loc.children),
    }));
}

export function flattenLocationTree(tree: LocationTree[]): Location[] {
  const result: Location[] = [];

  function traverse(nodes: LocationTree[]) {
    nodes.forEach((node) => {
      result.push({
        uuid: node.uuid,
        display: node.display,
        name: node.name,
        description: node.description,
        parentLocation: node.parentLocation,
        tags: node.tags,
        latitude: node.latitude,
        longitude: node.longitude,
        retired: node.retired,
      });
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return result;
}

export function getLocationPath(location: Location | { uuid: string; name?: string; display: string; parentLocation?: { uuid: string } }, allLocations: Array<Location>): string {
  const locationName = location.name || location.display;
  const path: string[] = [locationName];

  let current = location;
  while (current.parentLocation) {
    const parent = allLocations.find((loc) => loc.uuid === current.parentLocation.uuid);
    if (parent) {
      path.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
  }

  return path.join(' > ');
}

export interface PropertyResponse {
  results: Result[];
}

export interface Result {
  uuid: string;
  property: string;
  value: string;
  description: string;
  display: string;
  datatypeClassname: any;
  datatypeConfig: any;
  preferredHandlerClassname: any;
  handlerConfig: any;
  links: Link[];
  resourceVersion: string;
}

export interface SystemSettingResponse {
  entry: FacilityEntry[];
}

export interface FacilityEntry {
  resource: Resource;
}

export interface Resource {
  resourceType: string;
  name: string;
  extension: Extension[];
}

export interface Extension {
  url: string;
  valueCode: string;
}

export interface Link {
  rel: string;
  uri: string;
  resourceAlias: string;
}

export interface Module {
  uuid: string;
  name: string;
  moduleId: string;
  description?: string;
  version: string;
  started: boolean;
  startupErrorMessage?: string;
  requireOpenmrsVersion?: string;
  awareOfModules?: string[];
  links?: ModuleLink[];
}

export interface ModuleLink {
  rel: string;
  uri: string;
  resourceAlias: string;
}

export interface ModulesResponse {
  results?: Module[];
}

export interface SystemInfo {
  systemInfo: {
    'SystemInfo.title.moduleInformation': Record<string, string>;
    'SystemInfo.title.openmrsInformation': Record<string, string>;
  };
}

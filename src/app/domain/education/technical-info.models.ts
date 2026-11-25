import { HardwareSpecPair } from '../models/hardware.models';

export type TechnicalInfoTab =
  | 'overview'
  | 'function'
  | 'specs'
  | 'installation'
  | 'connections'
  | 'power'
  | 'compatibility'
  | 'diagnostics';

export interface TechnicalDossier {
  readonly id: string;
  readonly entityType: 'bench-component' | 'motherboard-region' | 'cable-connection';
  readonly title: string;
  readonly badgeLabel: string;
  readonly subtitle: string;
  readonly accentColor: string;

  // 1. Visão geral
  readonly whatIsIt: string;
  readonly whyItExists: string;

  // 2. Função
  readonly beginnerFunction: string;
  readonly howItWorks: string;

  // 3. Especificações
  readonly specs: readonly HardwareSpecPair[];
  readonly physicalIdentification: string;

  // 4. Instalação
  readonly installationGuide: string;
  readonly precautions: readonly string[];

  // 5. Conexões
  readonly howItConnects: string;
  readonly connectionLinks: readonly string[];
  readonly connectors: readonly string[];

  // 6. Alimentação
  readonly voltages: readonly string[];
  readonly powerConsumption: string;
  readonly powerSource: string;

  // 7. Compatibilidade
  readonly compatibilityRules: readonly string[];

  // 8. Diagnóstico
  readonly whatHappensIfWrong: string;
  readonly commonFaults: readonly string[];
}

import { SelectableWorkbenchItem } from '../models/hardware.models';
import { TECHBENCH_COMPONENTS, findBenchComponentById } from './bench-components.catalog';
import { TECHBENCH_INSPECTABLE_OBJECTS, findInspectableObjectById } from './motherboard.catalog';

export const ALL_WORKBENCH_ITEMS: readonly SelectableWorkbenchItem[] = [
  ...TECHBENCH_COMPONENTS,
  ...TECHBENCH_INSPECTABLE_OBJECTS,
];

export function findWorkbenchItemById(id: string | null): SelectableWorkbenchItem | null {
  if (!id) {
    return null;
  }
  return findBenchComponentById(id) ?? findInspectableObjectById(id);
}

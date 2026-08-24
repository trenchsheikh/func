import type { CommandResult } from './repository';

/** Debug-only persona switching, kept off the public FuncRepository/FuncCommands surface. */
export interface DemoControls {
  personas(): readonly { id: string; label: string }[];
  switchPersona(userId: string): CommandResult;
}

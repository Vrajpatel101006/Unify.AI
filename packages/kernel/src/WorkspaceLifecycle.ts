/**
 * WorkspaceLifecycle — Manages workspace phase transitions.
 *
 * Phases: Opening → Loading → Ready → Saving → Closing → Disposed
 *
 * Plugins and services hook into lifecycle phases to perform
 * initialization, cleanup, and state persistence.
 */

import type { Disposable, IWorkspaceLifecycle, PhaseChangeCallback } from './types';
import { WorkspacePhaseEnum } from './types';

export { WorkspacePhaseEnum as WorkspacePhase };

export class WorkspaceLifecycle implements IWorkspaceLifecycle {
  private _currentPhase: WorkspacePhaseEnum = WorkspacePhaseEnum.Opening;
  private readonly _listeners = new Set<PhaseChangeCallback>();

  getCurrentPhase(): WorkspacePhaseEnum {
    return this._currentPhase;
  }

  async transitionTo(phase: WorkspacePhaseEnum): Promise<void> {
    if (this._currentPhase === WorkspacePhaseEnum.Disposed) {
      throw new Error('[WorkspaceLifecycle] Cannot transition from Disposed state.');
    }

    const previous = this._currentPhase;
    this._currentPhase = phase;

    // Notify all listeners
    const promises: Promise<void>[] = [];
    for (const listener of this._listeners) {
      try {
        const result = listener(phase);
        // Support both sync and async listeners
        if (result && typeof (result as Promise<void>).then === 'function') {
          promises.push(result as Promise<void>);
        }
      } catch (error) {
        console.error(
          `[WorkspaceLifecycle] Error during transition ${previous} → ${phase}:`,
          error
        );
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  onPhaseChange(callback: PhaseChangeCallback): Disposable {
    this._listeners.add(callback);
    return {
      dispose: () => {
        this._listeners.delete(callback);
      },
    };
  }
}

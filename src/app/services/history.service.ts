import { computed, Injectable, signal } from '@angular/core';
import { Field } from '../models/field.model';

/**
 * Command interface for undo/redo pattern
 */
export interface Command {
  execute(): void;
  undo(): void;
  getDescription(): string;
}

/**
 * Command to add a field
 */
export class AddFieldCommand implements Command {
  constructor(
    private field: Field,
    private executeCallback: (field: Field) => void,
    private undoCallback: (fieldId: string) => void,
  ) {}

  execute(): void {
    this.executeCallback(this.field);
  }

  undo(): void {
    this.undoCallback(this.field.id);
  }

  getDescription(): string {
    return `Add field: ${this.field.name}`;
  }
}

/**
 * Command to delete a field
 */
export class DeleteFieldCommand implements Command {
  constructor(
    private field: Field,
    private executeCallback: (fieldId: string) => void,
    private undoCallback: (field: Field) => void,
  ) {}

  execute(): void {
    this.executeCallback(this.field.id);
  }

  undo(): void {
    this.undoCallback(this.field);
  }

  getDescription(): string {
    return `Delete field: ${this.field.name}`;
  }
}

/**
 * Command to update a field
 */
export class UpdateFieldCommand implements Command {
  constructor(
    private oldField: Field,
    private newField: Field,
    private executeCallback: (field: Field) => void,
  ) {}

  execute(): void {
    this.executeCallback(this.newField);
  }

  undo(): void {
    this.executeCallback(this.oldField);
  }

  getDescription(): string {
    return `Update field: ${this.newField.name}`;
  }
}

/**
 * Command to move a field
 */
export class MoveFieldCommand implements Command {
  constructor(
    private fieldId: string,
    private oldLeft: number,
    private oldTop: number,
    private newLeft: number,
    private newTop: number,
    private executeCallback: (fieldId: string, left: number, top: number) => void,
  ) {}

  execute(): void {
    this.executeCallback(this.fieldId, this.newLeft, this.newTop);
  }

  undo(): void {
    this.executeCallback(this.fieldId, this.oldLeft, this.oldTop);
  }

  getDescription(): string {
    return `Move field`;
  }
}

/**
 * Command to resize a field
 */
export class ResizeFieldCommand implements Command {
  constructor(
    private fieldId: string,
    private oldLeft: number,
    private oldTop: number,
    private oldWidth: number,
    private oldHeight: number,
    private newLeft: number,
    private newTop: number,
    private newWidth: number,
    private newHeight: number,
    private executeCallback: (fieldId: string, left: number, top: number, width: number, height: number) => void,
  ) {}

  execute(): void {
    this.executeCallback(this.fieldId, this.newLeft, this.newTop, this.newWidth, this.newHeight);
  }

  undo(): void {
    this.executeCallback(this.fieldId, this.oldLeft, this.oldTop, this.oldWidth, this.oldHeight);
  }

  getDescription(): string {
    return `Resize field`;
  }
}

/**
 * Command to replace the whole set of fields at once (import), so one undo reverts it.
 */
export class ReplaceFieldsCommand implements Command {
  constructor(
    private before: Field[],
    private after: Field[],
    private applyCallback: (fields: Field[]) => void,
  ) {}

  execute(): void {
    this.applyCallback(this.after);
  }

  undo(): void {
    this.applyCallback(this.before);
  }

  getDescription(): string {
    return `Replace ${this.before.length} fields with ${this.after.length}`;
  }
}

/**
 * History service to manage undo/redo operations
 */
@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistorySize = 50;

  private readonly undoCount = signal(0);
  private readonly redoCount = signal(0);

  readonly canUndo = computed(() => this.undoCount() > 0);
  readonly canRedo = computed(() => this.redoCount() > 0);

  /** Execute a command and add it to history. */
  executeCommand(command: Command): void {
    command.execute();
    this.undoStack.push(command);

    // A new command invalidates everything that was undone.
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.updateState();
  }

  /** Undo the last command. */
  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;

    command.undo();
    this.redoStack.push(command);
    this.updateState();
  }

  /** Redo the last undone command. */
  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;

    command.execute();
    this.undoStack.push(command);
    this.updateState();
  }

  /** Clear all history. */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateState();
  }

  getUndoDescription(): string | null {
    return this.undoStack.at(-1)?.getDescription() ?? null;
  }

  getRedoDescription(): string | null {
    return this.redoStack.at(-1)?.getDescription() ?? null;
  }

  getHistorySize(): { undo: number; redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
    };
  }

  private updateState(): void {
    this.undoCount.set(this.undoStack.length);
    this.redoCount.set(this.redoStack.length);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
    private undoCallback: (fieldId: string) => void
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
    private undoCallback: (field: Field) => void
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
    private executeCallback: (field: Field) => void
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
    private executeCallback: (fieldId: string, left: number, top: number) => void
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
    private executeCallback: (fieldId: string, left: number, top: number, width: number, height: number) => void
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
 * History service to manage undo/redo operations
 */
@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize = 50;

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  canUndo$: Observable<boolean> = this.canUndoSubject.asObservable();
  canRedo$: Observable<boolean> = this.canRedoSubject.asObservable();

  /**
   * Execute a command and add it to history
   */
  executeCommand(command: Command): void {
    command.execute();
    this.undoStack.push(command);

    // Clear redo stack when new command is executed
    this.redoStack = [];

    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.updateState();
  }

  /**
   * Undo the last command
   */
  undo(): void {
    if (this.undoStack.length === 0) return;

    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);

    this.updateState();
  }

  /**
   * Redo the last undone command
   */
  redo(): void {
    if (this.redoStack.length === 0) return;

    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);

    this.updateState();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateState();
  }

  /**
   * Get undo stack description
   */
  getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].getDescription();
  }

  /**
   * Get redo stack description
   */
  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].getDescription();
  }

  /**
   * Update can undo/redo observables
   */
  private updateState(): void {
    this.canUndoSubject.next(this.undoStack.length > 0);
    this.canRedoSubject.next(this.redoStack.length > 0);
  }

  /**
   * Get history size
   */
  getHistorySize(): { undo: number; redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length
    };
  }
}

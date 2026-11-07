import { TestBed } from '@angular/core/testing';
import { Command, HistoryService } from './history.service';

class CounterCommand implements Command {
  constructor(
    private readonly state: { value: number },
    private readonly delta: number,
  ) {}
  execute(): void {
    this.state.value += this.delta;
  }
  undo(): void {
    this.state.value -= this.delta;
  }
  getDescription(): string {
    return `add ${this.delta}`;
  }
}

describe('HistoryService', () => {
  let history: HistoryService;
  let state: { value: number };

  beforeEach(() => {
    history = TestBed.inject(HistoryService);
    state = { value: 0 };
  });

  it('starts with nothing to undo or redo', () => {
    expect(history.canUndo()).toBeFalse();
    expect(history.canRedo()).toBeFalse();
    expect(history.getUndoDescription()).toBeNull();
    expect(history.getRedoDescription()).toBeNull();
  });

  it('executes, undoes and redoes a command', () => {
    history.executeCommand(new CounterCommand(state, 5));
    expect(state.value).toBe(5);
    expect(history.canUndo()).toBeTrue();
    expect(history.getUndoDescription()).toBe('add 5');

    history.undo();
    expect(state.value).toBe(0);
    expect(history.canUndo()).toBeFalse();
    expect(history.canRedo()).toBeTrue();
    expect(history.getRedoDescription()).toBe('add 5');

    history.redo();
    expect(state.value).toBe(5);
    expect(history.canRedo()).toBeFalse();
  });

  it('discards the redo stack when a new command runs after an undo', () => {
    history.executeCommand(new CounterCommand(state, 1));
    history.undo();
    history.executeCommand(new CounterCommand(state, 2));
    expect(history.canRedo()).toBeFalse();
    expect(state.value).toBe(2);
  });

  it('undo and redo on empty stacks do nothing', () => {
    history.undo();
    history.redo();
    expect(state.value).toBe(0);
  });

  it('keeps at most 50 steps, dropping the oldest', () => {
    for (let i = 0; i < 60; i++) {
      history.executeCommand(new CounterCommand(state, 1));
    }
    expect(history.getHistorySize().undo).toBe(50);
    for (let i = 0; i < 60; i++) {
      history.undo();
    }
    expect(state.value).toBe(10); // the 10 oldest commands fell off and can no longer be undone
  });

  it('clear() empties both stacks', () => {
    history.executeCommand(new CounterCommand(state, 1));
    history.undo();
    history.clear();
    expect(history.getHistorySize()).toEqual({ undo: 0, redo: 0 });
    expect(history.canUndo()).toBeFalse();
    expect(history.canRedo()).toBeFalse();
  });
});

import { createInitialState } from "./data/initialState";
import { directionWords } from "./data/vocab";
import { getExit } from "./data/map";
import { search } from "./helpers/search";
import { normalizeInput } from "./helpers/text";
import {
  DEST_GRATE_OPEN,
  DEST_STEPS,
  OBJ_GRILL,
  GRILL_START_ROOM,
  DEATH_EXIT,
  ITEM_START,
  ITEM_END,
  ROOM_BRIDGE_HALF,
  ROOM_DRAWBRIDGE,
  ROOM_LOKI_STATUE,
  ROOM_WATERFALL,
} from "./constants";
import {
  canSee,
  describeVisibleEntities,
  getLocationText,
} from "./logic/descriptions";
import { describeEntity } from "./data/entities";
import { Direction, GameResponse, GameState } from "./types";

export function createEngine(state: GameState = createInitialState()): GameState {
  return state;
}

export function look(state: GameState): string[] {
  const lines = getLocationText(state);
  if (canSee(state)) {
    lines.push(...describeVisibleEntities(state));
  }
  return lines;
}

export function move(state: GameState, dir: Direction): string[] {
  const dest = getExit(state, state.room, dir);
  if (dest === 0) {
    return ["You can't go that way."];
  }
  if (dest === DEATH_EXIT) {
    state.alive = false;
    return [
      "You stumble and fall into the chasm and smash yourself to a pulp on the rocks below.",
    ];
  }
  state.room = dest;
  applyDynamicFlags(state);
  return look(state);
}

export function listInventory(state: GameState): string[] {
  const carried: string[] = [];
  for (let i = ITEM_START; i <= ITEM_END; i += 1) {
    if (state.positions[i] === -1) {
      carried.push(describeEntity(i));
    }
  }
  if (!carried.length) {
    return ["You are carrying nothing."];
  }
  return ["You are carrying:", ...carried];
}

export function handleInput(state: GameState, raw: string): GameResponse {
  const normalized = normalizeInput(raw);
  state.moves += 1;
  applyDynamicFlags(state);

  const output: string[] = [];

  if (search(normalized, " quit ") > 0) {
    state.alive = false;
    output.push("Thanks for playing. (Quit command issued)");
    return { output, state };
  }

  if (search(normalized, " look ") > 0) {
    output.push(...look(state));
    return { output, state };
  }

  for (let dir = 0; dir < directionWords.length; dir += 1) {
    if (search(normalized, directionWords[dir]) > 0) {
      output.push(...move(state, dir as Direction));
      return { output, state };
    }
  }

  if (search(normalized, " list ") > 0) {
    output.push(...listInventory(state));
    return { output, state };
  }

  output.push(
    "Command parsing is not yet fully implemented. Try 'look' or a direction (north, south, east, west)."
  );
  return { output, state };
}

function applyDynamicFlags(state: GameState): void {
  if (state.room === ROOM_BRIDGE_HALF) {
    state.H = DEATH_EXIT;
  }
  if (state.room === ROOM_WATERFALL) {
    state.W = DEST_STEPS;
  }
  if (state.room === ROOM_LOKI_STATUE) {
    state.W = 0;
  }
  if (state.positions[OBJ_GRILL] !== GRILL_START_ROOM) {
    state.G = DEST_GRATE_OPEN;
  }
  if (state.room === ROOM_DRAWBRIDGE) {
    state.D = ROOM_DRAWBRIDGE;
  }
}

export function getState(state: GameState): GameState {
  return state;
}

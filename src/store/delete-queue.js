import to from 'await-to-js';

import {USER_LOGOUT} from './user';
import {File} from "../model";

import {userSession} from '../blockstack-config';

const initialState = {
  files: [],
  completed: [],
  failed: [],
  log: [],
  current: '',
  show: false,
  inProgress: false
};

/* Action types */

export const SET = '@delete-queue/SET';
export const START = '@delete-queue/START';
export const FINISH = '@delete-queue/FINISHED';
export const FILE_START = '@delete-queue/FILE_STARTED';
export const FILE_OK = '@delete-queue/FILE_OK';
export const FILE_ERROR = '@delete-queue/FILE_ERROR';
export const RESET = '@delete-queue/RESET';


/* Reducer */

export default (state = initialState, action) => {
  switch (action.type) {
    case SET: {
      const {files} = action.payload;
      return Object.assign({}, state, {files, show: true});
    }
    case START: {
      return Object.assign({}, state, {inProgress: true});
    }
    case FINISH: {
      return Object.assign({}, state, {inProgress: false});
    }
    case FILE_START: {
      const [file,] = state.files;
      const path = `${file.parent}${file.label}`;
      return Object.assign({}, state, {current: path});
    }
    case FILE_OK: {
      const [file, ...files] = state.files;
      const completed = [...state.completed, file];
      const path = `${file.parent}${file.label}`;
      const log = [...state.log, {type: 'success', msg: `${path} deleted`}];
      return Object.assign({}, state, {files, completed, current: '', log});
    }
    case FILE_ERROR: {
      const [file, ...files] = state.files;
      const failed = [...state.failed, file];
      const path = `${file.parent}${file.label}`;
      const log = [...state.log, {type: 'error', msg: `${path} could not delete`}];
      return Object.assign({}, state, {files, failed, current: '', log});
    }
    case RESET:
      return initialState;
    case USER_LOGOUT:
      return initialState;
    default:
      return state;
  }
}


/* Actions */
export const setDeleteQueue = (files) => (dispatch) => {
  dispatch(setAct(files));
};

export const startDeleteQueue = () => async (dispatch, getState) => {
  dispatch(startAct());

  while (true) {

    const {deleteQueue: queue} = getState();
    const {files} = queue;

    if (files.length === 0) {
      dispatch(finishAct());
      break;
    }

    const { project} = getState();

    const [file,] = files;

    dispatch(fileStartAct());

    // Get radiks record of file
    const [err1, fileRecs] = await to(File.fetchOwnList({project: project._id, name: file.name}));

    if (err1) {
      dispatch(fileErrorAct());
      continue;
    }

    if (fileRecs.length === 0) {
      dispatch(fileErrorAct());
      continue;
    }

    const fileRec = fileRecs[0];

    // Overwrite file (on gaia) with 1 byte array
    const [err2, ] = await to(userSession.putFile(file.name, new ArrayBuffer(1), {
      encrypt: false,
      contentType: file.type
    }));

    if (err2) {
      dispatch(fileErrorAct());
      continue;
    }

    // Save radiks record
    fileRec.update({deleted: true});

    const [err3,] = await to(fileRec.save());
    if (err3) {
      dispatch(fileErrorAct());
      continue;
    }

    dispatch(fileOkAct());
  }
};

export const resetDeleteQueue = () => (dispatch) => {
  dispatch(resetAct());
};


/* Action creators */

export const setAct = (files) => ({
  type: SET,
  payload: {
    files
  }
});

export const startAct = () => ({
  type: START
});


export const finishAct = () => ({
  type: FINISH
});


export const fileStartAct = () => ({
  type: FILE_START
});

export const fileOkAct = () => ({
  type: FILE_OK
});

export const fileErrorAct = () => ({
  type: FILE_ERROR
});


export const resetAct = () => ({
  type: RESET
});

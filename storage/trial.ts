import * as SecureStore from "expo-secure-store";

import {
  calculateTrialStatus,
  createTrialState,
  DEVELOPMENT_TRIAL_DURATION_MILLISECONDS,
  TrialState,
  TrialStatus,
  TRIAL_DURATION_MILLISECONDS
} from "../constants/trial";


const DEVELOPMENT_TRIAL_KEY =
  "shopwithezz.trial.development.v1";

const PRODUCTION_TRIAL_KEY =
  "shopwithezz.trial.production.v1";


function trialKey(){
  return __DEV__
    ? DEVELOPMENT_TRIAL_KEY
    : PRODUCTION_TRIAL_KEY;
}


function trialDuration(){
  return __DEV__
    ? DEVELOPMENT_TRIAL_DURATION_MILLISECONDS
    : TRIAL_DURATION_MILLISECONDS;
}


function validTrialState(value:unknown):value is TrialState{
  if(!value || typeof value !== "object"){
    return false;
  }

  const state = value as Partial<TrialState>;

  return (
    typeof state.startedAt === "number"
    && Number.isFinite(state.startedAt)
    && typeof state.lastCheckedAt === "number"
    && Number.isFinite(state.lastCheckedAt)
  );
}


export async function loadTrialStatus(
  now:number = Date.now()
):Promise<TrialStatus>{
  const saved =
    await SecureStore.getItemAsync(trialKey());

  let state:TrialState;

  if(saved){
    try{
      const parsed:unknown = JSON.parse(saved);
      state = validTrialState(parsed)
        ? parsed
        : createTrialState(now);
    }
    catch{
      state = createTrialState(now);
    }
  }
  else{
    state = createTrialState(now);
  }

  const status = calculateTrialStatus(
    state,
    now,
    trialDuration()
  );

  await SecureStore.setItemAsync(
    trialKey(),
    JSON.stringify(status.nextState)
  );

  return status;
}


export async function resetDevelopmentTrial(){
  if(!__DEV__){
    return;
  }

  await SecureStore.deleteItemAsync(
    DEVELOPMENT_TRIAL_KEY
  );
}

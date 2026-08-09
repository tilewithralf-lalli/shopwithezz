export const TRIAL_DAYS = 31;

export const DAY_IN_MILLISECONDS =
  24 * 60 * 60 * 1000;

export const TRIAL_DURATION_MILLISECONDS =
  TRIAL_DAYS * DAY_IN_MILLISECONDS;

export const DEVELOPMENT_TRIAL_MINUTES = 1;

export const DEVELOPMENT_TRIAL_DURATION_MILLISECONDS =
  DEVELOPMENT_TRIAL_MINUTES * 60 * 1000;


export type TrialState = {
  startedAt:number;
  lastCheckedAt:number;
};

export type TrialStatus = {
  startedAt:number;
  expiresAt:number;
  millisecondsRemaining:number;
  daysRemaining:number;
  isExpired:boolean;
  clockMovedBack:boolean;
  nextState:TrialState;
};


export function createTrialState(
  now:number = Date.now()
):TrialState{
  return {
    startedAt:now,
    lastCheckedAt:now
  };
}


export function calculateTrialStatus(
  state:TrialState,
  now:number = Date.now(),
  durationMilliseconds:number = TRIAL_DURATION_MILLISECONDS
):TrialStatus{
  const safeStartedAt =
    Number.isFinite(state.startedAt)
      ? state.startedAt
      : now;

  const safeLastCheckedAt =
    Number.isFinite(state.lastCheckedAt)
      ? Math.max(state.lastCheckedAt,safeStartedAt)
      : safeStartedAt;

  const clockMovedBack =
    now < safeLastCheckedAt;

  const effectiveNow =
    Math.max(now,safeLastCheckedAt);

  const expiresAt =
    safeStartedAt + durationMilliseconds;

  const timeRemaining =
    Math.max(0,expiresAt-effectiveNow);

  const isExpired =
    effectiveNow >= expiresAt;

  const daysRemaining =
    isExpired
      ? 0
      : Math.ceil(
          timeRemaining / DAY_IN_MILLISECONDS
        );

  return {
    startedAt:safeStartedAt,
    expiresAt,
    millisecondsRemaining:timeRemaining,
    daysRemaining,
    isExpired,
    clockMovedBack,
    nextState:{
      startedAt:safeStartedAt,
      lastCheckedAt:effectiveNow
    }
  };
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const REMINDER_STATE_KEY = "shopwithezz.backup-reminder.v1";
const CHANGE_THRESHOLD = __DEV__ ? 2 : 8;
const SNOOZE_MILLISECONDS = 24 * 60 * 60 * 1000;

type ReminderState = {
  lastSnapshot:string;
  changesSinceBackup:number;
  lastBackupAt:number | null;
  snoozedUntil:number;
};

type SessionItem = {id?:string;name?:string;price?:number;purchased?:boolean;quantity?:number;category?:string};
type SessionSnapshot = {budget?:number;items?:SessionItem[]};

const EMPTY_STATE:ReminderState = {lastSnapshot:"",changesSinceBackup:0,lastBackupAt:null,snoozedUntil:0};

function parseState(value:string | null):ReminderState{
  if(!value){return EMPTY_STATE;}
  try{return {...EMPTY_STATE,...JSON.parse(value)};}
  catch{return EMPTY_STATE;}
}

function parseSession(value:string):SessionSnapshot{
  try{return JSON.parse(value) as SessionSnapshot;}
  catch{return {};}
}

function countChanges(before:string,after:string):number{
  if(!before || before === after){return 0;}
  const oldSession = parseSession(before);
  const newSession = parseSession(after);
  const oldItems = new Map((oldSession.items || []).map((item,index)=>[item.id || String(index),JSON.stringify(item)]));
  const newItems = new Map((newSession.items || []).map((item,index)=>[item.id || String(index),JSON.stringify(item)]));
  const ids = new Set([...oldItems.keys(),...newItems.keys()]);
  let changes = oldSession.budget === newSession.budget ? 0 : 1;
  ids.forEach(id=>{if(oldItems.get(id) !== newItems.get(id)){changes += 1;}});
  return Math.max(1,changes);
}

export async function observeBackupChanges(sessionSnapshot:string,now:number = Date.now()){
  const state = parseState(await AsyncStorage.getItem(REMINDER_STATE_KEY));
  if(!state.lastSnapshot){
    const initial = {...state,lastSnapshot:sessionSnapshot};
    await AsyncStorage.setItem(REMINDER_STATE_KEY,JSON.stringify(initial));
    return {shouldRemind:false,changesSinceBackup:initial.changesSinceBackup};
  }
  const next:ReminderState = {...state,lastSnapshot:sessionSnapshot,changesSinceBackup:state.changesSinceBackup + countChanges(state.lastSnapshot,sessionSnapshot)};
  await AsyncStorage.setItem(REMINDER_STATE_KEY,JSON.stringify(next));
  return {shouldRemind:next.changesSinceBackup >= CHANGE_THRESHOLD && now >= next.snoozedUntil,changesSinceBackup:next.changesSinceBackup};
}

export async function snoozeBackupReminder(now:number = Date.now()){
  const state = parseState(await AsyncStorage.getItem(REMINDER_STATE_KEY));
  await AsyncStorage.setItem(REMINDER_STATE_KEY,JSON.stringify({...state,snoozedUntil:now + SNOOZE_MILLISECONDS}));
}

export async function markBackupCompleted(sessionSnapshot:string,now:number = Date.now()){
  const state = parseState(await AsyncStorage.getItem(REMINDER_STATE_KEY));
  await AsyncStorage.setItem(REMINDER_STATE_KEY,JSON.stringify({...state,lastSnapshot:sessionSnapshot,changesSinceBackup:0,lastBackupAt:now,snoozedUntil:0}));
}

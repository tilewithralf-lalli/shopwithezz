import AsyncStorage from "@react-native-async-storage/async-storage";

export const LEGACY_SESSION_KEY = "shopwithezz-v1-final-session-v1";
export const LIST_INDEX_KEY = "shopwithezz-shopping-lists-v1";
export const ACTIVE_LIST_ID_KEY = "shopwithezz-active-list-id-v1";

export type ShoppingItem = {
  id:string;
  name:string;
  price:number;
  purchased:boolean;
  quantity?:number;
  barcode?:string;
  category?:string;
};

export type ShoppingSession = {
  budget:number;
  spent?:number;
  items:ShoppingItem[];
};

export type ShoppingList = {
  id:string;
  name:string;
  createdAt:string;
  updatedAt:string;
  session:ShoppingSession;
};

const EMPTY_SESSION:ShoppingSession = {budget:0,spent:0,items:[]};

// Every list operation changes the same stored collection.  Keep those changes
// in order so an older screen save cannot overwrite a newly imported list.
let listOperation = Promise.resolve();

function runListOperation<T>(operation:()=>Promise<T>):Promise<T>{
  const next = listOperation.then(operation,operation);
  listOperation = next.then(()=>undefined,()=>undefined);
  return next;
}

function makeId(){
  return `list-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function safeSession(value:unknown):ShoppingSession{
  const candidate = value as Partial<ShoppingSession> | null;
  return {
    budget:Math.max(0,Number(candidate?.budget || 0)),
    spent:0,
    items:Array.isArray(candidate?.items) ? candidate!.items : []
  };
}

async function loadLists():Promise<ShoppingList[]>{
  const saved = await AsyncStorage.getItem(LIST_INDEX_KEY);
  return saved ? JSON.parse(saved) as ShoppingList[] : [];
}

async function saveLists(lists:ShoppingList[]){
  await AsyncStorage.setItem(LIST_INDEX_KEY,JSON.stringify(lists));
}

async function ensureListsUnlocked(){
  const lists = await loadLists();
  if(lists.length){
    return lists;
  }
  const legacy = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
  const now = new Date().toISOString();
  const first:ShoppingList = {
    id:makeId(),
    name:"My Shopping List",
    createdAt:now,
    updatedAt:now,
    session:legacy ? safeSession(JSON.parse(legacy)) : EMPTY_SESSION
  };
  await saveLists([first]);
  await AsyncStorage.setItem(ACTIVE_LIST_ID_KEY,first.id);
  return [first];
}

export function ensureLists(){
  return runListOperation(ensureListsUnlocked);
}

export function getActiveList(){
  return runListOperation(async()=>{
  const lists = await ensureListsUnlocked();
  const activeId = await AsyncStorage.getItem(ACTIVE_LIST_ID_KEY);
  return lists.find(list=>list.id === activeId) || lists[0];
  });
}

export function saveActiveSession(session:ShoppingSession){
  return runListOperation(async()=>{
  const lists = await ensureListsUnlocked();
  const activeId = await AsyncStorage.getItem(ACTIVE_LIST_ID_KEY);
  const active = lists.find(list=>list.id === activeId) || lists[0];
  const next = lists.map(list=>list.id === active.id ? {...list,updatedAt:new Date().toISOString(),session:safeSession(session)} : list);
  await saveLists(next);
  await AsyncStorage.setItem(LEGACY_SESSION_KEY,JSON.stringify(safeSession(session)));
  });
}

export function createList(name:string,session:ShoppingSession){
  return runListOperation(async()=>{
  const lists = await ensureListsUnlocked();
  const now = new Date().toISOString();
  const list:ShoppingList = {id:makeId(),name:name.trim() || "Imported List",createdAt:now,updatedAt:now,session:safeSession(session)};
  await saveLists([...lists,list]);
  return list;
  });
}

export function selectList(id:string){
  return runListOperation(async()=>{
  const lists = await ensureListsUnlocked();
  const currentId = await AsyncStorage.getItem(ACTIVE_LIST_ID_KEY);
  const currentLegacy = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
  const savedCurrent = currentLegacy ? safeSession(JSON.parse(currentLegacy)) : null;
  const refreshed = savedCurrent && currentId
    ? lists.map(list=>list.id === currentId ? {...list,updatedAt:new Date().toISOString(),session:savedCurrent} : list)
    : lists;
  const next = refreshed.find(list=>list.id === id);
  if(!next){
    throw new Error("Shopping list not found");
  }
  await saveLists(refreshed);
  await AsyncStorage.setItem(ACTIVE_LIST_ID_KEY,next.id);
  await AsyncStorage.setItem(LEGACY_SESSION_KEY,JSON.stringify(next.session));
  return next;
  });
}

export function renameList(id:string,name:string){
  return runListOperation(async()=>{
    const cleanName = name.trim();
    if(!cleanName){
      throw new Error("Shopping list name is required");
    }

    const lists = await ensureListsUnlocked();
    const list = lists.find(candidate=>candidate.id === id);
    if(!list){
      throw new Error("Shopping list not found");
    }
    if(list.name === "My Shopping List"){
      throw new Error("The main shopping list cannot be renamed");
    }

    const now = new Date().toISOString();
    const next = lists.map(candidate=>
      candidate.id === id
        ? {...candidate,name:cleanName,updatedAt:now}
        : candidate
    );
    await saveLists(next);
    return next.find(candidate=>candidate.id === id)!;
  });
}

export function deleteList(id:string){
  return runListOperation(async()=>{
  const lists = await ensureListsUnlocked();
  const list = lists.find(candidate=>candidate.id === id);
  if(!list || list.name === "My Shopping List"){
    throw new Error("This list cannot be deleted");
  }

  const nextLists = lists.filter(candidate=>candidate.id !== id);
  const activeId = await AsyncStorage.getItem(ACTIVE_LIST_ID_KEY);
  await saveLists(nextLists);

  if(activeId === id){
    const fallback =
      nextLists.find(candidate=>candidate.name === "My Shopping List")
      || nextLists[0];
    await AsyncStorage.setItem(ACTIVE_LIST_ID_KEY,fallback.id);
    await AsyncStorage.setItem(
      LEGACY_SESSION_KEY,
      JSON.stringify(fallback.session)
    );
  }
  });
}

import AsyncStorage
  from "@react-native-async-storage/async-storage";


const STORAGE_KEY =
  "shopwithezz_shopping";

const PANTRY_KEY =
  "shopwithezz_pantry";

const BUDGET_KEY =
  "shopwithezz_budget";


function createId(){

  return (

    Date.now().toString()

    +

    "-"

    +

    Math.random()
      .toString(36)
      .slice(2,8)

  );

}


// =======================
// SHOPPING LISTS
// =======================


export async function getShoppingList(){

  try{

    const data =
      await AsyncStorage.getItem(
        STORAGE_KEY
      );

    if(!data){

      return [];

    }

    const parsed =
      JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];

  }
  catch(error){

    return [];

  }

}


export async function saveShoppingList(
  items:any[]
){

  await AsyncStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(items)

  );

}


export async function addShoppingItem(
  item:any
){

  const existing =
    await getShoppingList();

  const newItem = {

    id:
      createId(),

    name:
      item.name,

    store:
      item.store || "",

    checked:
      Boolean(item.checked),

    quantity:
      item.quantity || 1,

    price:
      item.price || 0,

    barcode:
      item.barcode || "",

    pantryId:
      item.pantryId || ""

  };

  existing.push(newItem);

  await saveShoppingList(
    existing
  );

  return newItem;

}


export async function updateShoppingItem(
  updated:any
){

  const items =
    await getShoppingList();

  const result =
    items.map(

      (item:any)=>

        item.id === updated.id

          ? {
              ...item,
              ...updated
            }

          : item

    );

  await saveShoppingList(
    result
  );

  if(updated.pantryId){

    await setPantryItemChecked(

      String(updated.pantryId),

      Boolean(updated.checked),

      false

    );

  }

}


export async function deleteShoppingItem(
  id:string
){

  const items =
    await getShoppingList();

  const filtered =
    items.filter(

      (item:any)=>
        item.id !== id

    );

  await saveShoppingList(
    filtered
  );

}


// =======================
// PANTRY LIST
// =======================


export async function getPantryList(){

  try{

    const data =
      await AsyncStorage.getItem(
        PANTRY_KEY
      );

    if(!data){

      return [];

    }

    const parsed =
      JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];

  }
  catch(error){

    return [];

  }

}


export async function savePantryList(
  items:any[]
){

  await AsyncStorage.setItem(

    PANTRY_KEY,

    JSON.stringify(items)

  );

}


export async function addPantryItem(
  item:any
){

  const existing =
    await getPantryList();

  const cleanBarcode =
    String(item.barcode || "")
      .trim();

  const duplicate =
    existing.find(

      (existingItem:any)=>

        cleanBarcode !== ""

        &&

        String(
          existingItem.barcode || ""
        ) === cleanBarcode

    );

  if(duplicate){

    const updatedItems =
      existing.map(

        (existingItem:any)=>

          existingItem.id === duplicate.id

            ? {
                ...existingItem,

                name:
                  item.name
                  ||
                  existingItem.name,

                quantity:
                  (
                    Number(
                      existingItem.quantity
                    )
                    ||
                    1
                  )
                  +
                  (
                    Number(item.quantity)
                    ||
                    1
                  ),

                checked:false
              }

            : existingItem

      );

    await savePantryList(
      updatedItems
    );

    return updatedItems.find(

      (existingItem:any)=>
        existingItem.id === duplicate.id

    );

  }

  const newItem = {

    id:
      createId(),

    name:
      item.name,

    barcode:
      cleanBarcode,

    quantity:
      item.quantity || 1,

    checked:false,

    assignedStore:
      item.assignedStore || "",

    createdAt:
      new Date().toISOString()

  };

  existing.push(newItem);

  await savePantryList(
    existing
  );

  return newItem;

}


export async function updatePantryItem(
  updated:any
){

  const pantryItems =
    await getPantryList();

  const result =
    pantryItems.map(

      (item:any)=>

        item.id === updated.id

          ? {
              ...item,
              ...updated
            }

          : item

    );

  await savePantryList(
    result
  );

  if(
    typeof updated.checked
    ===
    "boolean"
  ){

    await syncPantryCheckToStores(

      String(updated.id),

      Boolean(updated.checked)

    );

  }

}


export async function setPantryItemChecked(
  id:string,
  checked:boolean,
  syncStores:boolean = true
){

  const pantryItems =
    await getPantryList();

  const result =
    pantryItems.map(

      (item:any)=>

        item.id === id

          ? {
              ...item,
              checked
            }

          : item

    );

  await savePantryList(
    result
  );

  if(syncStores){

    await syncPantryCheckToStores(
      id,
      checked
    );

  }

}


async function syncPantryCheckToStores(
  pantryId:string,
  checked:boolean
){

  const shoppingItems =
    await getShoppingList();

  let changed =
    false;

  const updatedShoppingItems =
    shoppingItems.map(

      (item:any)=>{

        if(
          String(item.pantryId || "")
          ===
          pantryId
        ){

          changed = true;

          return {
            ...item,
            checked
          };

        }

        return item;

      }

    );

  if(changed){

    await saveShoppingList(
      updatedShoppingItems
    );

  }

}


export async function deletePantryItem(
  id:string
){

  const pantryItems =
    await getPantryList();

  const filteredPantry =
    pantryItems.filter(

      (item:any)=>
        item.id !== id

    );

  await savePantryList(
    filteredPantry
  );

  const shoppingItems =
    await getShoppingList();

  const updatedShoppingItems =
    shoppingItems.map(

      (item:any)=>

        String(item.pantryId || "")
        ===
        id

          ? {
              ...item,
              pantryId:""
            }

          : item

    );

  await saveShoppingList(
    updatedShoppingItems
  );

}


export async function clearCompletedPantryItems(){

  const pantryItems =
    await getPantryList();

  const completedIds =
    pantryItems

      .filter(
        (item:any)=>item.checked
      )

      .map(
        (item:any)=>String(item.id)
      );

  const remaining =
    pantryItems.filter(

      (item:any)=>
        !item.checked

    );

  await savePantryList(
    remaining
  );

  if(completedIds.length > 0){

    const shoppingItems =
      await getShoppingList();

    const updatedShoppingItems =
      shoppingItems.map(

        (item:any)=>

          completedIds.includes(
            String(item.pantryId || "")
          )

            ? {
                ...item,
                pantryId:""
              }

            : item

      );

    await saveShoppingList(
      updatedShoppingItems
    );

  }

}


export async function importPantryItemToStore(
  pantryId:string,
  store:string
){

  const pantryItems =
    await getPantryList();

  const pantryItem =
    pantryItems.find(

      (item:any)=>
        item.id === pantryId

    );

  if(!pantryItem){

    return null;

  }

  const shoppingItems =
    await getShoppingList();

  const alreadyImported =
    shoppingItems.find(

      (item:any)=>

        String(item.pantryId || "")
        ===
        pantryId

        &&

        String(item.store || "")
          .trim()
          .toLowerCase()

        ===

        store
          .trim()
          .toLowerCase()

    );

  if(alreadyImported){

    return alreadyImported;

  }

  const newShoppingItem = {

    id:
      createId(),

    name:
      pantryItem.name,

    store,

    checked:
      Boolean(pantryItem.checked),

    quantity:
      pantryItem.quantity || 1,

    price:0,

    barcode:
      pantryItem.barcode || "",

    pantryId:
      pantryItem.id

  };

  shoppingItems.push(
    newShoppingItem
  );

  await saveShoppingList(
    shoppingItems
  );

  const updatedPantryItems =
    pantryItems.map(

      (item:any)=>

        item.id === pantryId

          ? {
              ...item,
              assignedStore:store
            }

          : item

    );

  await savePantryList(
    updatedPantryItems
  );

  return newShoppingItem;

}


// =======================
// LEGACY OVERALL BUDGET
// =======================


export async function getBudget(){

  const data =
    await AsyncStorage.getItem(
      BUDGET_KEY
    );

  if(!data){

    return 100;

  }

  return Number(data);

}


export async function saveBudget(
  amount:number
){

  await AsyncStorage.setItem(

    BUDGET_KEY,

    String(amount)

  );

}
import AsyncStorage from "@react-native-async-storage/async-storage";


const STORAGE_KEY =
  "shopwithezz_shopping";


const BUDGET_KEY =
  "shopwithezz_budget";




export async function getShoppingList(){


  const data =
    await AsyncStorage.getItem(
      STORAGE_KEY
    );



  if(!data){

    return [];

  }



  return JSON.parse(data);


}








export async function saveShoppingList(items:any[]){


  await AsyncStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(items)

  );


}









export async function addShoppingItem(item:any){


  const existing =
    await getShoppingList();




  const newItem = {


    id:
      Date.now().toString(),



    name:
      item.name,



    store:
      item.store || "",



    checked:false,



    quantity:
      item.quantity || 1,



    price:
      item.price || 0


  };




  existing.push(newItem);




  await saveShoppingList(

    existing

  );



  return newItem;


}









export async function updateShoppingItem(updated:any){


  const items =
    await getShoppingList();




  const result =


    items.map(


      item =>


        item.id === updated.id


        ?


        updated


        :


        item


    );




  await saveShoppingList(

    result

  );


}









export async function deleteShoppingItem(id:string){


  const items =
    await getShoppingList();




  const filtered =


    items.filter(


      item =>


        item.id !== id


    );




  await saveShoppingList(

    filtered

  );


}









// =======================
// BUDGET
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








export async function saveBudget(amount:number){


  await AsyncStorage.setItem(

    BUDGET_KEY,

    String(amount)

  );


}
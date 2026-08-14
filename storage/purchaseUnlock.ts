import * as SecureStore from "expo-secure-store";

const PURCHASE_UNLOCK_KEY = "shopwithezz-full-unlock-v1";

export type PurchaseUnlockRecord = {
  productId:string;
  transactionId?:string;
  purchaseToken?:string;
  unlockedAt:string;
};

export async function loadPurchaseUnlock(){
  try{
    const saved = await SecureStore.getItemAsync(PURCHASE_UNLOCK_KEY);
    if(!saved){
      return null;
    }
    const record = JSON.parse(saved) as PurchaseUnlockRecord;
    return record.productId ? record : null;
  }
  catch{
    return null;
  }
}

export async function savePurchaseUnlock(record:PurchaseUnlockRecord){
  await SecureStore.setItemAsync(PURCHASE_UNLOCK_KEY,JSON.stringify(record));
}

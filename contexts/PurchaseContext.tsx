import React, {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {Alert} from "react-native";
import {loadPurchaseUnlock} from "../storage/purchaseUnlock";

export const FULL_UNLOCK_PRODUCT_ID = "shopwithezz_full_unlock";

type PurchaseContextValue = {
  isUnlocked:boolean;
  isLoading:boolean;
  isPurchasing:boolean;
  productPrice:string;
  purchaseUnlock:()=>Promise<void>;
  restorePurchase:()=>Promise<void>;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({children}:PropsWithChildren){
  const [isUnlocked,setIsUnlocked] = useState(__DEV__);
  const [isLoading,setIsLoading] = useState(true);

  useEffect(()=>{
    loadPurchaseUnlock()
      .then(record=>setIsUnlocked(
        __DEV__ || record?.productId === FULL_UNLOCK_PRODUCT_ID
      ))
      .finally(()=>setIsLoading(false));
  },[]);

  async function purchaseUnlock(){
    Alert.alert(
      "Google Play Setup",
      "The full-version purchase is being connected. Your app and shopping data are safe."
    );
  }

  async function restorePurchase(){
    Alert.alert(
      "Google Play Setup",
      "Restore Purchase will be available when the Google Play product is connected."
    );
  }

  const value = useMemo(()=>({
    isUnlocked,
    isLoading,
    isPurchasing:false,
    productPrice:"AUD $29.99",
    purchaseUnlock,
    restorePurchase
  }),[isLoading,isUnlocked]);

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase(){
  const value = useContext(PurchaseContext);
  if(!value){throw new Error("usePurchase must be used inside PurchaseProvider");}
  return value;
}

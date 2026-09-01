import React, {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {Alert} from "react-native";
import Constants from "expo-constants";
import {fetchProducts, finishTransaction, getAvailablePurchases, initConnection, purchaseErrorListener, purchaseUpdatedListener, requestPurchase} from "react-native-iap";
import {loadPurchaseUnlock, savePurchaseUnlock} from "../storage/purchaseUnlock";

export const FULL_UNLOCK_PRODUCT_ID = "shopwithezz_full_unlock";

type PurchaseContextValue = {isUnlocked:boolean;isLoading:boolean;isPurchasing:boolean;productPrice:string;purchaseUnlock:()=>Promise<void>;restorePurchase:()=>Promise<void>};
const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({children}:PropsWithChildren){
  const isFamilyEdition = Constants.expoConfig?.extra?.appEdition === "family";
  const [isUnlocked,setIsUnlocked] = useState(isFamilyEdition);
  const [isLoading,setIsLoading] = useState(true);
  const [isPurchasing,setIsPurchasing] = useState(false);
  const [productPrice,setProductPrice] = useState("A$35.00");

  async function grantUnlock(purchase:{productId:string;transactionId?:string | null;purchaseToken?:string | null}){
    if(purchase.productId !== FULL_UNLOCK_PRODUCT_ID){return;}
    await savePurchaseUnlock({productId:FULL_UNLOCK_PRODUCT_ID,transactionId:purchase.transactionId || undefined,purchaseToken:purchase.purchaseToken || undefined,unlockedAt:new Date().toISOString()});
    setIsUnlocked(true);
  }

  async function refreshPlayPurchase(){
    const purchases = await getAvailablePurchases();
    const unlock = purchases.find(purchase=>purchase.productId === FULL_UNLOCK_PRODUCT_ID);
    if(unlock){await grantUnlock(unlock);}
    return Boolean(unlock);
  }

  useEffect(()=>{
    let isActive = true;
    const updatedSubscription = purchaseUpdatedListener(purchase=>{
      void (async()=>{
        if(purchase.productId !== FULL_UNLOCK_PRODUCT_ID || purchase.purchaseState !== "purchased"){return;}
        try{
          await grantUnlock(purchase);
          await finishTransaction({purchase,isConsumable:false});
          if(isActive){Alert.alert("ShopWithEzz Unlocked", "Your permanent Google Play unlock is active.");}
        }catch{
          if(isActive){Alert.alert("Purchase Needs Attention", "Google Play received your purchase. Please use Restore Purchase and try again.");}
        }finally{
          if(isActive){setIsPurchasing(false);}
        }
      })();
    });
    const errorSubscription = purchaseErrorListener(()=>{if(isActive){setIsPurchasing(false);}});

    void (async()=>{
      try{
        const savedUnlock = await loadPurchaseUnlock();
        if(savedUnlock?.productId === FULL_UNLOCK_PRODUCT_ID && isActive){setIsUnlocked(true);}
        await initConnection();
        const products = await fetchProducts({skus:[FULL_UNLOCK_PRODUCT_ID],type:"in-app"}) || [];
        if(products[0]?.displayPrice && isActive){setProductPrice(products[0].displayPrice);}
        await refreshPlayPurchase();
      }catch{
        // The product is available after the Play test release is installed.
      }finally{
        if(isActive){setIsLoading(false);}
      }
    })();

    return ()=>{isActive=false;updatedSubscription.remove();errorSubscription.remove();};
  },[isFamilyEdition]);

  async function purchaseUnlock(){
    if(isFamilyEdition){Alert.alert("Family Version", "This private Family & Friends edition is permanently unlocked.");return;}
    if(isUnlocked){Alert.alert("Already Unlocked", "Your permanent Google Play unlock is already active.");return;}
    try{
      setIsPurchasing(true);
      await requestPurchase({request:{apple:{sku:FULL_UNLOCK_PRODUCT_ID},google:{skus:[FULL_UNLOCK_PRODUCT_ID]}},type:"in-app"});
    }catch{
      setIsPurchasing(false);
      Alert.alert("Purchase Unavailable", "The Google Play unlock will be available after the ShopWithEzz test release is installed from Google Play.");
    }
  }

  async function restorePurchase(){
    if(isFamilyEdition){Alert.alert("Family Version", "No purchase needs to be restored in this permanently unlocked edition.");return;}
    try{
      setIsPurchasing(true);
      await initConnection();
      const restored = await refreshPlayPurchase();
      Alert.alert(restored ? "Purchase Restored" : "No Purchase Found", restored ? "Your permanent Google Play unlock is active." : "No ShopWithEzz unlock was found for this Google Play account.");
    }catch{
      Alert.alert("Restore Unavailable", "Install ShopWithEzz from Google Play, then try Restore Purchase again.");
    }finally{
      setIsPurchasing(false);
    }
  }

  const value = useMemo(()=>({isUnlocked,isLoading,isPurchasing,productPrice,purchaseUnlock,restorePurchase}),[isLoading,isPurchasing,isUnlocked,productPrice]);
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase(){
  const value = useContext(PurchaseContext);
  if(!value){throw new Error("usePurchase must be used inside PurchaseProvider");}
  return value;
}

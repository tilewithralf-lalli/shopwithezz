import React, {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Platform
} from "react-native";

import {
    Href,
    Stack,
    usePathname,
    useRouter
} from "expo-router";

import {
    ShareIntentProvider,
    useShareIntentContext
} from "expo-share-intent";

import {PurchaseProvider, usePurchase} from "../contexts/PurchaseContext";
import {loadTrialStatus} from "../storage/trial";

const LIST_MIME = "application/vnd.shopwithezz.list+json";


function IncomingShareRouter(){

  const router = useRouter();

  const {
    hasShareIntent,
    shareIntent
  } =
    useShareIntentContext();

  const handledPath =
    useRef<string | null>(null);

  const image =
    shareIntent.files?.find(
      file=>file.mimeType.startsWith("image/")
    );

  const shoppingList =
    shareIntent.files?.find(
      file=>
        file.mimeType === LIST_MIME
        || file.fileName?.toLowerCase().endsWith(".shopwithezz")
    );

  const incomingPath =
    shoppingList?.path || image?.path;

  useEffect(()=>{

    if(
      !hasShareIntent
      ||
      !incomingPath
      ||
      handledPath.current === incomingPath
    ){
      return;
    }

    handledPath.current = incomingPath;
    router.replace(
      (shoppingList ? "/importList" : "/importPhoto") as Href
    );

  },[
    hasShareIntent,
    incomingPath,
    image,
    shoppingList,
    router
  ]);

  return null;

}

function TrialRouteGuard(){

  const router = useRouter();
  const pathname = usePathname();
  const {isLoading,isUnlocked} = usePurchase();
  const [isExpired,setIsExpired] = useState(false);

  useEffect(()=>{
    if(isLoading || isUnlocked){
      setIsExpired(false);
      return;
    }

    loadTrialStatus().then(status=>{
      setIsExpired(status.isExpired);
    });
  },[isLoading,isUnlocked,pathname]);

  useEffect(()=>{
    if(isExpired && pathname !== "/"){
      router.replace("/" as Href);
    }
  },[isExpired,pathname,router]);

  return null;

}


export default function RootLayout(){

  const isAndroid =
    Platform.OS === "android";

  return (

    <PurchaseProvider>

    <TrialRouteGuard/>

    {

    isAndroid ? (

      <ShareIntentProvider
        options={{
          resetOnBackground:false,
          scheme:"shopwithezz"
        }}
      >

        <IncomingShareRouter/>

        <Stack

          screenOptions={{

            headerShown:false

          }}

        >

        </Stack>

      </ShareIntentProvider>

    ) : (

      <Stack

        screenOptions={{

          headerShown:false

        }}

      >

      </Stack>

    )

    }

    </PurchaseProvider>

  );

}

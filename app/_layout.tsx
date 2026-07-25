import React, {
  useEffect,
  useRef
} from "react";

import {
  Href,
  Stack,
  useRouter
} from "expo-router";

import {
  ShareIntentProvider,
  useShareIntentContext
} from "expo-share-intent";


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

  const listFile =
    shareIntent.files?.find(
      file=>
        file.mimeType
        ===
        "application/vnd.shopwithezz.list+json"
        ||
        file.fileName
          ?.toLowerCase()
          .endsWith(".shopwithezz")
    );

  const incomingPath =
    listFile?.path
    ??
    image?.path;

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
      listFile
        ? "/importList" as Href
        : "/importPhoto" as Href
    );

  },[
    hasShareIntent,
    incomingPath,
    image,
    listFile,
    router
  ]);

  return null;

}


export default function RootLayout(){

  return (

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

  );

}

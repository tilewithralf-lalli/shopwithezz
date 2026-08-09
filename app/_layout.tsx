import React, {
    useEffect,
    useRef
} from "react";

import {
    Platform
} from "react-native";

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

  const incomingPath =
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
      "/importPhoto" as Href
    );

  },[
    hasShareIntent,
    incomingPath,
    image,
    router
  ]);

  return null;

}


export default function RootLayout(){

  const isAndroid =
    Platform.OS === "android";

  return (

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

  );

}

import React, {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import {
  useRouter
} from "expo-router";

import {
  Ionicons
} from "@expo/vector-icons";

import {
  useSafeAreaInsets
} from "react-native-safe-area-context";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import * as Speech
  from "expo-speech";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";

import {
  HANDS_FREE_COMMANDS
} from "../constants/handsFreeCommands";

import {
  categoryForName,
  ShoppingCategory
} from "../constants/shoppingCategories";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";

const INACTIVITY_SECONDS =
  15;


type ShoppingItem = {
  id:string;
  name:string;
  price:number;
  purchased:boolean;
  category?:ShoppingCategory;
};

type ShoppingSession = {
  budget:number;
  spent?:number;
  items:ShoppingItem[];
};


function capitaliseItemName(
  value:string
){

  const clean =
    value.trim();

  if(!clean){
    return "";
  }

  return clean.replace(
    /^./,
    letter=>letter.toUpperCase()
  );

}


export default function HandsFreeScreen(){

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listening,setListening] =
    useState(false);

  const listeningRef =
    useRef(false);

  const [language,setLanguage] =
    useState<"en-AU" | "de-DE">(
      "en-AU"
    );

  const languageRef =
    useRef<"en-AU" | "de-DE">(
      "en-AU"
    );

  const [heard,setHeard] =
    useState(
      "Tap Start when you are ready."
    );

  const [lastAction,setLastAction] =
    useState("No command yet");

  const [shoppingMode,setShoppingMode] =
    useState(false);

  const shoppingModeRef =
    useRef(false);

  const handsFreeActiveRef =
    useRef(false);

  const manuallyStoppedRef =
    useRef(false);

  const speakingRef =
    useRef(false);

  const processingRef =
    useRef(false);

  const restartingRef =
    useRef(false);

  const [secondsLeft,setSecondsLeft] =
    useState(INACTIVITY_SECONDS);

  const secondsLeftRef =
    useRef(INACTIVITY_SECONDS);

  const lastFinalSpeechRef =
    useRef({
      text:"",
      time:0
    });

  const inactivityTimerRef =
    useRef<
      ReturnType<typeof setTimeout>
      |
      null
    >(null);

  const countdownTimerRef =
    useRef<
      ReturnType<typeof setInterval>
      |
      null
    >(null);

  const restartTimerRef =
    useRef<
      ReturnType<typeof setTimeout>
      |
      null
    >(null);


  useEffect(()=>{

    languageRef.current =
      language;

  },[language]);


  useEffect(()=>{

    return ()=>{

      manuallyStoppedRef.current =
        true;

      handsFreeActiveRef.current =
        false;

      shoppingModeRef.current =
        false;

      clearInactivityTimers();
      clearRestartTimer();

      Speech.stop();
      ExpoSpeechRecognitionModule.abort();

    };

  },[]);


  useSpeechRecognitionEvent(
    "start",
    ()=>{

      listeningRef.current =
        true;

      restartingRef.current =
        false;

      setListening(true);

    }
  );


  useSpeechRecognitionEvent(
    "end",
    ()=>{

      listeningRef.current =
        false;

      setListening(false);

      if(
        handsFreeActiveRef.current
        &&
        !manuallyStoppedRef.current
        &&
        !speakingRef.current
      ){

        scheduleRecognitionRestart();

      }

    }
  );


  useSpeechRecognitionEvent(
    "result",
    event=>{

      if(speakingRef.current){
        return;
      }

      const words =
        event.results[0]
          ?.transcript
          ?.trim();

      if(!words){
        return;
      }

      setHeard(words);

      if(shoppingModeRef.current){

        refreshInactivityTimer();

      }

      if(event.isFinal){

        processFinalSpeech(words);

      }

    }
  );


  useSpeechRecognitionEvent(
    "error",
    event=>{

      listeningRef.current =
        false;

      setListening(false);

      const ignoredErrors = [
        "aborted",
        "client",
        "no-speech"
      ];

      if(
        !ignoredErrors.includes(
          event.error
        )
        &&
        !speakingRef.current
      ){

        setLastAction(
          event.message
          ||
          "I could not hear that."
        );

      }

      if(
        handsFreeActiveRef.current
        &&
        !manuallyStoppedRef.current
        &&
        !speakingRef.current
      ){

        scheduleRecognitionRestart();

      }

    }
  );


  function clearRestartTimer(){

    if(restartTimerRef.current){

      clearTimeout(
        restartTimerRef.current
      );

      restartTimerRef.current =
        null;

    }

    restartingRef.current =
      false;

  }


  function clearInactivityTimers(){

    if(inactivityTimerRef.current){

      clearTimeout(
        inactivityTimerRef.current
      );

      inactivityTimerRef.current =
        null;

    }

    if(countdownTimerRef.current){

      clearInterval(
        countdownTimerRef.current
      );

      countdownTimerRef.current =
        null;

    }

  }


  function refreshInactivityTimer(){

    if(!shoppingModeRef.current){
      return;
    }

    clearInactivityTimers();

    secondsLeftRef.current =
      INACTIVITY_SECONDS;

    setSecondsLeft(
      INACTIVITY_SECONDS
    );

    countdownTimerRef.current =
      setInterval(
        ()=>{

          const nextValue =
            Math.max(
              0,
              secondsLeftRef.current - 1
            );

          secondsLeftRef.current =
            nextValue;

          setSecondsLeft(nextValue);

        },
        1000
      );

    inactivityTimerRef.current =
      setTimeout(
        ()=>{

          finishHandsFree(
            "Shopping Mode finished after 15 seconds without another item.",
            true
          );

        },
        INACTIVITY_SECONDS * 1000
      );

  }


  async function speak(
    message:string,
    resumeListening = true
  ){

    setLastAction(message);

    speakingRef.current =
      true;

    clearRestartTimer();

    try{

      const currentState =
        await ExpoSpeechRecognitionModule
          .getStateAsync();

      if(
        currentState === "starting"
        ||
        currentState === "recognizing"
      ){

        ExpoSpeechRecognitionModule.stop();

      }

    }
    catch{
      // The recogniser may already be inactive.
    }

    Speech.stop();

    Speech.speak(
      message,
      {
        language:
          languageRef.current,
        rate:0.92,

        onDone:()=>{

          speakingRef.current =
            false;

          if(
            resumeListening
            &&
            handsFreeActiveRef.current
            &&
            !manuallyStoppedRef.current
          ){

            scheduleRecognitionRestart();

          }

        },

        onStopped:()=>{

          speakingRef.current =
            false;

          if(
            resumeListening
            &&
            handsFreeActiveRef.current
            &&
            !manuallyStoppedRef.current
          ){

            scheduleRecognitionRestart();

          }

        },

        onError:()=>{

          speakingRef.current =
            false;

          if(
            resumeListening
            &&
            handsFreeActiveRef.current
            &&
            !manuallyStoppedRef.current
          ){

            scheduleRecognitionRestart();

          }

        }
      }
    );

  }


  function scheduleRecognitionRestart(){

    if(
      restartingRef.current
      ||
      manuallyStoppedRef.current
      ||
      speakingRef.current
      ||
      !handsFreeActiveRef.current
    ){

      return;

    }

    restartingRef.current =
      true;

    clearRestartTimer();

    restartingRef.current =
      true;

    restartTimerRef.current =
      setTimeout(
        async ()=>{

          restartTimerRef.current =
            null;

          if(
            manuallyStoppedRef.current
            ||
            speakingRef.current
            ||
            !handsFreeActiveRef.current
          ){

            restartingRef.current =
              false;

            return;

          }

          await beginRecognition();

        },
        500
      );

  }


  async function beginRecognition(){

    try{

      const currentState =
        await ExpoSpeechRecognitionModule
          .getStateAsync();

      if(
        currentState === "starting"
        ||
        currentState === "recognizing"
      ){

        restartingRef.current =
          false;

        return;

      }

      ExpoSpeechRecognitionModule.start({
        lang:languageRef.current,
        interimResults:true,
        continuous:true,
        maxAlternatives:1
      });

    }
    catch{

      restartingRef.current =
        false;

      if(
        handsFreeActiveRef.current
        &&
        !manuallyStoppedRef.current
        &&
        !speakingRef.current
      ){

        scheduleRecognitionRestart();

      }

    }

  }


  async function loadSession(){

    const saved =
      await AsyncStorage.getItem(
        SESSION_KEY
      );

    if(!saved){

      return {
        budget:0,
        spent:0,
        items:[]
      } as ShoppingSession;

    }

    const parsed =
      JSON.parse(saved);

    return {
      ...parsed,
      spent:0,
      items:Array.isArray(parsed.items)
        ? parsed.items
        : []
    } as ShoppingSession;

  }


  async function saveSession(
    session:ShoppingSession
  ){

    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...session,
        spent:0
      })
    );

  }


  function findItem(
    items:ShoppingItem[],
    spokenName:string
  ){

    const wanted =
      spokenName
        .toLowerCase()
        .trim();

    return items.find(item=>{

      const savedName =
        item.name
          .toLowerCase()
          .trim();

      return (
        savedName === wanted
        ||
        savedName.includes(wanted)
        ||
        wanted.includes(savedName)
      );

    });

  }


  function cleanSpeech(
    spoken:string
  ){

    return spoken
      .toLowerCase()
      .replace(/[’‘`]/g,"'")
      .replace(/[?.!,]/g," ")
      .replace(/\s+/g," ")
      .trim();

  }


  function isReadFullListCommand(
    clean:string
  ){

    return (
      clean.includes("read my complete list")
      ||
      clean.includes("read my full list")
      ||
      clean.includes("read my whole list")
      ||
      clean.includes("read the full list")
      ||
      clean.includes("read all my items")
      ||
      clean.includes("tell me my full list")
      ||
      clean.includes("lese meine komplette liste")
      ||
      clean.includes("lese meine ganze liste")
    );

  }


  function isReadRemainingListCommand(
    clean:string
  ){

    return (
      clean.includes("what is left")
      ||
      clean.includes("what's left")
      ||
      clean.includes("whats left")
      ||
      clean.includes("what is still left")
      ||
      clean.includes("what's still left")
      ||
      clean.includes("whats still left")
      ||
      clean.includes("what is on my list")
      ||
      clean.includes("what's on my list")
      ||
      clean.includes("whats on my list")
      ||
      clean.includes("read my list")
      ||
      clean.includes("read out my list")
      ||
      clean.includes("read the list")
      ||
      clean.includes("tell me my list")
      ||
      clean.includes("say my list")
      ||
      clean.includes("how many items are left")
      ||
      clean.includes("how many items left")
      ||
      clean.includes("was fehlt")
      ||
      clean.includes("was ist noch übrig")
      ||
      clean.includes("lese meine liste")
      ||
      clean.includes("liste vorlesen")
    );

  }


  function isReadCollectedListCommand(
    clean:string
  ){

    return (
      clean.includes("read my collected")
      ||
      clean.includes("read the collected list")
      ||
      clean.includes("read my collected items")
      ||
      clean.includes("what have i collected")
      ||
      clean.includes("what is collected")
      ||
      clean.includes("lese meine gesammelte liste")
      ||
      clean.includes("was habe ich gesammelt")
    );

  }


  function removeShoppingTrigger(
    spoken:string
  ){

    return spoken
      .replace(
        /^(please\s+)?(i\s+need|i\s+still\s+need|we\s+need|ich\s+brauche|wir\s+brauchen)\s*/i,
        ""
      )
      .trim();

  }


  function hasShoppingTrigger(
    spoken:string
  ){

    const clean =
      cleanSpeech(spoken);

    return (
      /^(please\s+)?(i\s+need|i\s+still\s+need|we\s+need)\b/i
        .test(clean)
      ||
      /^(ich\s+brauche|wir\s+brauchen)\b/i
        .test(clean)
    );

  }


  function splitSpokenItems(
    spoken:string
  ){

    const clean =
      removeShoppingTrigger(spoken)
        .replace(/[.!?]/g,"")
        .replace(
          /\b(and then|then|also|plus|as well as)\b/gi,
          ","
        )
        .replace(
          /\b(and|und|sowie)\b/gi,
          ","
        )
        .replace(
          /\s*,\s*/g,
          ","
        )
        .trim();

    const ignoredPhrases = [
      "please",
      "thank you",
      "thanks",
      "that is all",
      "that's all",
      "done",
      "finished",
      "nothing else",
      "bitte",
      "danke",
      "das ist alles",
      "fertig"
    ];

    return clean
      .split(",")
      .map(item=>
        item
          .replace(
            /^(some|a|an|the)\s+/i,
            ""
          )
          .replace(
            /^(ein|eine|einen|etwas)\s+/i,
            ""
          )
          .trim()
      )
      .filter(item=>
        item.length > 0
        &&
        item.length <= 80
        &&
        !ignoredPhrases.includes(
          item.toLowerCase()
        )
      );

  }


  function makeSpokenList(
    items:ShoppingItem[]
  ){

    if(items.length === 1){

      return items[0].name;

    }

    if(items.length === 2){

      return (
        `${items[0].name} and ${items[1].name}`
      );

    }

    const names =
      items.map(item=>item.name);

    const finalItem =
      names.pop();

    return (
      `${names.join(", ")}, and ${finalItem}`
    );

  }


  async function readRemainingList(){

    const session =
      await loadSession();

    const remainingItems =
      session.items.filter(
        item=>!item.purchased
      );

    if(!remainingItems.length){

      await speak(
        session.items.length
          ? "Your shopping list is complete. There are no items left."
          : "Your shopping list is empty."
      );

      return;

    }

    const spokenItems =
      makeSpokenList(
        remainingItems
      );

    await speak(
      `You have ${remainingItems.length} item${remainingItems.length === 1 ? "" : "s"} left. ${spokenItems}.`
    );

  }


  async function readFullList(){

    const session =
      await loadSession();

    if(!session.items.length){

      await speak(
        "Your shopping list is empty."
      );

      return;

    }

    const collected =
      session.items.filter(
        item=>item.purchased
      ).length;

    const spokenItems =
      makeSpokenList(
        session.items
      );

    await speak(
      `Your full shopping list has ${session.items.length} item${session.items.length === 1 ? "" : "s"}. ${spokenItems}. ${collected} item${collected === 1 ? " is" : "s are"} already collected.`
    );

  }


  async function readCollectedList(){

    const session =
      await loadSession();

    const collectedItems =
      session.items.filter(
        item=>item.purchased
      );

    if(!collectedItems.length){

      await speak(
        session.items.length
          ? "You have not collected any items yet."
          : "Your shopping list is empty."
      );

      return;

    }

    const spokenItems =
      makeSpokenList(
        collectedItems
      );

    await speak(
      `You have collected ${collectedItems.length} item${collectedItems.length === 1 ? "" : "s"}. ${spokenItems}.`
    );

  }


  async function confirmDeleteCollected(){

    const session = await loadSession();
    const collectedCount = session.items.filter(
      item=>item.purchased
    ).length;

    if(!collectedCount){
      await speak("There are no collected items to delete.");
      return;
    }

    Alert.alert(
      "Delete Collected Items?",
      `Permanently delete ${collectedCount} collected item${collectedCount === 1 ? "" : "s"}?`,
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Delete Collected",
          style:"destructive",
          onPress:async()=>{
            await saveSession({
              ...session,
              items:session.items.filter(item=>!item.purchased)
            });
            await speak("Your collected items were deleted.");
          }
        }
      ]
    );

  }


  async function confirmDeleteWholeList(){

    const session = await loadSession();

    if(!session.items.length){
      await speak("Your shopping list is already empty.");
      return;
    }

    Alert.alert(
      "Delete Your Whole List?",
      `Permanently delete all ${session.items.length} item${session.items.length === 1 ? "" : "s"}? Your budget will stay unchanged.`,
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Delete Whole List",
          style:"destructive",
          onPress:async()=>{
            await saveSession({
              ...session,
              items:[]
            });
            await speak("Your whole shopping list was deleted.");
          }
        }
      ]
    );

  }


  async function addItems(
    names:string[]
  ){

    if(!names.length){

      setLastAction(
        "Please say the item name."
      );

      return false;

    }

    const session =
      await loadSession();

    let nextItems =
      [...session.items];

    const addedMessages:string[] = [];

    for(const spokenName of names){

      const cleanName =
        capitaliseItemName(
          spokenName
        );

      if(!cleanName){
        continue;
      }

      const existingItem =
        findItem(
          nextItems,
          cleanName
        );

      if(existingItem){

        nextItems =
          nextItems.map(item=>
            item.id === existingItem.id
              ? {
                  ...item,
                  purchased:false
                }
              : item
          );

        addedMessages.push(
          `${existingItem.name} is already on the list`
        );

      }
      else{

        nextItems.push({
          id:
            `voice-${Date.now()}-${Math.random()}`,
          name:cleanName,
          price:0,
          purchased:false,
          category:
            categoryForName(cleanName)
        });

        addedMessages.push(
          `${cleanName} added`
        );

      }

    }

    if(!addedMessages.length){

      setLastAction(
        "I could not find an item to add."
      );

      return false;

    }

    await saveSession({
      ...session,
      spent:0,
      items:nextItems
    });

    setLastAction(
      addedMessages.join(" · ")
    );

    refreshInactivityTimer();

    return true;

  }


  async function processFinalSpeech(
    spoken:string
  ){

    const now =
      Date.now();

    const normalised =
      cleanSpeech(spoken);

    if(
      lastFinalSpeechRef.current.text
      ===
      normalised
      &&
      now
      -
      lastFinalSpeechRef.current.time
      <
      1800
    ){

      return;

    }

    lastFinalSpeechRef.current = {
      text:normalised,
      time:now
    };

    if(processingRef.current){
      return;
    }

    processingRef.current =
      true;

    try{

      await handleCommand(spoken);

    }
    finally{

      processingRef.current =
        false;

    }

  }


  async function handleCommand(
    spoken:string
  ){

    const clean =
      cleanSpeech(spoken);

    /*
      List-reading commands must be checked before
      waiting for the “I need” shopping trigger.
    */

    if(clean.includes("delete my collected")){

      await confirmDeleteCollected();
      return;

    }

    if(
      clean === "delete my list"
      || clean.includes("delete my whole list")
      || clean === "delete my whole"
    ){

      await confirmDeleteWholeList();
      return;

    }

    if(isReadFullListCommand(clean)){

      await readFullList();
      return;

    }

    if(isReadCollectedListCommand(clean)){

      await readCollectedList();
      return;

    }

    if(isReadRemainingListCommand(clean)){

      await readRemainingList();
      return;

    }

    if(
      clean === "stop mic"
      ||
      clean.includes("stop listening")
      ||
      clean.includes("finish shopping")
      ||
      clean === "finished"
      ||
      clean === "done"
      ||
      clean.includes("stopp zuhören")
      ||
      clean.includes("einkauf beenden")
      ||
      clean === "fertig"
    ){

      finishHandsFree(
        "Hands-Free Shopping stopped.",
        true
      );

      return;

    }

    const session =
      await loadSession();

    const commandPatterns = [
      {
        words:[
          "uncollect ",
          "not collected ",
          "nicht gesammelt "
        ],
        action:"uncollect"
      },
      {
        words:[
          "collect ",
          "collected ",
          "sammle "
        ],
        action:"collect"
      },
      {
        words:[
          "add ",
          "füge "
        ],
        action:"add"
      }
    ];

    const commandMatch =
      commandPatterns.find(pattern=>
        pattern.words.some(
          word=>
            clean.startsWith(word)
        )
      );

    if(commandMatch){

      const prefix =
        commandMatch.words.find(
          word=>
            clean.startsWith(word)
        );

      const itemName =
        prefix
          ? clean
              .slice(prefix.length)
              .trim()
          : "";

      if(!itemName){

        await speak(
          "Please say the item name."
        );

        return;

      }

      if(commandMatch.action === "add"){

        if(!shoppingModeRef.current){

          activateShoppingMode();

        }

        await addItems(
          splitSpokenItems(itemName)
        );

        return;

      }

      const item =
        findItem(
          session.items,
          itemName
        );

      if(!item){

        await speak(
          `I could not find ${itemName}.`
        );

        return;

      }

      const updatedItems =
        session.items.map(current=>{

          if(current.id !== item.id){
            return current;
          }

          if(
            commandMatch.action
            ===
            "collect"
          ){

            return {
              ...current,
              purchased:true
            };

          }

          if(
            commandMatch.action
            ===
            "uncollect"
          ){

            return {
              ...current,
              purchased:false
            };

          }

          return current;

        });

      await saveSession({
        ...session,
        spent:0,
        items:updatedItems
      });

      setLastAction(
        `${item.name} updated.`
      );

      if(shoppingModeRef.current){

        refreshInactivityTimer();

      }

      return;

    }

    if(hasShoppingTrigger(spoken)){

      activateShoppingMode();

      const itemNames =
        splitSpokenItems(spoken);

      if(itemNames.length){

        await addItems(itemNames);

      }
      else{

        setLastAction(
          "Shopping Mode started. Keep saying your items."
        );

      }

      return;

    }

    if(shoppingModeRef.current){

      const itemNames =
        splitSpokenItems(spoken);

      if(itemNames.length){

        await addItems(itemNames);

      }

      return;

    }

    setLastAction(
      "Waiting for “I need”, or say “Read my list”."
    );

  }


  function activateShoppingMode(){

    shoppingModeRef.current =
      true;

    setShoppingMode(true);

    manuallyStoppedRef.current =
      false;

    setLastAction(
      "Shopping Mode started. Keep saying your items."
    );

    refreshInactivityTimer();

  }


  function finishHandsFree(
    message:string,
    readMessage:boolean
  ){

    manuallyStoppedRef.current =
      true;

    handsFreeActiveRef.current =
      false;

    shoppingModeRef.current =
      false;

    setShoppingMode(false);

    clearInactivityTimers();
    clearRestartTimer();

    secondsLeftRef.current =
      INACTIVITY_SECONDS;

    setSecondsLeft(
      INACTIVITY_SECONDS
    );

    try{

      ExpoSpeechRecognitionModule.stop();

    }
    catch{

      ExpoSpeechRecognitionModule.abort();

    }

    listeningRef.current =
      false;

    setListening(false);
    setLastAction(message);

    if(readMessage){

      speakingRef.current =
        true;

      Speech.stop();

      Speech.speak(
        message,
        {
          language:
            languageRef.current,
          rate:0.92,
          onDone:()=>{

            speakingRef.current =
              false;

          },
          onStopped:()=>{

            speakingRef.current =
              false;

          },
          onError:()=>{

            speakingRef.current =
              false;

          }
        }
      );

    }

  }


  async function startListening(){

    const permission =
      await ExpoSpeechRecognitionModule
        .requestPermissionsAsync();

    if(!permission.granted){

      Alert.alert(
        "Microphone Permission",
        "Hands-Free mode needs microphone and speech-recognition permission."
      );

      return;

    }

    Speech.stop();

    speakingRef.current =
      false;

    manuallyStoppedRef.current =
      false;

    handsFreeActiveRef.current =
      true;

    shoppingModeRef.current =
      false;

    setShoppingMode(false);

    clearInactivityTimers();
    clearRestartTimer();

    secondsLeftRef.current =
      INACTIVITY_SECONDS;

    setSecondsLeft(
      INACTIVITY_SECONDS
    );

    setHeard(
      "Listening for a command…"
    );

    setLastAction(
      "Say “I need milk”, or say “Read my list”."
    );

    await beginRecognition();

  }


  function stopListening(){

    finishHandsFree(
      "Hands-Free Shopping stopped.",
      true
    );

  }


  return(

    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop:
            insets.top + 14,
          paddingBottom:
            insets.bottom + 24
        }
      ]}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={()=>
            router.back()
          }
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >

          <Ionicons
            name="chevron-back"
            size={23}
            color="#536650"
          />

        </TouchableOpacity>

        <View style={styles.headerText}>

          <Text style={styles.eyebrow}>
            SHOP WITHOUT TAPPING
          </Text>

          <Text style={styles.title}>
            Hands-Free Shopping
          </Text>

        </View>

      </View>


      <View style={styles.languageRow}>

        {
          (
            [
              "en-AU",
              "de-DE"
            ] as const
          ).map(value=>(

            <TouchableOpacity
              key={value}
              style={[
                styles.languageButton,
                language === value
                &&
                styles.languageButtonActive
              ]}
              onPress={()=>
                setLanguage(value)
              }
              disabled={listening}
            >

              <Text
                style={[
                  styles.languageText,
                  language === value
                  &&
                  styles.languageTextActive
                ]}
              >
                {
                  value === "en-AU"
                    ? "English"
                    : "Deutsch"
                }
              </Text>

            </TouchableOpacity>

          ))
        }

      </View>


      <View
        style={[
          styles.voiceCard,
          shoppingMode
          &&
          styles.voiceCardActive
        ]}
      >

        <View
          style={[
            styles.micCircle,
            listening
            &&
            styles.micCircleActive,
            shoppingMode
            &&
            styles.micCircleShopping
          ]}
        >

          <Ionicons
            name={
              listening
                ? "mic"
                : "mic-outline"
            }
            size={42}
            color="#FFFFFF"
          />

        </View>

        <Text style={styles.status}>

          {
            shoppingMode
              ? "Shopping Mode Active"
              : listening
                ? "Listening for a command…"
                : "Ready when you are"
          }

        </Text>

        {
          shoppingMode
          &&
          (
            <View style={styles.timerPill}>

              <Ionicons
                name="time-outline"
                size={16}
                color="#536650"
              />

              <Text style={styles.timerText}>
                {secondsLeft} seconds until pause
              </Text>

            </View>
          )
        }

        <Text style={styles.heard}>
          “{heard}”
        </Text>

        <TouchableOpacity
          style={[
            styles.listenButton,
            listening
            &&
            styles.stopButton
          ]}
          onPress={
            listening
              ? stopListening
              : startListening
          }
          activeOpacity={0.84}
        >

          <Text style={styles.listenButtonText}>

            {
              listening
                ? "Stop Listening"
                : "Start Hands-Free"
            }

          </Text>

        </TouchableOpacity>

      </View>


      <View style={styles.instructionsCard}>

        <View style={styles.instructionIcon}>

          <Ionicons
            name="volume-high-outline"
            size={22}
            color="#657B60"
          />

        </View>

        <View style={styles.instructionDetails}>

          <Text style={styles.instructionTitle}>
            Ask ShopWithEzz to read your list
          </Text>

          <Text style={styles.instructionText}>
            Say “Read my list”, “Read my complete list” or “Stop Mic”.
          </Text>

        </View>

      </View>


      <View style={styles.actionCard}>

        <Text style={styles.actionLabel}>
          LAST ACTION
        </Text>

        <Text style={styles.actionText}>
          {lastAction}
        </Text>

      </View>


      <Text style={styles.commandsTitle}>
        Examples
      </Text>

      <View style={styles.commandsCard}>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            Read my collected
          </Text>

          <Text style={styles.commandDescription}>
            Reads every item you have already collected.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “What’s left?”
          </Text>

          <Text style={styles.commandDescription}>
            Reads every item that has not been collected.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “Read my complete list”
          </Text>

          <Text style={styles.commandDescription}>
            Reads every item, including collected items.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “Lese meine Liste”
          </Text>

          <Text style={styles.commandDescription}>
            Liest die noch offenen Artikel vor.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “Lese meine komplette Liste”
          </Text>

          <Text style={styles.commandDescription}>
            Liest die komplette Einkaufsliste vor.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “Stop Mic”
          </Text>

          <Text style={styles.commandDescription}>
            Stops the active microphone in English or German mode.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “I need milk”
          </Text>

          <Text style={styles.commandDescription}>
            Starts Shopping Mode and adds milk.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “Bread”
          </Text>

          <Text style={styles.commandDescription}>
            Adds bread without repeating “I need”.
          </Text>

        </View>

        <View style={styles.commandRow}>

          <Text style={styles.command}>
            “Eggs, butter and coffee”
          </Text>

          <Text style={styles.commandDescription}>
            Adds several separate items at once.
          </Text>

        </View>

        {
          HANDS_FREE_COMMANDS.map(item=>(

            <View
              key={item.command}
              style={styles.commandRow}
            >

              <Text style={styles.command}>
                “{item.command}”
              </Text>

              <Text
                style={
                  styles.commandDescription
                }
              >
                {item.description}
              </Text>

            </View>

          ))
        }

      </View>

    </ScrollView>

  );

}


const styles = StyleSheet.create({

  screen:{
    flex:1,
    backgroundColor:"#FBF8F5"
  },

  content:{
    paddingHorizontal:18
  },

  header:{
    flexDirection:"row",
    alignItems:"center"
  },

  backButton:{
    width:44,
    height:44,
    borderRadius:15,
    backgroundColor:"#E6EEE2",
    alignItems:"center",
    justifyContent:"center"
  },

  headerText:{
    flex:1,
    marginLeft:12
  },

  eyebrow:{
    fontSize:9,
    fontWeight:"900",
    letterSpacing:1.1,
    color:"#A28E83"
  },

  title:{
    marginTop:3,
    fontSize:22,
    fontWeight:"900",
    color:"#3E4B3C"
  },

  languageRow:{
    marginTop:18,
    flexDirection:"row",
    justifyContent:"center"
  },

  languageButton:{
    marginHorizontal:4,
    paddingVertical:9,
    paddingHorizontal:18,
    borderRadius:13,
    backgroundColor:"#E6EEE2"
  },

  languageButtonActive:{
    backgroundColor:"#7B8F75"
  },

  languageText:{
    fontSize:12,
    fontWeight:"900",
    color:"#607D6B"
  },

  languageTextActive:{
    color:"#FFFFFF"
  },

  voiceCard:{
    marginTop:13,
    padding:20,
    borderRadius:24,
    backgroundColor:"#F3E7E2",
    borderWidth:1,
    borderColor:"#EAD9D1",
    alignItems:"center"
  },

  voiceCardActive:{
    backgroundColor:"#E9F2E6",
    borderColor:"#CFE0CB"
  },

  micCircle:{
    width:88,
    height:88,
    borderRadius:44,
    backgroundColor:"#7B8F75",
    alignItems:"center",
    justifyContent:"center"
  },

  micCircleActive:{
    backgroundColor:"#C86761"
  },

  micCircleShopping:{
    backgroundColor:"#6E8B68"
  },

  status:{
    marginTop:13,
    fontSize:17,
    fontWeight:"900",
    color:"#463E3B"
  },

  timerPill:{
    marginTop:9,
    paddingVertical:7,
    paddingHorizontal:11,
    borderRadius:12,
    backgroundColor:"rgba(255,255,255,0.72)",
    flexDirection:"row",
    alignItems:"center"
  },

  timerText:{
    marginLeft:5,
    fontSize:10,
    fontWeight:"900",
    color:"#536650"
  },

  heard:{
    minHeight:42,
    marginTop:9,
    textAlign:"center",
    fontSize:13,
    lineHeight:19,
    fontWeight:"700",
    color:"#806E67"
  },

  listenButton:{
    marginTop:12,
    paddingVertical:13,
    paddingHorizontal:28,
    borderRadius:16,
    backgroundColor:"#7B8F75"
  },

  stopButton:{
    backgroundColor:"#C86761"
  },

  listenButtonText:{
    fontSize:13,
    fontWeight:"900",
    color:"#FFFFFF"
  },

  instructionsCard:{
    marginTop:12,
    padding:14,
    borderRadius:18,
    backgroundColor:"#E6EEE2",
    borderWidth:1,
    borderColor:"#D4E0D0",
    flexDirection:"row"
  },

  instructionIcon:{
    width:43,
    height:43,
    borderRadius:14,
    backgroundColor:"#FFFFFF",
    alignItems:"center",
    justifyContent:"center"
  },

  instructionDetails:{
    flex:1,
    marginLeft:11
  },

  instructionTitle:{
    fontSize:13,
    fontWeight:"900",
    color:"#465344"
  },

  instructionText:{
    marginTop:4,
    fontSize:10,
    lineHeight:16,
    fontWeight:"700",
    color:"#71806E"
  },

  actionCard:{
    marginTop:12,
    padding:14,
    borderRadius:17,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#EEE7E0"
  },

  actionLabel:{
    fontSize:9,
    fontWeight:"900",
    letterSpacing:1,
    color:"#A28E83"
  },

  actionText:{
    marginTop:5,
    fontSize:13,
    lineHeight:19,
    fontWeight:"800",
    color:"#536650"
  },

  commandsTitle:{
    marginTop:18,
    fontSize:17,
    fontWeight:"900",
    color:"#463E3B"
  },

  commandsCard:{
    marginTop:8,
    paddingHorizontal:14,
    borderRadius:20,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#EEE7E0"
  },

  commandRow:{
    paddingVertical:11,
    borderBottomWidth:1,
    borderBottomColor:"#F0E9E4"
  },

  command:{
    fontSize:13,
    fontWeight:"900",
    color:"#536650"
  },

  commandDescription:{
    marginTop:2,
    fontSize:10,
    fontWeight:"700",
    color:"#947F75"
  }

});

import React, {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    Alert,
    Keyboard,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import {
    Href,
    useFocusEffect,
    useLocalSearchParams,
    useRouter
} from "expo-router";

import {
    useSafeAreaInsets
} from "react-native-safe-area-context";

import {
    Ionicons
} from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import * as Speech from "expo-speech";

import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent
} from "expo-speech-recognition";

import {
    categoryForName,
    normaliseCategory,
    ShoppingCategory
} from "../constants/shoppingCategories";
import {
  ensureLists,
  deleteList,
  getActiveList,
  saveActiveSession,
  selectList,
  type ShoppingList as SavedShoppingList
} from "../storage/shoppingLists";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";




type ShoppingItem = {
  id:string;
  name:string;
  price:number;
  quantity?:number;
  purchased:boolean;
  barcode?:string;
  category?:ShoppingCategory;
};

type ShoppingSession = {
  budget:number;
  spent?:number;
  items:ShoppingItem[];
};

type UndoRemoval = {
  items:ShoppingItem[];
  message:string;
};


function getCategory(
  item:ShoppingItem
):ShoppingCategory{

  return normaliseCategory(
    item.category,
    item.name
  );

}


export default function ShoppingListScreen(){

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params =
    useLocalSearchParams<{view?:string;tools?:string;action?:string}>();

  const requestedView =
    Array.isArray(params.view)
      ? params.view[0]
      : params.view;

  const requestedTools =
    Array.isArray(params.tools)
      ? params.tools[0]
      : params.tools;

  const requestedAction =
    Array.isArray(params.action)
      ? params.action[0]
      : params.action;

  const listView:
    "all" | "toBuy" | "collected" | null =
      requestedView === "all"
      ||
      requestedView === "toBuy"
      ||
      requestedView === "collected"
        ? requestedView
        : null;

  const isOverview =
    listView === null;

  const listFilter:
    "all" | "toBuy" | "collected" =
      listView || "all";

  const [session,setSession] =
    useState<ShoppingSession>({
      budget:0,
      spent:0,
      items:[]
    });

  const [availableLists,setAvailableLists] =
    useState<SavedShoppingList[]>([]);

  const [activeListId,setActiveListId] =
    useState("");

  const [listBudgetInput,setListBudgetInput] =
    useState("");

  const primaryList =
    availableLists.find(list=>list.name === "My Shopping List")
    || availableLists[0];

  const newestImportedList =
    availableLists
      .filter(list=>list.id !== primaryList?.id)
      .sort((first,second)=>
        second.createdAt.localeCompare(first.createdAt)
      )[0];

  const visibleListTabs =
    [
      primaryList,
      ...availableLists
        .filter(list=>list.id !== primaryList?.id)
        .sort((first,second)=>
          second.createdAt.localeCompare(first.createdAt)
        )
    ].filter((list):list is SavedShoppingList => Boolean(list));

  const sessionRef =
    useRef<ShoppingSession>(session);

  const sessionSaveQueue =
    useRef<Promise<void>>(Promise.resolve());


  const toolsVisible =
    requestedTools === "open";

  const [quickItem,setQuickItem] =
    useState("");

  const [quickAddMessage,setQuickAddMessage] =
    useState("");

  const [shareOptionsVisible,setShareOptionsVisible] =
    useState(false);

  const [undoRemoval,setUndoRemoval] =
    useState<UndoRemoval | null>(null);

  const [language,setLanguage] =
    useState<"en-AU" | "de-DE">("en-AU");

  const [listening,setListening] =
    useState(false);

  const voiceActionAt =
    useRef(0);

  const quickAddTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const undoTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const shareActionHandled =
    useRef(false);

  const printActionHandled =
    useRef(false);

  const pdfActionHandled =
    useRef(false);

  useEffect(()=>{

    return ()=>{

      if(quickAddTimer.current){
        clearTimeout(quickAddTimer.current);
      }

      if(undoTimer.current){
        clearTimeout(undoTimer.current);
      }

    };

  },[]);


  useFocusEffect(

    useCallback(()=>{

      shareActionHandled.current = false;
      printActionHandled.current = false;
      pdfActionHandled.current = false;

      loadSession();

      return ()=>{
        shareActionHandled.current = false;
        printActionHandled.current = false;
        pdfActionHandled.current = false;
      };

    },[requestedAction])

  );


  useSpeechRecognitionEvent(
    "start",
    ()=>setListening(true)
  );

  useSpeechRecognitionEvent(
    "end",
    ()=>{
      setListening(false);
      voiceActionAt.current =
        Date.now();
    }
  );

  useSpeechRecognitionEvent(
    "result",
    event=>{
      const words =
        event.results[0]?.transcript || "";

      const clean = words
        .toLowerCase()
        .replace(/[?.!,]/g," ")
        .replace(/\s+/g," ")
        .trim();

      if(
        event.isFinal
      ){
        processShoppingListVoiceCommand(
          clean,
          words
        );
        return;
      }

      setQuickItem(words);
    }
  );

  useSpeechRecognitionEvent(
    "error",
    event=>{

      setListening(false);
      voiceActionAt.current =
        Date.now();

      if(
        event.error !== "aborted"
        &&
        event.error !== "client"
      ){
        Alert.alert(
          "Voice Input",
          event.message || "Voice input could not start."
        );
      }

    }
  );


  async function loadSession(){

    const [saved,activeList,lists] =
      await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        getActiveList(),
        ensureLists()
      ]);

    setAvailableLists(lists);
    setActiveListId(activeList.id);

    if(saved){
      const storedSession =
        JSON.parse(saved);

      const usedIds =
        new Set<string>();

      const repairedItems =
        Array.isArray(storedSession.items)
          ? storedSession.items.map(
              (
                item:ShoppingItem,
                index:number
              )=>{

                let repairedId =
                  typeof item.id === "string"
                  &&
                  item.id.trim()
                  &&
                  !usedIds.has(item.id)
                    ? item.id
                    : `repaired-${Date.now()}-${index}-${Math.random()}`;

                while(usedIds.has(repairedId)){
                  repairedId =
                    `repaired-${Date.now()}-${index}-${Math.random()}`;
                }

                usedIds.add(repairedId);

                return {
                  ...item,
                  id:repairedId,
                  quantity:Math.max(
                    1,
                    Math.floor(Number(item.quantity || 1))
                  ),
                  purchased:Boolean(item.purchased)
                };

              }
            )
          : [];

      const savedSession = {
        ...storedSession,
        spent:0,
        items:repairedItems
      };

      sessionRef.current = savedSession;
      setSession(savedSession);
      setListBudgetInput(String(savedSession.budget || 0));

      await saveActiveSession(savedSession);

      if(
        requestedAction === "share"
        &&
        !shareActionHandled.current
      ){
        shareActionHandled.current = true;
        setTimeout(
          ()=>shareShoppingList(savedSession),
          0
        );
      }

      if(
        requestedAction === "print"
        &&
        !printActionHandled.current
      ){
        printActionHandled.current = true;
        setTimeout(
          ()=>printShoppingList(savedSession),
          0
        );
      }

      if(
        requestedAction === "pdf"
        &&
        !pdfActionHandled.current
      ){
        pdfActionHandled.current = true;
        setTimeout(
          ()=>printShoppingList(savedSession,true),
          0
        );
      }
    }else if(
      requestedAction === "share"
      &&
      !shareActionHandled.current
    ){
      shareActionHandled.current = true;
      setTimeout(
        ()=>shareShoppingList({
          budget:0,
          spent:0,
          items:[]
        }),
        0
      );
    }else if(
      requestedAction === "print"
      &&
      !printActionHandled.current
    ){
      printActionHandled.current = true;
      setTimeout(
        ()=>printShoppingList({
          budget:0,
          spent:0,
          items:[]
        }),
        0
      );
    }


  }

  async function openList(id:string){
    if(id === activeListId){
      return;
    }
    await selectList(id);
    await loadSession();
  }

  function askToDeleteList(list:SavedShoppingList){
    if(list.name === "My Shopping List"){
      return;
    }
    Alert.alert(
      "Delete List?",
      `Delete ${list.name}? This cannot be undone.`,
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Delete",
          style:"destructive",
          onPress:()=>void deleteSelectedList(list.id)
        }
      ]
    );
  }

  async function deleteSelectedList(id:string){
    try{
      await deleteList(id);
      await loadSession();
    }catch{
      Alert.alert("Could Not Delete List", "Your main shopping list is kept safe.");
    }
  }


  async function saveSession(
    next:ShoppingSession
  ){

    sessionRef.current = next;
    setSession(next);

    sessionSaveQueue.current =
      sessionSaveQueue.current.then(
        ()=>saveActiveSession(next)
      );

    await sessionSaveQueue.current;

  }

  async function saveListBudget(){
    const value = Number(listBudgetInput.replace(",","."));
    if(Number.isNaN(value) || value < 0){
      Alert.alert("Invalid Budget", "Enter a valid budget amount.");
      return;
    }
    await saveSession({
      ...sessionRef.current,
      budget:value
    });
    setListBudgetInput(String(value));
  }

  async function shareShoppingList(
    sessionOverride?:ShoppingSession
  ){

    const currentSession =
      sessionOverride || sessionRef.current;

    if(!currentSession.items.length){
      Alert.alert(
        "Nothing To Share Yet",
        "Add an item to your shopping list first."
      );
      return;
    }

    const formatItem = (
      item:ShoppingItem
    )=>{

      const quantity =
        Math.max(
          1,
          Math.floor(Number(item.quantity || 1))
        );

      const price =
        Number(item.price || 0);

      const lineTotal =
        price * quantity;

      const amount =
        price > 0
          ? ` - $${price.toFixed(2)} x ${quantity} = $${lineTotal.toFixed(2)}`
          : " - price not added";

      return `${item.purchased ? "[x]" : "[ ]"} ${item.name}${amount}`;

    };

    const items =
      [...currentSession.items]
        .sort((a,b)=>
          Number(a.purchased)
          -
          Number(b.purchased)
        );

    const listTotal =
      items.reduce(
        (sum,item)=>
          sum
          +
          (
            Number(item.price || 0)
            *
            Math.max(
              1,
              Math.floor(Number(item.quantity || 1))
            )
          ),
        0
      );

    try{
      await Share.share({
        title:"ShopWithEzz Shopping List",
        message:[
          "ShopWithEzz Shopping List",
          "",
          ...items.map(formatItem),
          "",
          `Total: $${listTotal.toFixed(2)}`
        ].join("\n")
      });
    }catch{
      Alert.alert(
        "Could Not Share",
        "Please try sharing your list again."
      );
    }

  }

  async function printShoppingList(
    sessionOverride?:ShoppingSession,
    asPdf = false
  ){

    const currentSession =
      sessionOverride || sessionRef.current;

    if(!currentSession.items.length){
      Alert.alert(
        "Nothing To Print Yet",
        "Add an item to your shopping list first."
      );
      return;
    }

    const formatItem = (
      item:ShoppingItem
    )=>{

      const quantity =
        Math.max(
          1,
          Math.floor(Number(item.quantity || 1))
        );

      const price =
        Number(item.price || 0);

      const lineTotal =
        price * quantity;

      const amount =
        price > 0
          ? `$${price.toFixed(2)} x ${quantity} = $${lineTotal.toFixed(2)}`
          : "price not added";

      return {
        status:item.purchased ? "Done" : "To Buy",
        name:item.name,
        amount
      };

    };

    const items =
      [...currentSession.items]
        .sort((a,b)=>
          Number(a.purchased)
          -
          Number(b.purchased)
        )
        .map(formatItem);

    const listTotal =
      currentSession.items.reduce(
        (sum,item)=>
          sum
          +
          (
            Number(item.price || 0)
            *
            Math.max(
              1,
              Math.floor(Number(item.quantity || 1))
            )
          ),
        0
      );

    const escapeHtml = (
      value:string
    )=>
      value
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/\"/g,"&quot;")
        .replace(/'/g,"&#39;");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ShopWithEzz Shopping List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #173B25; }
            h1 { margin: 0 0 12px 0; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #D8E6DA; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #E8F5E9; }
            .total { margin-top: 14px; font-size: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>ShopWithEzz Shopping List</h1>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Item</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item=>`
                <tr>
                  <td>${escapeHtml(item.status)}</td>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(item.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <p class="total">Total: $${listTotal.toFixed(2)}</p>
        </body>
      </html>
    `;

    try{
      if(asPdf){
        const file = await Print.printToFileAsync({html});
        if(!(await Sharing.isAvailableAsync())){
          throw new Error("Sharing unavailable");
        }
        await Sharing.shareAsync(file.uri,{
          mimeType:"application/pdf",
          dialogTitle:"Share ShopWithEzz PDF"
        });
        return;
      }
      await Print.printAsync({
        html
      });
    }catch{
      Alert.alert(
        "Could Not Open Print",
        "No printer service is available on this device yet. Turn on printing in Android settings or try Save as PDF."
      );
    }

  }

  function showShareOptions(){
    setShareOptionsVisible(true);
  }

  async function shareShopWithEzzList(){
    const currentSession = sessionRef.current;
    if(!currentSession.items.length){
      Alert.alert("Nothing To Send Yet", "Add an item to your shopping list first.");
      return;
    }
    try{
      const listData = JSON.stringify({
        format:"shopwithezz-list",
        version:1,
        items:currentSession.items.map(item=>({
          name:item.name,
          price:Number(item.price || 0),
          purchased:Boolean(item.purchased),
          quantity:Math.max(1,Number(item.quantity || 1)),
          barcode:item.barcode
        }))
      });
      const link =
        "https://tilewithralf-lalli.github.io/shopwithezz/open-list.html#"
        + encodeURIComponent(listData);
      await Share.share({
        title:"ShopWithEzz List",
        message:`Open this list in ShopWithEzz:\n${link}`
      });
    }catch{
      Alert.alert("Could Not Send Link", "ShopWithEzz could not prepare this link to send.");
    }
  }

  function showListMessage(
    message:string
  ){

    setQuickAddMessage(message);

    if(quickAddTimer.current){
      clearTimeout(quickAddTimer.current);
    }

    quickAddTimer.current =
      setTimeout(
        ()=>setQuickAddMessage(""),
        2300
      );

  }

  async function updateItem(
    id:string,
    changes:Partial<ShoppingItem>
  ){

    const currentSession =
      sessionRef.current;

    await saveSession({
      ...currentSession,
      items:currentSession.items.map(item=>
        item.id === id
          ? {...item,...changes}
          : item
      )
    });

  }

  async function togglePurchased(
    id:string
  ){

    const currentSession =
      sessionRef.current;

    const currentItem =
      currentSession.items.find(
        item=>item.id === id
      );

    if(!currentItem){
      return;
    }

    await saveSession({
      ...currentSession,
      items:currentSession.items.map(item=>
        item.id === id
          ? {
              ...item,
              purchased:!currentItem.purchased
            }
          : item
      )
    });

  }

  function clearUndo(){

    if(undoTimer.current){
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }

    setUndoRemoval(null);

  }

  function offerUndo(
    items:ShoppingItem[],
    message:string
  ){

    if(undoTimer.current){
      clearTimeout(undoTimer.current);
    }

    setUndoRemoval({
      items,
      message
    });

    undoTimer.current =
      setTimeout(
        ()=>{
          setUndoRemoval(null);
          undoTimer.current = null;
        },
        5000
      );

  }

  async function restoreRemovedItems(){

    if(!undoRemoval){
      return;
    }

    const action =
      undoRemoval;

    clearUndo();

    const currentSession = sessionRef.current;

    await saveSession({
      ...currentSession,
      spent:0,
      items:[
        ...currentSession.items,
        ...action.items
      ]
    });

  }



  async function addQuickItem(){

    const cleanName =
      quickItem.trim();

    if(!cleanName){
      return;
    }

    await saveSession({
      ...session,
      items:[
        ...session.items,
        {
          id:`${Date.now()}-${Math.random()}`,
          name:cleanName,
          price:0,
          quantity:1,
          purchased:false,
          category:categoryForName(cleanName)
        }
      ]
    });

    setQuickItem("");
    Keyboard.dismiss();
    setQuickAddMessage(
      `${cleanName} added to your list`
    );

    if(quickAddTimer.current){
      clearTimeout(quickAddTimer.current);
    }

    quickAddTimer.current =
      setTimeout(
        ()=>setQuickAddMessage(""),
        2300
      );

  }


  async function toggleVoiceSearch(){

    const now =
      Date.now();

    if(
      now - voiceActionAt.current
      <
      700
    ){
      return;
    }

    voiceActionAt.current =
      now;

    const currentState =
      await ExpoSpeechRecognitionModule
        .getStateAsync();

    if(
      listening
      ||
      currentState !== "inactive"
    ){

      if(
        currentState === "starting"
        ||
        currentState === "recognizing"
      ){
        ExpoSpeechRecognitionModule.stop();
      }

      setListening(false);
      return;

    }

    Keyboard.dismiss();
    const permission =
      await ExpoSpeechRecognitionModule
        .requestPermissionsAsync();

    if(!permission.granted){

      Alert.alert(
        "Microphone Permission",
        "Microphone and speech-recognition permission are required."
      );

      return;

    }

    const readyState =
      await ExpoSpeechRecognitionModule
        .getStateAsync();

    if(readyState !== "inactive"){
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang:language,
      interimResults:true,
      continuous:false,
      maxAlternatives:1
    });

  }


  function readCollectedItems(){

    const items =
      sessionRef.current.items.filter(
        item=>item.purchased
      );

    let message = "";

    if(!sessionRef.current.items.length){
      message = "Your shopping list is empty.";
    }
    else if(!items.length){
      message = "You have not collected any items yet.";
    }
    else{
      const names = items.map(item=>item.name);
      let spokenItems = names[0];

      if(names.length === 2){
        spokenItems = `${names[0]} and ${names[1]}`;
      }
      else if(names.length > 2){
        const finalItem = names[names.length - 1];
        spokenItems = `${names.slice(0,-1).join(", ")}, and ${finalItem}`;
      }

      message =
        `You have collected ${items.length} item${items.length === 1 ? "" : "s"}. ${spokenItems}.`;
    }

    setQuickAddMessage(message);
    Speech.stop();
    Speech.speak(message,{
      language,
      rate:0.92
    });

  }


  function speakListMessage(
    message:string
  ){

    setQuickAddMessage(message);
    Speech.stop();
    Speech.speak(message,{
      language,
      rate:0.92
    });

  }


  function spokenNames(
    items:ShoppingItem[]
  ){

    const names =
      items.map(item=>item.name);

    if(names.length <= 1){
      return names[0] || "";
    }

    if(names.length === 2){
      return `${names[0]} and ${names[1]}`;
    }

    return `${names.slice(0,-1).join(", ")}, and ${names[names.length - 1]}`;

  }


  function readRemainingItems(){

    const current = sessionRef.current;
    const items = current.items.filter(item=>!item.purchased);

    if(!items.length){
      speakListMessage(
        current.items.length
          ? "Your shopping list is complete. There are no items left."
          : "Your shopping list is empty."
      );
      return;
    }

    speakListMessage(
      `You have ${items.length} item${items.length === 1 ? "" : "s"} left. ${spokenNames(items)}.`
    );

  }


  function readFullShoppingList(){

    const items = sessionRef.current.items;

    if(!items.length){
      speakListMessage("Your shopping list is empty.");
      return;
    }

    speakListMessage(
      `Your shopping list has ${items.length} item${items.length === 1 ? "" : "s"}. ${spokenNames(items)}.`
    );

  }


  function findSpokenItem(
    wanted:string
  ){

    const cleanWanted = wanted
      .toLowerCase()
      .trim();

    return sessionRef.current.items.find(item=>{
      const savedName = item.name.toLowerCase().trim();
      return savedName === cleanWanted
        || savedName.includes(cleanWanted)
        || cleanWanted.includes(savedName);
    });

  }


  async function processShoppingListVoiceCommand(
    clean:string,
    original:string
  ){

    setQuickItem("");

    if(clean.includes("delete my collected")){
      confirmVoiceDeleteCollected();
      return;
    }

    if(
      clean === "delete my list"
      || clean.includes("delete my whole list")
      || clean === "delete my whole"
    ){
      confirmVoiceDeleteWholeList();
      return;
    }

    if(clean.includes("read my collected")){
      readCollectedItems();
      return;
    }

    if(
      clean.includes("what is left")
      || clean.includes("what's left")
      || clean.includes("whats left")
      || clean.includes("read my list")
    ){
      readRemainingItems();
      return;
    }

    if(
      clean.includes("read my complete list")
      || clean.includes("read my full list")
      || clean.includes("read my whole list")
      || clean.includes("read all my items")
    ){
      readFullShoppingList();
      return;
    }

    if(
      clean === "stop mic"
      || clean.includes("stop listening")
      || clean === "done"
    ){
      ExpoSpeechRecognitionModule.stop();
      showListMessage("Voice input stopped.");
      return;
    }

    const patterns = [
      {prefix:"uncollect ",action:"uncollect"},
      {prefix:"not collected ",action:"uncollect"},
      {prefix:"collect ",action:"collect"},
      {prefix:"collected ",action:"collect"},
      {prefix:"increase ",action:"increase"},
      {prefix:"decrease ",action:"decrease"},
      {prefix:"add ",action:"add"}
    ];

    const match = patterns.find(item=>clean.startsWith(item.prefix));

    if(!match){
      setQuickItem(original);
      showListMessage("Voice filled the item box. Tap Add to add it.");
      return;
    }

    const spokenName = clean.slice(match.prefix.length).trim();

    if(!spokenName){
      speakListMessage("Please say the item name.");
      return;
    }

    const existing = findSpokenItem(spokenName);
    const current = sessionRef.current;

    if(match.action === "add"){
      const displayName = spokenName.replace(/^./,letter=>letter.toUpperCase());

      if(existing){
        await saveSession({
          ...current,
          items:current.items.map(item=>
            item.id === existing.id
              ? {...item,purchased:false}
              : item
          )
        });
        speakListMessage(`${existing.name} is already on the list.`);
        return;
      }

      await saveSession({
        ...current,
        items:[
          ...current.items,
          {
            id:`voice-${Date.now()}-${Math.random()}`,
            name:displayName,
            price:0,
            quantity:1,
            purchased:false,
            category:categoryForName(displayName)
          }
        ]
      });
      speakListMessage(`${displayName} added.`);
      return;
    }

    if(!existing){
      speakListMessage(`I could not find ${spokenName} on your list.`);
      return;
    }

    const quantity = Math.max(1,Number(existing.quantity || 1));
    const changes:Partial<ShoppingItem> =
      match.action === "collect"
        ? {purchased:true}
        : match.action === "uncollect"
          ? {purchased:false}
          : match.action === "increase"
            ? {quantity:quantity + 1}
            : {quantity:Math.max(1,quantity - 1)};

    await saveSession({
      ...current,
      items:current.items.map(item=>
        item.id === existing.id
          ? {...item,...changes}
          : item
      )
    });

    const actionMessage =
      match.action === "collect"
        ? `${existing.name} collected.`
        : match.action === "uncollect"
          ? `${existing.name} moved back to To Buy.`
          : match.action === "increase"
            ? `${existing.name} quantity increased to ${quantity + 1}.`
            : `${existing.name} quantity decreased to ${Math.max(1,quantity - 1)}.`;

    speakListMessage(actionMessage);

  }


  function confirmVoiceDeleteCollected(){

    const collectedCount =
      sessionRef.current.items.filter(
        item=>item.purchased
      ).length;

    if(!collectedCount){
      speakListMessage("There are no collected items to delete.");
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
            const current = sessionRef.current;
            await saveSession({
              ...current,
              items:current.items.filter(item=>!item.purchased)
            });
            speakListMessage("Your collected items were deleted.");
          }
        }
      ]
    );

  }


  function confirmVoiceDeleteWholeList(){

    const itemCount = sessionRef.current.items.length;

    if(!itemCount){
      speakListMessage("Your shopping list is already empty.");
      return;
    }

    Alert.alert(
      "Delete Your Whole List?",
      `Permanently delete all ${itemCount} item${itemCount === 1 ? "" : "s"}? Your budget will stay unchanged.`,
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Delete Whole List",
          style:"destructive",
          onPress:async()=>{
            const current = sessionRef.current;
            await saveSession({
              ...current,
              items:[]
            });
            speakListMessage("Your whole shopping list was deleted.");
          }
        }
      ]
    );

  }


  function openEdit(
    item:ShoppingItem
  ){

    router.push({
      pathname:"/editShoppingItem",
      params:{id:item.id}
    });

  }


  const toBuyCount =
    session.items.filter(
      item=>!item.purchased
    ).length;

  const collectedCount =
    session.items.length - toBuyCount;

  const progressPercent =
    session.items.length
      ? Math.round(
          collectedCount
          /
          session.items.length
          *
          100
        )
      : 0;

  const filteredItems =
    [...session.items]
      .filter(item=>
        (
          listFilter === "all"
          ||
          (
            listFilter === "toBuy"
            &&
            !item.purchased
          )
          ||
          (
            listFilter === "collected"
            &&
            item.purchased
          )
        )
      )
      .sort((a,b)=>{

        // Keep items still to buy at the top and move selected/collected
        // items to the bottom. Unticking an item moves it back up.
        if(a.purchased !== b.purchased){
          return Number(a.purchased) - Number(b.purchased);
        }

        const aHasPrice =
          Number(a.price || 0) > 0;

        const bHasPrice =
          Number(b.price || 0) > 0;

        if(aHasPrice !== bHasPrice){
          return aHasPrice ? 1 : -1;
        }

        return a.name.localeCompare(b.name);

      });

  const total =
    session.items.reduce(
      (sum,item)=>
        sum
        +
        (
          Number(item.price || 0)
          *
          Math.max(
            1,
            Math.floor(Number(item.quantity || 1))
          )
        ),
      0
    );

  const remaining =
    session.budget - total;

  const budgetUsagePercent =
    session.budget > 0
      ? Math.round((total / session.budget) * 100)
      : total > 0
        ? 100
        : 0;

  const budgetBarWidth =
    Math.min(100,budgetUsagePercent);

  const budgetProgressColor =
    budgetUsagePercent >= 100
      ? "#C62828"
      : budgetUsagePercent >= 75
        ? "#F9A825"
        : "#4CAF50";

  function compactAmount(
    value:number
  ){

    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(2);

  }

  function renderOverviewList(){

    return(
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Your List</Text>
          <Text style={styles.previewCount}>
            {session.items.length} items
          </Text>
        </View>

        {filteredItems.length ? (
          <View>
            {filteredItems.map(item=>(
              <View
                key={item.id}
                style={[
                  styles.previewRow,
                  Number(item.price || 0) > 0
                  && styles.previewRowPriced,
                  item.purchased
                  && styles.previewRowCollected
                ]}
              >
                <View style={styles.previewMainRow}>
                  <TouchableOpacity
                    style={styles.previewCheckbox}
                    onPress={()=>togglePurchased(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{checked:item.purchased}}
                  >
                    <Ionicons
                      name={
                        item.purchased
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={26}
                      color={
                        item.purchased
                          ? "#6E8B68"
                          : "#9BAD9C"
                      }
                    />
                  </TouchableOpacity>

                  {Number(item.price || 0) <= 0 && (
                    <TouchableOpacity
                      style={styles.previewAddPrice}
                      onPress={()=>openEdit(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add price for ${item.name}`}
                    >
                      <Text style={styles.previewAddPriceText}>
                        + Price
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.previewDetails}
                    activeOpacity={0.78}
                    onPress={()=>openEdit(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.name}`}
                  >
                    <Text
                      style={[
                        styles.previewName,
                        item.purchased && styles.previewNameCollected
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                      {Math.max(
                        1,
                        Math.floor(Number(item.quantity || 1))
                      ) > 1
                        ? ` x${Math.max(
                            1,
                            Math.floor(Number(item.quantity || 1))
                          )}`
                        : ""}
                    </Text>
                    <Text style={[
                      styles.previewPrice,
                      Number(item.price || 0) <= 0
                      && styles.previewNeedsPrice
                    ]}>
                      {Number(item.price || 0) > 0
                        ? `${Math.max(
                            1,
                            Math.floor(Number(item.quantity || 1))
                          )} x ${compactAmount(Number(item.price || 0))} = ${compactAmount(
                            Number(item.price || 0)
                            *
                            Math.max(
                              1,
                              Math.floor(Number(item.quantity || 1))
                            )
                          )}`
                        : "Price not added yet"}
                    </Text>
                  </TouchableOpacity>

                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#78907D"
                  />
                </View>

              </View>
            ))}
          </View>
        ) : (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyText}>
              Add your first item above.
            </Text>
          </View>
        )}
      </View>
    );

  }


  return(

    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom:
            Math.max(insets.bottom,16)
        }
      ]}
      showsVerticalScrollIndicator
    >

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={()=>{
            if(router.canGoBack()){
              router.back();
              return;
            }
            router.replace("/");
          }}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerDetails}>
          <Text style={styles.title}>
            {listView === "toBuy"
              ? "To Buy"
              : listView === "collected"
                ? "Collected"
                : listView === "all"
                  ? "All Items"
                  : availableLists.find(list=>list.id === activeListId)?.name === "My Shopping List"
                    ? "My List"
                    : availableLists.find(list=>list.id === activeListId)?.name || "My List"}
          </Text>
          <Text style={styles.subtitle}>
            Unpriced first
            {" • "}
            {listView === "toBuy"
              ? toBuyCount
              : listView === "collected"
                ? collectedCount
                : session.items.length} items
          </Text>
        </View>

      </View>

      {isOverview && visibleListTabs.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listTabs}
        >
          {visibleListTabs.map(list=>{
            const isActive = list.id === activeListId;
            const label =
              list.name === "My Shopping List"
                ? "My List"
                : list.name;
            return (
              <TouchableOpacity
                key={list.id}
                style={[styles.listTab,isActive && styles.listTabActive]}
                onPress={()=>void openList(list.id)}
                onLongPress={()=>askToDeleteList(list)}
                delayLongPress={450}
              >
                <Text style={[styles.listTabText,isActive && styles.listTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {isOverview && (
      <>

      <View style={styles.quickAddRow}>
        <View style={styles.quickAddInputBox}>
          <Ionicons
            name="cart-outline"
            size={19}
            color="#2E7D32"
          />
          <TextInput
            style={styles.quickAddInput}
            value={quickItem}
            onChangeText={setQuickItem}
            placeholder="Quick add an item"
            placeholderTextColor="#90A497"
            returnKeyType="done"
            onSubmitEditing={addQuickItem}
          />
          <TouchableOpacity
            style={[
              styles.quickLanguageButton,
              language === "en-AU" && styles.quickLanguageActive
            ]}
            onPress={()=>setLanguage("en-AU")}
            accessibilityRole="button"
            accessibilityLabel="Use English speech"
          >
            <Text style={[
              styles.quickLanguageText,
              language === "en-AU" && styles.quickLanguageTextActive
            ]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickLanguageButton,
              language === "de-DE" && styles.quickLanguageActive
            ]}
            onPress={()=>setLanguage("de-DE")}
            accessibilityRole="button"
            accessibilityLabel="Use German speech"
          >
            <Text style={[
              styles.quickLanguageText,
              language === "de-DE" && styles.quickLanguageTextActive
            ]}>DE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickMicButton,
              listening && styles.micListening
            ]}
            onPress={toggleVoiceSearch}
            accessibilityRole="button"
            accessibilityLabel={
              listening
                ? "Stop listening"
                : "Speak an item"
            }
          >
            <Ionicons
              name={
                listening
                  ? "stop"
                  : "mic-outline"
              }
              size={19}
              color={
                listening
                  ? "#C62828"
                  : "#2E7D32"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAddButton,
              !quickItem.trim()
              &&
              styles.quickAddButtonDisabled
            ]}
            onPress={addQuickItem}
            disabled={!quickItem.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add item"
          >
            <Ionicons
              name="add"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

      </View>

      {listening && (
        <View style={styles.quickListening}>
          <View style={styles.micStatusDot}/>
          <Text style={styles.quickListeningText}>
            Listening for an item…
          </Text>
        </View>
      )}

      {!!quickAddMessage && (
        <View style={styles.quickAddConfirmation}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color="#2E7D32"
          />
          <Text
            style={styles.quickAddConfirmationText}
            numberOfLines={1}
          >
            {quickAddMessage}
          </Text>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>BUDGET</Text>
          <View style={styles.listBudgetBox}>
            <Text style={styles.listBudgetDollar}>$</Text>
            <TextInput
              style={styles.listBudgetInput}
              value={listBudgetInput}
              onChangeText={setListBudgetInput}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={()=>void saveListBudget()}
              onEndEditing={()=>void saveListBudget()}
              accessibilityLabel="Budget for this list"
            />
          </View>
        </View>
        <View style={styles.summaryLine}/>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>TOTAL</Text>
          <Text style={styles.summaryValue}>
            ${total.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryLine}/>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>
            {remaining < 0 ? "OVER" : "LEFT"}
          </Text>
          <Text
            style={[
              styles.remaining,
              remaining < 0 && styles.over
            ]}
          >
            ${Math.abs(remaining).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            Budget progress
          </Text>
          <Text style={[styles.progressValue,{color:budgetProgressColor}]}> 
            {budgetUsagePercent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width:`${budgetBarWidth}%`,
                backgroundColor:budgetProgressColor
              }
            ]}
          />
        </View>
      </View>

      {toolsVisible && (
      <View style={styles.toolsSection}>
      <Text style={styles.toolsSectionLabel}>
        OPEN A LIST
      </Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={()=>router.push({
            pathname:"/shoppingList",
            params:{view:"all"}
          })}
        >
          <Text style={styles.filterText}>
            All {session.items.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={()=>router.push({
            pathname:"/shoppingList",
            params:{view:"toBuy"}
          })}
        >
          <Text style={styles.filterText}>
            To Buy {toBuyCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={()=>router.push({
            pathname:"/shoppingList",
            params:{view:"collected"}
          })}
        >
          <Text style={styles.filterText}>
            Collected {collectedCount}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.shareListButton}
        onPress={showShareOptions}
        accessibilityRole="button"
        accessibilityLabel="Share shopping list"
      >
        <View style={styles.shareListIcon}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.shareListDetails}>
          <Text style={styles.shareListTitle}>
            Share List
          </Text>
          <Text style={styles.shareListHint}>
            Send by message, email or WhatsApp
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={17}
          color="#607D6B"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shareListButton}
        onPress={()=>
          router.push("/handsFree" as Href)
        }
        accessibilityRole="button"
        accessibilityLabel="Open Hands-Free shopping"
      >
        <View style={styles.shareListIcon}>
          <Ionicons
            name="mic-outline"
            size={18}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.shareListDetails}>
          <Text style={styles.shareListTitle}>
            Hands-Free
          </Text>
          <Text style={styles.shareListHint}>
            Control your list with your voice
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={17}
          color="#607D6B"
        />
      </TouchableOpacity>
      </View>
      )}

      </>
      )}

      <TouchableOpacity
        style={styles.shareListButton}
        onPress={showShareOptions}
        accessibilityRole="button"
        accessibilityLabel="Share shopping list"
      >
        <View style={styles.shareListIcon}>
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.shareListDetails}>
          <Text style={styles.shareListTitle}>Share List</Text>
          <Text style={styles.shareListHint}>Text, PDF or print</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color="#607D6B" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scanBar}
        onPress={()=>
          router.push({
            pathname:"/scanner",
            params:{mode:"shoppingList"}
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Scan a barcode"
      >
        <View style={styles.scanBarIcon}>
          <Ionicons name="barcode-outline" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.scanBarText}>Scan Item</Text>
        <Ionicons name="chevron-forward" size={18} color="#607D6B" />
      </TouchableOpacity>

      {isOverview && renderOverviewList()}

      {!isOverview && (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredItems.length
            ? styles.list
            : styles.emptyList
        }
      >
        {filteredItems.length ? (
          filteredItems.map(item=>(
            <View
              key={item.id}
              style={[
                styles.itemCard,
                Number(item.price || 0) > 0
                  &&
                styles.pricedCard,
                item.purchased && styles.purchasedCard
              ]}
            >
              <TouchableOpacity
                onPress={()=>togglePurchased(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{checked:item.purchased}}
                accessibilityLabel={`${item.name}, ${item.purchased ? "selected" : "not selected"}`}
              >
                <Text style={styles.checkbox}>
                  {item.purchased ? "☑️" : "☐"}
                </Text>
              </TouchableOpacity>

              <View style={styles.itemDetails}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={()=>openEdit(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}
                >
                  <Text
                    style={[
                      styles.itemName,
                      item.purchased && styles.purchasedName
                    ]}
                  >
                    {item.name}
                  </Text>

                  <Text style={styles.itemPrice}>
                    {Number(item.price || 0) > 0
                      ? `$${Number(item.price).toFixed(2)}`
                      : "Price not added yet"}
                  </Text>
                </TouchableOpacity>



                {!!item.barcode && (
                  <View style={styles.barcodeRow}>
                    <Ionicons
                      name="barcode-outline"
                      size={14}
                      color="#2E7D32"
                    />
                    <Text style={styles.barcodeText}>
                      {item.barcode}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.itemActions}
                onPress={()=>openEdit(item)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#78907D"
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>
              {listFilter === "collected"
                ? "Nothing collected yet"
                : listFilter === "toBuy"
                  ? "Everything is collected"
                  : "Your list is empty"}
            </Text>
            <Text style={styles.emptyText}>
              {listFilter === "collected"
                ? "Tick an item when it goes into your trolley."
                : listFilter === "toBuy"
                  ? "Great work — your shopping is complete."
                  : "Return to the overview to add an item."}
            </Text>
          </View>
        )}
      </ScrollView>
      )}

      {!isOverview && (
      <>
      {!!undoRemoval && (
        <View style={styles.undoBar}>
          <View style={styles.undoIcon}>
            <Ionicons
              name="arrow-undo-outline"
              size={19}
              color="#FFFFFF"
            />
          </View>
          <Text
            style={styles.undoMessage}
            numberOfLines={1}
          >
            {undoRemoval.message}
          </Text>
          <TouchableOpacity
            style={styles.undoButton}
            onPress={restoreRemovedItems}
          >
            <Text style={styles.undoButtonText}>
              UNDO
            </Text>
          </TouchableOpacity>
        </View>
      )}

      </>
      )}

      <Modal
        visible={shareOptionsVisible}
        transparent
        animationType="slide"
        onRequestClose={()=>setShareOptionsVisible(false)}
      >
        <View style={styles.shareSheetBackdrop}>
          <View
            style={[
              styles.shareSheet,
              {
                paddingBottom:
                  Math.max(insets.bottom + 16,84)
              }
            ]}
          >
            <Text style={styles.shareSheetTitle}>Share Shopping List</Text>
            <Text style={styles.shareSheetHint}>
              Choose how you would like to send or use this list.
            </Text>

            <TouchableOpacity
              style={styles.shareSheetOption}
              onPress={()=>{
                setShareOptionsVisible(false);
                void shareShoppingList();
              }}
            >
              <Ionicons name="chatbubble-outline" size={21} color="#2E7D32" />
              <Text style={styles.shareSheetOptionText}>Send as Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareSheetOption}
              onPress={()=>{
                setShareOptionsVisible(false);
                void printShoppingList(undefined,true);
              }}
            >
              <Ionicons name="document-outline" size={21} color="#2E7D32" />
              <Text style={styles.shareSheetOptionText}>Share as PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareSheetOption}
              onPress={()=>{
                setShareOptionsVisible(false);
                void printShoppingList();
              }}
            >
              <Ionicons name="print-outline" size={21} color="#2E7D32" />
              <Text style={styles.shareSheetOptionText}>Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareSheetOption}
              onPress={()=>{
                setShareOptionsVisible(false);
                void shareShopWithEzzList();
              }}
            >
              <Ionicons name="link-outline" size={21} color="#2E7D32" />
              <Text style={styles.shareSheetOptionText}>Send ShopWithEzz Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareSheetCancel}
              onPress={()=>setShareOptionsVisible(false)}
            >
              <Text style={styles.shareSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>

  );

}


const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#FBF7F2"},
  scrollContent:{paddingHorizontal:18,paddingTop:46},
  header:{flexDirection:"row",alignItems:"center"},
  backButton:{width:46,height:46,borderRadius:15,backgroundColor:"#E6EEE2",alignItems:"center",justifyContent:"center"},
  backText:{marginTop:-4,fontSize:38,color:"#1B5E20"},
  headerDetails:{flex:1,marginLeft:12},
  title:{fontSize:25,fontWeight:"900",color:"#173B25"},
  subtitle:{marginTop:2,fontSize:11,fontWeight:"700",color:"#78907D"},
  listTabs:{marginTop:11,paddingRight:8,flexDirection:"row"},
  listTab:{minWidth:126,minHeight:45,marginRight:7,paddingHorizontal:12,borderRadius:12,backgroundColor:"#E6EEE2",borderWidth:1,borderColor:"#D4E0D0",alignItems:"center",justifyContent:"center"},
  listTabActive:{backgroundColor:"#2E7D32",borderColor:"#2E7D32"},
  listTabText:{fontSize:12,fontWeight:"900",color:"#40503F"},
  listTabTextActive:{color:"#FFFFFF"},
  quickAddRow:{marginTop:15,flexDirection:"row",alignItems:"center"},
  readCollectedButton:{marginTop:10,paddingVertical:11,paddingHorizontal:13,borderRadius:15,backgroundColor:"#E8F5E9",borderWidth:1,borderColor:"#C8E6C9",flexDirection:"row",alignItems:"center"},
  readCollectedDetails:{flex:1,marginLeft:10},
  readCollectedTitle:{fontSize:13,fontWeight:"900",color:"#2E7D32"},
  readCollectedHint:{marginTop:2,fontSize:10,color:"#607D6B"},
  quickAddInputBox:{flex:1,height:50,paddingLeft:13,borderRadius:16,borderWidth:1,borderColor:"#E6DED7",backgroundColor:"#FFFFFF",flexDirection:"row",alignItems:"center"},
  quickAddInput:{flex:1,paddingHorizontal:9,fontSize:14,fontWeight:"700",color:"#263238"},
  quickLanguageButton:{height:27,minWidth:28,marginRight:4,borderRadius:8,backgroundColor:"#E5EBE5",alignItems:"center",justifyContent:"center"},
  quickLanguageActive:{backgroundColor:"#607D6B"},
  quickLanguageText:{fontSize:8,fontWeight:"900",color:"#607D6B"},
  quickLanguageTextActive:{color:"#FFFFFF"},
  quickMicButton:{width:39,height:39,marginRight:5,borderRadius:12,backgroundColor:"#E4F2E6",alignItems:"center",justifyContent:"center"},
  quickAddButton:{width:39,height:39,marginRight:5,borderRadius:12,backgroundColor:"#2E7D32",alignItems:"center",justifyContent:"center"},
  quickAddButtonDisabled:{backgroundColor:"#AFC4B5"},
  quickListening:{marginTop:7,paddingVertical:7,paddingHorizontal:10,borderRadius:10,backgroundColor:"#FFEBEE",flexDirection:"row",alignItems:"center"},
  quickListeningText:{marginLeft:7,fontSize:10,fontWeight:"900",color:"#C62828"},
  quickAddConfirmation:{marginTop:8,paddingVertical:8,paddingHorizontal:11,borderRadius:11,backgroundColor:"#E8F5E9",flexDirection:"row",alignItems:"center"},
  quickAddConfirmationText:{flex:1,marginLeft:7,fontSize:11,fontWeight:"800",color:"#2E7D32"},
  summaryCard:{marginTop:9,paddingVertical:10,paddingHorizontal:5,borderRadius:16,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#EEE7E0",flexDirection:"row",alignItems:"center"},
  summary:{flex:1,alignItems:"center"},
  summaryLabel:{fontSize:9,fontWeight:"900",color:"#9A8980"},
  summaryValue:{marginTop:4,fontSize:16,fontWeight:"900",color:"#463E3B"},
  listBudgetBox:{marginTop:3,flexDirection:"row",alignItems:"center",justifyContent:"center"},
  listBudgetDollar:{fontSize:16,fontWeight:"900",color:"#657B60"},
  listBudgetInput:{minWidth:44,paddingVertical:0,paddingHorizontal:3,fontSize:16,fontWeight:"900",color:"#463E3B",textAlign:"center"},
  remaining:{marginTop:4,fontSize:16,fontWeight:"900",color:"#657B60"},
  over:{color:"#FF8A80"},
  summaryLine:{width:1,height:30,backgroundColor:"#EEE7E0"},
  progressCard:{marginTop:7,paddingVertical:6,paddingHorizontal:3,backgroundColor:"transparent"},
  progressHeader:{flexDirection:"row",alignItems:"center"},
  progressTitle:{flex:1,fontSize:12,fontWeight:"900",color:"#173B25"},
  progressValue:{fontSize:12,fontWeight:"900",color:"#2E7D32"},
  progressTrack:{marginTop:8,height:7,borderRadius:5,overflow:"hidden",backgroundColor:"#D9E8DA"},
  progressFill:{height:"100%",borderRadius:5,backgroundColor:"#4CAF50"},
  toolsSection:{marginTop:9},
  toolsSectionLabel:{fontSize:9,fontWeight:"900",letterSpacing:1,color:"#78907D"},
  filterRow:{marginTop:5,flexDirection:"row"},
  filterButton:{flex:1,marginHorizontal:3,paddingVertical:11,borderRadius:13,backgroundColor:"#E6EEE2",borderWidth:1,borderColor:"#D4E0D0",alignItems:"center"},
  filterButtonActive:{backgroundColor:"#2E7D32",borderColor:"#2E7D32",elevation:2},
  filterText:{fontSize:12,fontWeight:"900",color:"#607D6B"},
  filterTextActive:{color:"#FFFFFF"},
  shareListButton:{marginTop:8,height:48,paddingHorizontal:9,borderRadius:14,backgroundColor:"#E6EEE2",borderWidth:1,borderColor:"#D4E0D0",flexDirection:"row",alignItems:"center"},
  shareListIcon:{width:34,height:34,borderRadius:10,backgroundColor:"#7B8F75",alignItems:"center",justifyContent:"center"},
  shareListDetails:{flex:1,marginLeft:9},
  shareListTitle:{fontSize:12,fontWeight:"900",color:"#40503F"},
  shareListHint:{marginTop:1,fontSize:9,fontWeight:"700",color:"#78907D"},
  shareSheetBackdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(20,38,27,0.45)"},
  shareSheet:{paddingHorizontal:20,paddingTop:19,borderTopLeftRadius:28,borderTopRightRadius:28,backgroundColor:"#FBF7F2"},
  shareSheetTitle:{fontSize:21,fontWeight:"900",color:"#173B25"},
  shareSheetHint:{marginTop:4,marginBottom:14,fontSize:12,fontWeight:"600",color:"#607D6B"},
  shareSheetOption:{height:53,marginBottom:8,paddingHorizontal:15,borderRadius:15,backgroundColor:"#E6EEE2",borderWidth:1,borderColor:"#D4E0D0",flexDirection:"row",alignItems:"center"},
  shareSheetOptionText:{marginLeft:12,fontSize:15,fontWeight:"900",color:"#40503F"},
  shareSheetCancel:{height:49,marginTop:3,borderRadius:15,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E4DDD6",alignItems:"center",justifyContent:"center"},
  shareSheetCancelText:{fontSize:15,fontWeight:"900",color:"#8B554D"},
  sortRow:{marginTop:8,flexDirection:"row",alignItems:"center"},
  sortLabel:{marginRight:7,fontSize:10,fontWeight:"900",color:"#78907D"},
  sortButton:{marginRight:6,paddingVertical:7,paddingHorizontal:10,borderRadius:10,backgroundColor:"#F0F4F0",flexDirection:"row",alignItems:"center"},
  sortButtonActive:{backgroundColor:"#607D6B"},
  sortButtonText:{marginLeft:5,fontSize:9,fontWeight:"900",color:"#607D6B"},
  sortButtonTextActive:{color:"#FFFFFF"},
  scanBar:{marginTop:9,height:48,paddingHorizontal:9,borderRadius:15,backgroundColor:"#E6EEE2",borderWidth:1,borderColor:"#D4E0D0",flexDirection:"row",alignItems:"center"},
  scanBarIcon:{width:34,height:34,borderRadius:10,backgroundColor:"#173B25",alignItems:"center",justifyContent:"center"},
  scanBarText:{flex:1,marginLeft:10,fontSize:13,fontWeight:"900",color:"#40503F"},
  previewCard:{marginTop:10,paddingHorizontal:12,paddingTop:12,paddingBottom:7,borderRadius:18,backgroundColor:"#F5ECE7",borderWidth:1,borderColor:"#EADDD6"},
  previewHeader:{paddingBottom:7,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  previewTitle:{fontSize:17,fontWeight:"900",color:"#263238"},
  previewCount:{fontSize:11,fontWeight:"800",color:"#78907D"},
  previewRow:{marginBottom:7,paddingHorizontal:11,paddingVertical:10,borderRadius:12,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E9E3DE"},
  previewRowPriced:{backgroundColor:"#E8F2E5",borderColor:"#D4E3D0"},
  previewRowCollected:{backgroundColor:"#DFE9DB",borderColor:"#CBDCC6"},
  previewMainRow:{minHeight:40,flexDirection:"row",alignItems:"center"},
  previewCheckbox:{width:38,alignItems:"flex-start",justifyContent:"center"},
  previewDetails:{flex:1,paddingVertical:3},
  previewName:{fontSize:20,fontWeight:"900",color:"#34433A"},
  previewNameCollected:{textDecorationLine:"line-through",color:"#91A095"},
  previewPrice:{marginTop:4,fontSize:14,fontWeight:"700",color:"#607D6B"},
  previewNeedsPrice:{color:"#A16D62"},
  previewAddPrice:{height:32,marginRight:5,paddingHorizontal:9,borderRadius:10,backgroundColor:"#7B8F75",alignItems:"center",justifyContent:"center"},
  previewAddPriceText:{fontSize:11,fontWeight:"900",color:"#FFFFFF"},
  viewAllButton:{height:38,borderTopWidth:1,borderTopColor:"#E7DAD3",flexDirection:"row",alignItems:"center",justifyContent:"center"},
  viewAllText:{marginRight:6,fontSize:10,fontWeight:"900",color:"#2E7D32"},
  previewEmpty:{paddingVertical:14,alignItems:"center"},
  previewEmptyText:{fontSize:11,fontWeight:"700",color:"#78907D"},
  micButton:{width:42,height:42,borderRadius:13,backgroundColor:"#DFF1E1",alignItems:"center",justifyContent:"center"},
  micListening:{backgroundColor:"#FFCDD2"},
  micIcon:{fontSize:19,color:"#C62828"},
  voiceHint:{marginTop:6,fontSize:9,fontWeight:"700",color:"#78907D"},
  micStatus:{marginTop:8,paddingVertical:8,paddingHorizontal:10,borderRadius:11,backgroundColor:"#FFEBEE",borderWidth:1,borderColor:"#EF9A9A",flexDirection:"row",alignItems:"center"},
  micStatusDot:{width:8,height:8,borderRadius:4,backgroundColor:"#D32F2F",marginRight:7},
  micStatusText:{flex:1,fontSize:10,fontWeight:"900",color:"#C62828"},
  micStatusStop:{fontSize:9,fontWeight:"800",color:"#C62828"},
  list:{paddingTop:9,paddingBottom:10},
  emptyList:{flexGrow:1,justifyContent:"center"},
  itemCard:{marginBottom:7,paddingVertical:11,paddingHorizontal:11,borderRadius:14,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E1EBE2",flexDirection:"row",alignItems:"center",elevation:1},
  pricedCard:{backgroundColor:"#E8F5E9",borderColor:"#C8E6C9"},
  purchasedCard:{backgroundColor:"#DCEDC8",borderColor:"#AED581"},
  checkbox:{fontSize:20},
  itemDetails:{flex:1,marginLeft:8,marginRight:6},
  itemName:{fontSize:20,fontWeight:"900",color:"#263238"},
  purchasedName:{textDecorationLine:"line-through",color:"#90A4AE"},
  itemPrice:{marginTop:4,fontSize:14,fontWeight:"700",color:"#607D6B"},
  barcodeRow:{marginTop:5,flexDirection:"row",alignItems:"center"},
  barcodeText:{marginLeft:5,fontSize:10,fontWeight:"700",color:"#607D6B"},
  itemActions:{width:32,alignItems:"center"},
  emptyCard:{alignItems:"center",padding:25},
  emptyIcon:{fontSize:40},
  emptyTitle:{marginTop:10,fontSize:18,fontWeight:"900",color:"#263238"},
  emptyText:{marginTop:5,fontSize:12,color:"#78907D"},
  floatingScanButton:{position:"absolute",right:20,bottom:142,height:48,paddingHorizontal:15,borderRadius:17,backgroundColor:"#173B25",flexDirection:"row",alignItems:"center",justifyContent:"center",elevation:8,zIndex:10},
  floatingScanWithUndo:{bottom:198},
  floatingScanText:{marginLeft:7,fontSize:13,fontWeight:"900",color:"#FFFFFF"},
  undoBar:{marginBottom:9,paddingVertical:9,paddingHorizontal:10,borderRadius:15,backgroundColor:"#173B25",flexDirection:"row",alignItems:"center",elevation:5},
  undoIcon:{width:32,height:32,borderRadius:10,backgroundColor:"#2E7D32",alignItems:"center",justifyContent:"center"},
  undoMessage:{flex:1,marginHorizontal:9,fontSize:11,fontWeight:"800",color:"#FFFFFF"},
  undoButton:{paddingVertical:8,paddingHorizontal:11,borderRadius:10,backgroundColor:"#FFFFFF"},
  undoButtonText:{fontSize:10,fontWeight:"900",color:"#2E7D32"},
});

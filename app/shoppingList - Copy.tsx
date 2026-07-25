import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  Alert,
  FlatList,
  Keyboard,
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

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  File,
  Paths
} from "expo-file-system";

import * as Sharing from "expo-sharing";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";

import {
  categoryForName,
  normaliseCategory,
  ShoppingCategory
} from "../constants/shoppingCategories";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";

const FAVOURITES_KEY =
  "shopwithezz-shopping-favourites-v1";

const TOOLS_HINT_KEY =
  "shopwithezz-shopping-tools-hint-seen-v1";


type ShoppingItem = {
  id:string;
  name:string;
  price:number;
  purchased:boolean;
  barcode?:string;
  quantity?:number;
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

type FavouriteItem = {
  name:string;
  price:number;
  barcode?:string;
  category:ShoppingCategory;
};

function getQuantity(item:ShoppingItem){

  return Math.max(
    1,
    Math.floor(Number(item.quantity || 1))
  );

}

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
    useLocalSearchParams<{view?:string}>();

  const requestedView =
    Array.isArray(params.view)
      ? params.view[0]
      : params.view;

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

  const sessionRef =
    useRef<ShoppingSession>(session);

  const sessionSaveQueue =
    useRef<Promise<void>>(Promise.resolve());

  const [favourites,setFavourites] =
    useState<FavouriteItem[]>([]);

  const [toolsVisible,setToolsVisible] =
    useState(false);

  const [showToolsHint,setShowToolsHint] =
    useState(false);

  const [quickItem,setQuickItem] =
    useState("");

  const [quickAddMessage,setQuickAddMessage] =
    useState("");

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

      loadSession();

    },[])

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
      setQuickItem(
        event.results[0]?.transcript || ""
      );
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

    const [
      saved,
      savedFavourites,
      toolsHintSeen
    ] =
      await Promise.all([
        AsyncStorage.getItem(
          SESSION_KEY
        ),
        AsyncStorage.getItem(
          FAVOURITES_KEY
        ),
        AsyncStorage.getItem(
          TOOLS_HINT_KEY
        )
      ]);

    if(saved){
      const storedSession =
        JSON.parse(saved);

      const savedSession = {
        ...storedSession,
        spent:0
      };

      sessionRef.current = savedSession;
      setSession(savedSession);

      if(Number(storedSession.spent || 0) !== 0){
        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify(savedSession)
        );
      }
    }

    if(savedFavourites){

      const parsed =
        JSON.parse(savedFavourites);

      if(Array.isArray(parsed)){
        setFavourites(parsed);
      }

    }

    setShowToolsHint(!toolsHintSeen);

  }


  async function saveSession(
    next:ShoppingSession
  ){

    sessionRef.current = next;
    setSession(next);

    sessionSaveQueue.current =
      sessionSaveQueue.current.then(
        ()=>AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify(next)
        )
      );

    await sessionSaveQueue.current;

  }

  async function toggleTools(){

    setToolsVisible(current=>!current);

    if(showToolsHint){

      setShowToolsHint(false);

      await AsyncStorage.setItem(
        TOOLS_HINT_KEY,
        "seen"
      );

    }

  }

  async function shareShoppingList(){

    const currentSession =
      sessionRef.current;

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
        getQuantity(item);

      const price =
        Number(item.price || 0);

      const amount =
        price > 0
          ? ` - $${price.toFixed(2)} each ($${(
              price * quantity
            ).toFixed(2)})`
          : " - price not added";

      return `${item.purchased ? "[x]" : "[ ]"} ${quantity} x ${item.name}${amount}`;

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
          Number(item.price || 0)
          *
          getQuantity(item),
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

  async function sendShopWithEzzList(){

    const currentSession =
      sessionRef.current;

    if(!currentSession.items.length){
      Alert.alert(
        "Nothing To Send Yet",
        "Add an item to your shopping list first."
      );
      return;
    }

    try{

      const payload = {
        format:"shopwithezz-list",
        version:1,
        createdAt:new Date().toISOString(),
        items:currentSession.items.map(item=>({
          name:item.name,
          price:Number(item.price || 0),
          purchased:Boolean(item.purchased),
          quantity:getQuantity(item),
          barcode:item.barcode
        }))
      };

      const file =
        new File(
          Paths.cache,
          "ShopWithEzz-List.shopwithezz"
        );

      file.create({
        overwrite:true,
        intermediates:true
      });
      file.write(JSON.stringify(payload));

      await Sharing.shareAsync(
        file.uri,
        {
          mimeType:
            "application/vnd.shopwithezz.list+json",
          dialogTitle:
            "Send to another ShopWithEzz user"
        }
      );

    }catch{
      Alert.alert(
        "Could Not Send List",
        "Please try sending your ShopWithEzz list again."
      );
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

  async function saveFavourites(
    next:FavouriteItem[]
  ){

    setFavourites(next);

    await AsyncStorage.setItem(
      FAVOURITES_KEY,
      JSON.stringify(next)
    );

  }

  function matchesFavourite(
    item:{
      name:string;
      barcode?:string;
    },
    favourite:FavouriteItem
  ){

    if(item.barcode && favourite.barcode){
      return item.barcode === favourite.barcode;
    }

    return (
      item.name.trim().toLowerCase()
      ===
      favourite.name.trim().toLowerCase()
    );

  }

  function isFavourite(
    item:ShoppingItem
  ){

    return favourites.some(
      favourite=>
        matchesFavourite(item,favourite)
    );

  }

  async function toggleFavourite(
    item:ShoppingItem
  ){

    if(isFavourite(item)){

      await saveFavourites(
        favourites.filter(
          favourite=>
            !matchesFavourite(item,favourite)
        )
      );

      showListMessage(
        `${item.name} removed from favourites`
      );

      return;

    }

    await saveFavourites([
      ...favourites,
      {
        name:item.name,
        price:Number(item.price || 0),
        barcode:item.barcode,
        category:getCategory(item)
      }
    ]);

    showListMessage(
      `${item.name} saved to favourites`
    );

  }

  async function removeFavourite(
    favourite:FavouriteItem
  ){

    await saveFavourites(
      favourites.filter(
        current=>
          !matchesFavourite(current,favourite)
      )
    );

    showListMessage(
      `${favourite.name} removed from favourites`
    );

  }

  async function addFavouriteToList(
    favourite:FavouriteItem
  ){

    const existingItem =
      session.items.find(
        item=>
          matchesFavourite(item,favourite)
      );

    if(existingItem){

      const nextQuantity =
        getQuantity(existingItem) + 1;

      await saveSession({
        ...session,
        items:session.items.map(item=>
          item.id === existingItem.id
            ? {
                ...item,
                quantity:nextQuantity
              }
            : item
        )
      });

      showListMessage(
        `${existingItem.name} quantity increased to ${nextQuantity}`
      );

      return;

    }

    await saveSession({
      ...session,
      items:[
        ...session.items,
        {
          id:`${Date.now()}-${Math.random()}`,
          name:favourite.name,
          price:favourite.price,
          barcode:favourite.barcode,
          category:favourite.category,
          purchased:false,
          quantity:1
        }
      ]
    });

    showListMessage(
      `${favourite.name} added from favourites`
    );

  }


  async function updateItem(
    id:string,
    changes:Partial<ShoppingItem>
  ){

    await saveSession({
      ...session,
      items:session.items.map(item=>
        item.id === id
          ? {...item,...changes}
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

  async function deleteItem(
    item:ShoppingItem
  ){

    await saveSession({
      ...session,
      items:session.items.filter(
        current=>current.id !== item.id
      )
    });

    offerUndo(
      [item],
      `${item.name} removed`
    );

  }

  async function restoreRemovedItems(){

    if(!undoRemoval){
      return;
    }

    const action =
      undoRemoval;

    clearUndo();

    await saveSession({
      ...session,
      spent:0,
      items:[
        ...session.items,
        ...action.items
      ]
    });

  }

  async function changeQuantity(
    item:ShoppingItem,
    change:number
  ){

    const currentSession =
      sessionRef.current;

    const currentItem =
      currentSession.items.find(
        candidate=>candidate.id === item.id
      );

    if(!currentItem){
      return;
    }

    const quantity =
      Math.max(
        1,
        getQuantity(currentItem) + change
      );

    await saveSession({
      ...currentSession,
      items:currentSession.items.map(
        candidate=>
          candidate.id === item.id
            ? {...candidate,quantity}
            : candidate
      )
    });

  }

  async function addQuickItem(){

    const cleanName =
      quickItem.trim();

    if(!cleanName){
      return;
    }

    const existingItem =
      session.items.find(item=>
        item.name
          .trim()
          .toLowerCase()
        ===
        cleanName.toLowerCase()
      );

    let message = "";

    if(existingItem){

      const nextQuantity =
        getQuantity(existingItem) + 1;

      await saveSession({
        ...session,
        items:session.items.map(item=>
          item.id === existingItem.id
            ? {
                ...item,
                quantity:nextQuantity
              }
            : item
        )
      });

      message =
        `${existingItem.name} quantity increased to ${nextQuantity}`;

    }
    else{

      await saveSession({
        ...session,
        items:[
          ...session.items,
          {
            id:`${Date.now()}-${Math.random()}`,
            name:cleanName,
            price:0,
            purchased:false,
            quantity:1,
            category:categoryForName(cleanName)
          }
        ]
      });

      message =
        `${cleanName} added to your list`;

    }

    setQuickItem("");
    Keyboard.dismiss();
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


  function confirmDelete(
    item:ShoppingItem
  ){

    Alert.alert(
      "Delete Item",
      `Delete ${item.name}?`,
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Delete",
          style:"destructive",
          onPress:()=>deleteItem(item)
        }
      ]
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


  function openEdit(
    item:ShoppingItem
  ){

    router.push({
      pathname:"/editShoppingItem",
      params:{id:item.id}
    });

  }


  function confirmRemoveSelected(){

    const purchasedCount =
      session.items.filter(
        item=>item.purchased
      ).length;

    if(purchasedCount === 0){

      Alert.alert(
        "Nothing Selected",
        "Tick the items you want to remove."
      );

      return;

    }

    Alert.alert(
      "Remove Selected",
      `Remove ${purchasedCount} selected item${purchasedCount === 1 ? "" : "s"} and their cost from your current list?`,
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Remove Selected",
          onPress:removeSelected
        }
      ]
    );

  }


  async function removeSelected(){

    const removedItems =
      session.items.filter(
        item=>item.purchased
      );

    const remainingItems =
      session.items.filter(
        item=>!item.purchased
      );

    await saveSession({
      ...session,
      spent:0,
      items:remainingItems
    });

    offerUndo(
      removedItems,
      `${removedItems.length} collected item${removedItems.length === 1 ? "" : "s"} removed`
    );

  }


  function confirmClearAll(){

    Alert.alert(
      "Clear All / New Budget",
      "Remove every item and reset the budget and total for a completely new shopping trip?",
      [
        {
          text:"Cancel",
          style:"cancel"
        },
        {
          text:"Clear All",
          style:"destructive",
          onPress:clearAll
        }
      ]
    );

  }


  async function clearAll(){

    clearUndo();

    await saveSession({
      budget:0,
      spent:0,
      items:[]
    });

    Alert.alert(
      "Ready For A New Trip",
      "Everything has been cleared. Return Home to enter a new budget."
    );

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

        if(
          listFilter === "all"
          &&
          a.purchased !== b.purchased
        ){
          return a.purchased ? 1 : -1;
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
        Number(item.price || 0)
        *
        getQuantity(item),
      0
    );

  const remaining =
    session.budget - total;

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
          <ScrollView
            style={styles.previewListScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
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
                    onPress={()=>updateItem(
                      item.id,
                      {purchased:!item.purchased}
                    )}
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
                    </Text>
                    <Text style={[
                      styles.previewPrice,
                      Number(item.price || 0) <= 0
                      && styles.previewNeedsPrice
                    ]}>
                      {Number(item.price || 0) > 0
                        ? `$${Number(item.price).toFixed(2)} each  •  $${(
                            Number(item.price)
                            *
                            getQuantity(item)
                          ).toFixed(2)} total`
                        : "Price not added yet"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.previewFavourite}
                    onPress={()=>toggleFavourite(item)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isFavourite(item)
                        ? `Remove ${item.name} from favourites`
                        : `Save ${item.name} as a favourite`
                    }
                  >
                    <Ionicons
                      name={isFavourite(item) ? "star" : "star-outline"}
                      size={20}
                      color={isFavourite(item) ? "#D99500" : "#90A497"}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.previewControlsRow}>
                  <Text style={styles.previewQuantityLabel}>Quantity</Text>
                  <TouchableOpacity
                    style={styles.previewQuantityButton}
                    onPress={()=>changeQuantity(item,-1)}
                    disabled={getQuantity(item) === 1}
                  >
                    <Ionicons
                      name="remove"
                      size={17}
                      color={
                        getQuantity(item) === 1
                          ? "#B8C6BB"
                          : "#2E7D32"
                      }
                    />
                  </TouchableOpacity>
                  <View style={styles.previewQuantity}>
                    <Text style={styles.previewQuantityText}>
                      {getQuantity(item)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.previewQuantityButton}
                    onPress={()=>changeQuantity(item,1)}
                  >
                    <Ionicons name="add" size={17} color="#2E7D32" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
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

    <View
      style={[
        styles.screen,
        {
          paddingBottom:
            Math.max(insets.bottom,16)
        }
      ]}
    >

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={()=>router.back()}
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
                  : "Shopping List"}
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

        {isOverview && (
        <TouchableOpacity
          style={[
            styles.toolsButton,
            toolsVisible && styles.toolsButtonActive
          ]}
          onPress={toggleTools}
          accessibilityRole="button"
          accessibilityLabel="Open shopping list tools"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color="#2E7D32"
          />
          <Text style={styles.toolsButtonText}>
            {toolsVisible ? "Hide Tools" : "Tools"}
          </Text>
        </TouchableOpacity>
        )}

      </View>

      {isOverview && (
      <>
      {showToolsHint && !toolsVisible && (
        <View style={styles.toolsHint}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#2E7D32"
          />
          <Text style={styles.toolsHintText}>
            Use Tools for list views and favourites.
          </Text>
        </View>
      )}

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

      {toolsVisible && !!favourites.length && (
        <View style={styles.favouritesCard}>
          <View style={styles.favouritesHeader}>
            <Ionicons
              name="star"
              size={17}
              color="#D99500"
            />
            <Text style={styles.favouritesTitle}>
              Favourites
            </Text>
            <Text style={styles.favouritesHint}>
              Tap to add
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favouritesList}
          >
            {favourites.map(favourite=>(
              <View
                key={
                  favourite.barcode
                  ||
                  favourite.name.toLowerCase()
                }
                style={styles.favouriteChip}
              >
                <TouchableOpacity
                  style={styles.favouriteAddArea}
                  onPress={()=>
                    addFavouriteToList(favourite)
                  }
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={17}
                    color="#2E7D32"
                  />
                  <Text
                    style={styles.favouriteName}
                    numberOfLines={1}
                  >
                    {favourite.name}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.favouriteRemove}
                  onPress={()=>
                    removeFavourite(favourite)
                  }
                  accessibilityLabel={
                    `Remove ${favourite.name} from favourites`
                  }
                >
                  <Ionicons
                    name="close"
                    size={15}
                    color="#78907D"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>BUDGET</Text>
          <Text style={styles.summaryValue}>
            ${session.budget.toFixed(2)}
          </Text>
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
            Trip progress
          </Text>
          <Text style={styles.progressValue}>
            {progressPercent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {width:`${progressPercent}%`}
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
        onPress={shareShoppingList}
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
        onPress={sendShopWithEzzList}
        accessibilityRole="button"
        accessibilityLabel="Send list to another ShopWithEzz user"
      >
        <View style={styles.shareListIcon}>
          <Ionicons
            name="phone-portrait-outline"
            size={18}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.shareListDetails}>
          <Text style={styles.shareListTitle}>
            Send to ShopWithEzz
          </Text>
          <Text style={styles.shareListHint}>
            They can open and import the full list
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
      <FlatList
        data={filteredItems}
        keyExtractor={item=>item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredItems.length
            ? styles.list
            : styles.emptyList
        }
        renderItem={({item})=>(

          <View
            style={[
              styles.itemCard,
              Number(item.price || 0) > 0
                &&
              styles.pricedCard,
              item.purchased && styles.purchasedCard
            ]}
          >
            <TouchableOpacity
              onPress={()=>updateItem(
                item.id,
                {purchased:!item.purchased}
              )}
            >
              <Text style={styles.checkbox}>
                {item.purchased ? "☑️" : "☐"}
              </Text>
            </TouchableOpacity>

            <View style={styles.itemDetails}>
              <TouchableOpacity
                onPress={()=>openEdit(item)}
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
                    ? `$${Number(item.price).toFixed(2)} each  •  $${(Number(item.price) * getQuantity(item)).toFixed(2)} total`
                    : "Price not added yet"}
                </Text>
              </TouchableOpacity>

              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={()=>changeQuantity(item,-1)}
                  disabled={getQuantity(item) === 1}
                >
                  <Ionicons
                    name="remove"
                    size={17}
                    color={
                      getQuantity(item) === 1
                        ? "#B8C6BB"
                        : "#2E7D32"
                    }
                  />
                </TouchableOpacity>

                <View style={styles.quantityValue}>
                  <Text style={styles.quantityNumber}>
                    {getQuantity(item)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={()=>changeQuantity(item,1)}
                >
                  <Ionicons
                    name="add"
                    size={17}
                    color="#2E7D32"
                  />
                </TouchableOpacity>

                <Text style={styles.quantityLabel}>
                  quantity
                </Text>
              </View>

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

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.favouriteButton}
                onPress={()=>toggleFavourite(item)}
                accessibilityRole="button"
                accessibilityLabel={
                  isFavourite(item)
                    ? `Remove ${item.name} from favourites`
                    : `Save ${item.name} as a favourite`
                }
              >
                <Ionicons
                  name={
                    isFavourite(item)
                      ? "star"
                      : "star-outline"
                  }
                  size={17}
                  color={
                    isFavourite(item)
                      ? "#D99500"
                      : "#90A497"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={()=>openEdit(item)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Ionicons name="pencil-outline" size={16} color="#2E7D32" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={()=>confirmDelete(item)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Ionicons name="trash-outline" size={16} color="#C45C58" />
              </TouchableOpacity>
            </View>
          </View>

        )}
        ListEmptyComponent={
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
        }
      />
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

      <TouchableOpacity
        style={styles.finishButton}
        onPress={confirmRemoveSelected}
      >
        <Text style={styles.finishText}>
          ✓ Remove Selected
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.clearAllButton}
        onPress={confirmClearAll}
      >
        <Text style={styles.clearAllText}>
          Clear All / New Budget
        </Text>
      </TouchableOpacity>
      </>
      )}

    </View>

  );

}


const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#FBF7F2",paddingHorizontal:18,paddingTop:46,paddingBottom:18},
  header:{flexDirection:"row",alignItems:"center"},
  backButton:{width:46,height:46,borderRadius:15,backgroundColor:"#E6EEE2",alignItems:"center",justifyContent:"center"},
  backText:{marginTop:-4,fontSize:38,color:"#1B5E20"},
  headerDetails:{flex:1,marginLeft:12},
  title:{fontSize:25,fontWeight:"900",color:"#173B25"},
  subtitle:{marginTop:2,fontSize:11,fontWeight:"700",color:"#78907D"},
  toolsButton:{height:42,paddingHorizontal:11,borderRadius:14,backgroundColor:"#EDF5ED",borderWidth:1,borderColor:"#D5E5D7",flexDirection:"row",alignItems:"center",justifyContent:"center"},
  toolsButtonActive:{backgroundColor:"#DDF0DF",borderColor:"#9BC7A0"},
  toolsButtonText:{marginLeft:5,fontSize:10,fontWeight:"900",color:"#2E7D32"},
  toolsHint:{marginTop:8,paddingVertical:8,paddingHorizontal:10,borderRadius:11,backgroundColor:"#EDF7EE",flexDirection:"row",alignItems:"center"},
  toolsHintText:{flex:1,marginLeft:7,fontSize:10,fontWeight:"700",color:"#4C6853"},
  quickAddRow:{marginTop:15,flexDirection:"row",alignItems:"center"},
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
  favouritesCard:{marginTop:9,paddingTop:10,paddingBottom:9,borderRadius:15,backgroundColor:"#FFF9E8",borderWidth:1,borderColor:"#F2DFA9"},
  favouritesHeader:{paddingHorizontal:11,flexDirection:"row",alignItems:"center"},
  favouritesTitle:{marginLeft:6,fontSize:11,fontWeight:"900",color:"#6E5213"},
  favouritesHint:{flex:1,textAlign:"right",fontSize:9,fontWeight:"700",color:"#9B8550"},
  favouritesList:{paddingTop:8,paddingHorizontal:8},
  favouriteChip:{marginRight:7,height:36,borderRadius:11,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E8D59F",flexDirection:"row",alignItems:"center"},
  favouriteAddArea:{maxWidth:165,height:"100%",paddingLeft:9,flexDirection:"row",alignItems:"center"},
  favouriteName:{marginLeft:5,maxWidth:115,fontSize:11,fontWeight:"800",color:"#4B5D50"},
  favouriteRemove:{width:31,height:"100%",alignItems:"center",justifyContent:"center"},
  summaryCard:{marginTop:9,paddingVertical:10,paddingHorizontal:5,borderRadius:16,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#EEE7E0",flexDirection:"row",alignItems:"center"},
  summary:{flex:1,alignItems:"center"},
  summaryLabel:{fontSize:9,fontWeight:"900",color:"#9A8980"},
  summaryValue:{marginTop:4,fontSize:16,fontWeight:"900",color:"#463E3B"},
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
  previewListScroll:{maxHeight:400},
  previewRow:{marginBottom:5,paddingHorizontal:9,paddingVertical:5,borderRadius:12,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E9E3DE"},
  previewRowPriced:{backgroundColor:"#E8F2E5",borderColor:"#D4E3D0"},
  previewRowCollected:{backgroundColor:"#DFE9DB",borderColor:"#CBDCC6"},
  previewMainRow:{minHeight:40,flexDirection:"row",alignItems:"center"},
  previewCheckbox:{width:38,alignItems:"flex-start",justifyContent:"center"},
  previewDetails:{flex:1,paddingVertical:3},
  previewName:{fontSize:17,fontWeight:"900",color:"#34433A"},
  previewNameCollected:{textDecorationLine:"line-through",color:"#91A095"},
  previewPrice:{marginTop:2,fontSize:13,fontWeight:"700",color:"#607D6B"},
  previewNeedsPrice:{color:"#A16D62"},
  previewAddPrice:{height:32,marginRight:5,paddingHorizontal:9,borderRadius:10,backgroundColor:"#7B8F75",alignItems:"center",justifyContent:"center"},
  previewAddPriceText:{fontSize:11,fontWeight:"900",color:"#FFFFFF"},
  previewFavourite:{width:36,height:36,borderRadius:11,backgroundColor:"rgba(255,255,255,0.72)",alignItems:"center",justifyContent:"center"},
  previewControlsRow:{paddingTop:3,borderTopWidth:1,borderTopColor:"rgba(120,144,125,0.18)",flexDirection:"row",alignItems:"center",justifyContent:"flex-end"},
  previewQuantityLabel:{flex:1,fontSize:11,fontWeight:"800",color:"#78907D"},
  previewQuantityButton:{width:32,height:32,borderRadius:10,backgroundColor:"rgba(255,255,255,0.78)",borderWidth:1,borderColor:"#D4E0D0",alignItems:"center",justifyContent:"center"},
  previewQuantity:{minWidth:38,height:32,alignItems:"center",justifyContent:"center"},
  previewQuantityText:{fontSize:13,fontWeight:"900",color:"#607D6B"},
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
  itemCard:{marginBottom:5,paddingVertical:6,paddingHorizontal:9,borderRadius:14,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E1EBE2",flexDirection:"row",alignItems:"center",elevation:1},
  pricedCard:{backgroundColor:"#E8F5E9",borderColor:"#C8E6C9"},
  purchasedCard:{backgroundColor:"#DCEDC8",borderColor:"#AED581"},
  checkbox:{fontSize:20},
  itemDetails:{flex:1,marginLeft:8,marginRight:6},
  itemName:{fontSize:16,fontWeight:"900",color:"#263238"},
  purchasedName:{textDecorationLine:"line-through",color:"#90A4AE"},
  itemPrice:{marginTop:3,fontSize:12,fontWeight:"700",color:"#607D6B"},
  quantityRow:{marginTop:6,flexDirection:"row",alignItems:"center"},
  quantityButton:{width:27,height:27,borderRadius:9,backgroundColor:"#F0F7F0",borderWidth:1,borderColor:"#CFE1D1",alignItems:"center",justifyContent:"center"},
  quantityValue:{minWidth:30,height:27,alignItems:"center",justifyContent:"center"},
  quantityNumber:{fontSize:13,fontWeight:"900",color:"#173B25"},
  quantityLabel:{marginLeft:5,fontSize:9,fontWeight:"700",color:"#78907D"},
  barcodeRow:{marginTop:5,flexDirection:"row",alignItems:"center"},
  barcodeText:{marginLeft:5,fontSize:10,fontWeight:"700",color:"#607D6B"},
  itemActions:{width:32,alignItems:"center"},
  favouriteButton:{width:30,height:30,borderRadius:9,backgroundColor:"#FFF9E8",alignItems:"center",justifyContent:"center"},
  editButton:{width:30,height:30,marginTop:4,borderRadius:9,backgroundColor:"#E8F5E9",alignItems:"center",justifyContent:"center"},
  deleteButton:{width:30,height:30,marginTop:4,borderRadius:9,backgroundColor:"#FFF0EF",alignItems:"center",justifyContent:"center"},
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
  finishButton:{paddingVertical:15,borderRadius:18,backgroundColor:"#2E7D32",alignItems:"center",elevation:4},
  finishText:{fontSize:16,fontWeight:"900",color:"#FFFFFF"},
  clearAllButton:{marginTop:8,paddingVertical:11,borderRadius:15,backgroundColor:"#FFEBEE",borderWidth:1,borderColor:"#FFCDD2",alignItems:"center"},
  clearAllText:{fontSize:13,fontWeight:"900",color:"#C62828"}
});

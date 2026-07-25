import React, {
  useCallback,
  useRef,
  useState
} from "react";

import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import {
  useFocusEffect,
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
  categoryForName,
  normaliseCategory,
  ShoppingCategory
} from "../constants/shoppingCategories";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";

const FAVOURITES_KEY =
  "shopwithezz-shopping-favourites-v1";


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

type FavouriteItem = {
  name:string;
  price:number;
  barcode?:string;
  category?:ShoppingCategory;
};


const EMPTY_SESSION:ShoppingSession = {
  budget:0,
  spent:0,
  items:[]
};


function getQuantity(
  item:ShoppingItem
){

  return Math.max(
    1,
    Math.floor(
      Number(item.quantity || 1)
    )
  );

}


function matchesFavourite(
  item:{
    name:string;
    barcode?:string;
  },
  favourite:FavouriteItem
){

  if(
    item.barcode
    &&
    favourite.barcode
  ){

    return (
      item.barcode
      ===
      favourite.barcode
    );

  }

  return (
    item.name
      .trim()
      .toLowerCase()
    ===
    favourite.name
      .trim()
      .toLowerCase()
  );

}


export default function FavouritesScreen(){

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [session,setSession] =
    useState<ShoppingSession>(
      EMPTY_SESSION
    );

  const sessionRef =
    useRef<ShoppingSession>(
      EMPTY_SESSION
    );

  const [favourites,setFavourites] =
    useState<FavouriteItem[]>([]);

  const [message,setMessage] =
    useState("");

  const messageTimer =
    useRef<
      ReturnType<typeof setTimeout>
      |
      null
    >(null);


  useFocusEffect(

    useCallback(()=>{

      loadData();

      return ()=>{

        if(messageTimer.current){

          clearTimeout(
            messageTimer.current
          );

          messageTimer.current = null;

        }

      };

    },[])

  );


  async function loadData(){

    try{

      const [
        savedSession,
        savedFavourites
      ] =
        await Promise.all([
          AsyncStorage.getItem(
            SESSION_KEY
          ),
          AsyncStorage.getItem(
            FAVOURITES_KEY
          )
        ]);

      if(savedSession){

        const parsedSession =
          JSON.parse(savedSession);

        const nextSession:ShoppingSession = {
          ...parsedSession,
          spent:0,
          items:Array.isArray(parsedSession.items)
            ? parsedSession.items
            : []
        };

        sessionRef.current =
          nextSession;

        setSession(nextSession);

      }
      else{

        sessionRef.current =
          EMPTY_SESSION;

        setSession(
          EMPTY_SESSION
        );

      }

      if(savedFavourites){

        const parsedFavourites =
          JSON.parse(savedFavourites);

        if(Array.isArray(parsedFavourites)){

          setFavourites(
            parsedFavourites
          );

        }
        else{

          setFavourites([]);

        }

      }
      else{

        setFavourites([]);

      }

    }
    catch(error){

      Alert.alert(
        "Loading Error",
        "Your favourites could not be loaded."
      );

    }

  }


  function showMessage(
    nextMessage:string
  ){

    setMessage(nextMessage);

    if(messageTimer.current){

      clearTimeout(
        messageTimer.current
      );

    }

    messageTimer.current =
      setTimeout(
        ()=>{

          setMessage("");
          messageTimer.current = null;

        },
        2300
      );

  }


  async function saveSession(
    nextSession:ShoppingSession
  ){

    try{

      sessionRef.current =
        nextSession;

      setSession(nextSession);

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextSession)
      );

    }
    catch(error){

      Alert.alert(
        "Saving Error",
        "The item could not be added to your shopping list."
      );

    }

  }


  async function saveFavourites(
    nextFavourites:FavouriteItem[]
  ){

    try{

      setFavourites(
        nextFavourites
      );

      await AsyncStorage.setItem(
        FAVOURITES_KEY,
        JSON.stringify(nextFavourites)
      );

    }
    catch(error){

      Alert.alert(
        "Saving Error",
        "Your favourites could not be updated."
      );

    }

  }


  async function addFavouriteToList(
    favourite:FavouriteItem
  ){

    const currentSession =
      sessionRef.current;

    const existingItem =
      currentSession.items.find(
        item=>
          matchesFavourite(
            item,
            favourite
          )
      );

    if(existingItem){

      const nextQuantity =
        getQuantity(existingItem)
        +
        1;

      const nextSession:ShoppingSession = {
        ...currentSession,
        spent:0,
        items:currentSession.items.map(
          item=>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity:nextQuantity,
                  purchased:false
                }
              : item
        )
      };

      await saveSession(
        nextSession
      );

      showMessage(
        `${existingItem.name} quantity increased to ${nextQuantity}`
      );

      return;

    }

    const cleanName =
      favourite.name.trim();

    const nextSession:ShoppingSession = {
      ...currentSession,
      spent:0,
      items:[
        ...currentSession.items,
        {
          id:
            `${Date.now()}-${Math.random()}`,
          name:cleanName,
          price:Number(
            favourite.price || 0
          ),
          barcode:
            favourite.barcode,
          category:
            normaliseCategory(
              favourite.category,
              cleanName
            )
            ||
            categoryForName(cleanName),
          purchased:false,
          quantity:1
        }
      ]
    };

    await saveSession(
      nextSession
    );

    showMessage(
      `${cleanName} added to your shopping list`
    );

  }


  function confirmRemoveFavourite(
    favourite:FavouriteItem
  ){

    Alert.alert(
      "Remove Favourite",
      `Remove ${favourite.name} from your favourites?`,
      [
        {
          text:"Cancel",
          style:"cancel"
        },
        {
          text:"Remove",
          style:"destructive",
          onPress:()=>
            removeFavourite(favourite)
        }
      ]
    );

  }


  async function removeFavourite(
    favourite:FavouriteItem
  ){

    const nextFavourites =
      favourites.filter(
        current=>
          !matchesFavourite(
            current,
            favourite
          )
      );

    await saveFavourites(
      nextFavourites
    );

    showMessage(
      `${favourite.name} removed from favourites`
    );

  }


  function getListQuantity(
    favourite:FavouriteItem
  ){

    const matchingItem =
      session.items.find(
        item=>
          matchesFavourite(
            item,
            favourite
          )
      );

    return matchingItem
      ? getQuantity(matchingItem)
      : 0;

  }


  const sortedFavourites =
    [...favourites].sort(
      (a,b)=>
        a.name.localeCompare(
          b.name
        )
    );


  return(

    <View
      style={[
        styles.screen,
        {
          paddingTop:
            Math.max(
              insets.top,
              20
            ),
          paddingBottom:
            Math.max(
              insets.bottom,
              16
            )
        }
      ]}
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
            size={25}
            color="#536650"
          />

        </TouchableOpacity>

        <View style={styles.headerText}>

          <Text style={styles.eyebrow}>
            SAVED SHOPPING ITEMS
          </Text>

          <Text style={styles.title}>
            Favourites
          </Text>

          <Text style={styles.subtitle}>
            Tap an item to add it to your list
          </Text>

        </View>

        <View style={styles.starHeader}>

          <Ionicons
            name="star"
            size={23}
            color="#D99500"
          />

        </View>

      </View>


      {!!message && (

        <View style={styles.messageCard}>

          <Ionicons
            name="checkmark-circle"
            size={19}
            color="#2E7D32"
          />

          <Text
            style={styles.messageText}
            numberOfLines={2}
          >
            {message}
          </Text>

        </View>

      )}


      <View style={styles.summaryCard}>

        <View style={styles.summaryIcon}>

          <Ionicons
            name="star"
            size={22}
            color="#D99500"
          />

        </View>

        <View style={styles.summaryDetails}>

          <Text style={styles.summaryNumber}>
            {favourites.length}
          </Text>

          <Text style={styles.summaryText}>
            saved favourite
            {favourites.length === 1
              ? ""
              : "s"}
          </Text>

        </View>

        <TouchableOpacity
          style={styles.openListButton}
          onPress={()=>
            router.push("/shoppingList")
          }
          accessibilityRole="button"
          accessibilityLabel="Open shopping list"
        >

          <Text style={styles.openListText}>
            View List
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color="#FFFFFF"
          />

        </TouchableOpacity>

      </View>


      <FlatList
        data={sortedFavourites}
        keyExtractor={
          (item,index)=>
            item.barcode
            ||
            `${item.name.toLowerCase()}-${index}`
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          sortedFavourites.length
            ? styles.listContent
            : styles.emptyListContent
        }
        renderItem={({item})=>{

          const listQuantity =
            getListQuantity(item);

          return(

            <View style={styles.favouriteCard}>

              <TouchableOpacity
                style={styles.favouriteMain}
                onPress={()=>
                  addFavouriteToList(item)
                }
                activeOpacity={0.84}
                accessibilityRole="button"
                accessibilityLabel={
                  `Add ${item.name} to shopping list`
                }
              >

                <View style={styles.itemIconBox}>

                  <Ionicons
                    name="basket-outline"
                    size={24}
                    color="#657B60"
                  />

                </View>

                <View style={styles.itemDetails}>

                  <Text
                    style={styles.itemName}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                  <Text style={styles.itemPrice}>

                    {
                      Number(item.price || 0) > 0
                        ? `$${Number(item.price).toFixed(2)} each`
                        : "Price not added"
                    }

                  </Text>

                  {
                    listQuantity > 0
                    &&
                    (
                      <View style={styles.onListPill}>

                        <Ionicons
                          name="checkmark"
                          size={13}
                          color="#2E7D32"
                        />

                        <Text style={styles.onListText}>
                          {listQuantity} currently on list
                        </Text>

                      </View>
                    )
                  }

                </View>

                <View style={styles.addButton}>

                  <Ionicons
                    name="add"
                    size={24}
                    color="#FFFFFF"
                  />

                </View>

              </TouchableOpacity>

              <View style={styles.cardDivider} />

              <View style={styles.cardBottom}>

                <View style={styles.savedLabel}>

                  <Ionicons
                    name="star"
                    size={15}
                    color="#D99500"
                  />

                  <Text style={styles.savedLabelText}>
                    Saved favourite
                  </Text>

                </View>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={()=>
                    confirmRemoveFavourite(item)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    `Remove ${item.name} from favourites`
                  }
                >

                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color="#C45C58"
                  />

                  <Text style={styles.removeText}>
                    Remove
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          );

        }}
        ListEmptyComponent={

          <View style={styles.emptyCard}>

            <View style={styles.emptyIconBox}>

              <Ionicons
                name="star-outline"
                size={48}
                color="#D7B96D"
              />

            </View>

            <Text style={styles.emptyTitle}>
              No favourites saved yet
            </Text>

            <Text style={styles.emptyText}>
              Open your shopping list and tap the star beside an item to save it here.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={()=>
                router.push("/shoppingList")
              }
              activeOpacity={0.84}
            >

              <Ionicons
                name="bag-handle-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                Open Shopping List
              </Text>

            </TouchableOpacity>

          </View>

        }
      />

    </View>

  );

}


const styles = StyleSheet.create({

  screen:{
    flex:1,
    paddingHorizontal:18,
    backgroundColor:"#FBF7F2"
  },

  header:{
    minHeight:70,
    flexDirection:"row",
    alignItems:"center"
  },

  backButton:{
    width:46,
    height:46,
    borderRadius:15,
    backgroundColor:"#E6EEE2",
    borderWidth:1,
    borderColor:"#D4E0D0",
    alignItems:"center",
    justifyContent:"center"
  },

  headerText:{
    flex:1,
    marginLeft:12
  },

  eyebrow:{
    fontSize:8,
    fontWeight:"900",
    letterSpacing:1.1,
    color:"#A28E83"
  },

  title:{
    marginTop:2,
    fontSize:26,
    fontWeight:"900",
    letterSpacing:-0.5,
    color:"#3E4B3C"
  },

  subtitle:{
    marginTop:2,
    fontSize:10,
    fontWeight:"700",
    color:"#78907D"
  },

  starHeader:{
    width:42,
    height:42,
    borderRadius:14,
    backgroundColor:"#FFF4D6",
    borderWidth:1,
    borderColor:"#F0D99A",
    alignItems:"center",
    justifyContent:"center"
  },

  messageCard:{
    marginTop:8,
    paddingVertical:10,
    paddingHorizontal:12,
    borderRadius:14,
    backgroundColor:"#E8F5E9",
    borderWidth:1,
    borderColor:"#C8E6C9",
    flexDirection:"row",
    alignItems:"center"
  },

  messageText:{
    flex:1,
    marginLeft:8,
    fontSize:11,
    lineHeight:16,
    fontWeight:"800",
    color:"#2E7D32"
  },

  summaryCard:{
    marginTop:12,
    padding:13,
    borderRadius:20,
    backgroundColor:"#F7EFE2",
    borderWidth:1,
    borderColor:"#E9DBC6",
    flexDirection:"row",
    alignItems:"center"
  },

  summaryIcon:{
    width:48,
    height:48,
    borderRadius:16,
    backgroundColor:"#FFFFFF",
    alignItems:"center",
    justifyContent:"center"
  },

  summaryDetails:{
    flex:1,
    marginLeft:12
  },

  summaryNumber:{
    fontSize:22,
    fontWeight:"900",
    color:"#574A3F"
  },

  summaryText:{
    marginTop:1,
    fontSize:10,
    fontWeight:"700",
    color:"#8B755F"
  },

  openListButton:{
    height:39,
    paddingHorizontal:13,
    borderRadius:13,
    backgroundColor:"#7B8F75",
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  openListText:{
    marginRight:5,
    fontSize:10,
    fontWeight:"900",
    color:"#FFFFFF"
  },

  listContent:{
    paddingTop:12,
    paddingBottom:22
  },

  emptyListContent:{
    flexGrow:1,
    justifyContent:"center",
    paddingBottom:40
  },

  favouriteCard:{
    marginBottom:10,
    borderRadius:20,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#EEE7E0",
    overflow:"hidden",
    shadowColor:"#8A7769",
    shadowOffset:{
      width:0,
      height:4
    },
    shadowOpacity:0.06,
    shadowRadius:9,
    elevation:2
  },

  favouriteMain:{
    minHeight:94,
    padding:13,
    flexDirection:"row",
    alignItems:"center"
  },

  itemIconBox:{
    width:50,
    height:50,
    borderRadius:17,
    backgroundColor:"#E6EEE2",
    alignItems:"center",
    justifyContent:"center"
  },

  itemDetails:{
    flex:1,
    marginHorizontal:12
  },

  itemName:{
    fontSize:17,
    lineHeight:21,
    fontWeight:"900",
    color:"#3E4B3C"
  },

  itemPrice:{
    marginTop:4,
    fontSize:11,
    fontWeight:"700",
    color:"#806E67"
  },

  onListPill:{
    alignSelf:"flex-start",
    marginTop:7,
    paddingVertical:4,
    paddingHorizontal:7,
    borderRadius:9,
    backgroundColor:"#E8F5E9",
    flexDirection:"row",
    alignItems:"center"
  },

  onListText:{
    marginLeft:3,
    fontSize:8,
    fontWeight:"900",
    color:"#2E7D32"
  },

  addButton:{
    width:43,
    height:43,
    borderRadius:15,
    backgroundColor:"#7B8F75",
    alignItems:"center",
    justifyContent:"center"
  },

  cardDivider:{
    height:1,
    marginHorizontal:13,
    backgroundColor:"#F1EBE6"
  },

  cardBottom:{
    minHeight:43,
    paddingHorizontal:13,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between"
  },

  savedLabel:{
    flexDirection:"row",
    alignItems:"center"
  },

  savedLabelText:{
    marginLeft:5,
    fontSize:9,
    fontWeight:"800",
    color:"#8B755F"
  },

  removeButton:{
    height:31,
    paddingHorizontal:9,
    borderRadius:10,
    backgroundColor:"#FFF0EF",
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  removeText:{
    marginLeft:4,
    fontSize:9,
    fontWeight:"900",
    color:"#C45C58"
  },

  emptyCard:{
    paddingHorizontal:26,
    alignItems:"center"
  },

  emptyIconBox:{
    width:88,
    height:88,
    borderRadius:30,
    backgroundColor:"#FFF4D6",
    borderWidth:1,
    borderColor:"#F0D99A",
    alignItems:"center",
    justifyContent:"center"
  },

  emptyTitle:{
    marginTop:18,
    fontSize:22,
    fontWeight:"900",
    color:"#3E4B3C",
    textAlign:"center"
  },

  emptyText:{
    marginTop:8,
    maxWidth:290,
    fontSize:12,
    lineHeight:19,
    fontWeight:"600",
    color:"#806E67",
    textAlign:"center"
  },

  emptyButton:{
    marginTop:20,
    height:48,
    paddingHorizontal:18,
    borderRadius:16,
    backgroundColor:"#7B8F75",
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  emptyButtonText:{
    marginLeft:7,
    fontSize:12,
    fontWeight:"900",
    color:"#FFFFFF"
  }

});
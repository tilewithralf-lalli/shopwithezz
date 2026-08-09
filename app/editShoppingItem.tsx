import React, {
  useCallback,
  useState
} from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter
} from "expo-router";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  useSafeAreaInsets
} from "react-native-safe-area-context";

import {
  ShoppingCategory
} from "../constants/shoppingCategories";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";


type ShoppingItem = {
  id:string;
  name:string;
  price:number;
  purchased:boolean;
  quantity?:number;
  category?:ShoppingCategory;
};

type ShoppingSession = {
  budget:number;
  spent?:number;
  items:ShoppingItem[];
};


export default function EditShoppingItemScreen(){

  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const itemId =
    Array.isArray(params.id)
      ? params.id[0]
      : String(params.id || "");

  const [session,setSession] =
    useState<ShoppingSession>({
      budget:0,
      spent:0,
      items:[]
    });

  const [name,setName] =
    useState("");

  const [price,setPrice] =
    useState("");

  const [quantity,setQuantity] =
    useState("1");

  const [loaded,setLoaded] =
    useState(false);


  useFocusEffect(

    useCallback(()=>{

      loadItem();

    },[itemId])

  );


  async function loadItem(){

    try{

      const saved =
        await AsyncStorage.getItem(
          SESSION_KEY
        );

      if(!saved){

        Alert.alert(
          "Item Not Found",
          "This shopping item could not be found.",
          [
            {
              text:"Back",
              onPress:()=>router.back()
            }
          ]
        );

        return;

      }

      const nextSession:ShoppingSession =
        JSON.parse(saved);

      const item =
        nextSession.items.find(
          current=>current.id === itemId
        );

      if(!item){

        Alert.alert(
          "Item Not Found",
          "This shopping item may have been removed.",
          [
            {
              text:"Back",
              onPress:()=>router.back()
            }
          ]
        );

        return;

      }

      setSession(nextSession);

      setName(item.name);

      setPrice(
        item.price
          ? String(item.price)
          : ""
      );

      setQuantity(
        item.quantity
          ? String(item.quantity)
          : "1"
      );

      setLoaded(true);

    }
    catch(error){

      Alert.alert(
        "Loading Error",
        "This shopping item could not be loaded."
      );

    }

  }


  async function saveChanges(){

    const cleanName =
      name.trim();

    const cleanPrice =
      price
        .replace(",", ".")
        .trim();

    const priceNumber =
      cleanPrice === ""
        ? 0
        : Number(cleanPrice);

    const quantityNumber =
      Math.max(
        1,
        Math.floor(
          Number(quantity || 1)
        )
      );
    if(!cleanName){

      Alert.alert(
        "Item Name",
        "Please enter an item name."
      );

      return;

    }


    if(
      Number.isNaN(priceNumber)
      ||
      priceNumber < 0
    ){

      Alert.alert(
        "Invalid Price",
        "Please enter a valid price."
      );

      return;

    }


    try{

      const nextSession:ShoppingSession = {

        ...session,

        items:
          session.items.map(item=>

            item.id === itemId

              ? {

                  ...item,

                  name:
                    cleanName,

                  price:
                    priceNumber,

                  quantity:
                    quantityNumber

                }

              : item

          )

      };


      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextSession)
      );


      router.back();


    }
    catch(error){

      Alert.alert(
        "Saving Error",
        "Your changes could not be saved."
      );

    }

  }


  function confirmDeleteItem(){

    Alert.alert(
      "Delete Item",
      `Delete ${name.trim() || "this item"} and remove its complete record and price?`,
      [
        {
          text:"Cancel",
          style:"cancel"
        },
        {
          text:"Delete Item",
          style:"destructive",
          onPress:deleteItem
        }
      ]
    );

  }


  async function deleteItem(){

    try{

      const nextSession:ShoppingSession = {

        ...session,

        spent:0,

        items:
          session.items.filter(
            item=>item.id !== itemId
          )

      };


      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextSession)
      );


      router.replace(
        "/shoppingList"
      );


    }
    catch(error){

      Alert.alert(
        "Delete Error",
        "This item could not be deleted."
      );

    }

  }


  function confirmRemoveSelected(){

    const selectedCount =
      session.items.filter(
        item=>item.purchased
      ).length;


    if(selectedCount === 0){

      Alert.alert(
        "Nothing Selected",
        "Tick the items you want to remove first."
      );

      return;

    }


    Alert.alert(
      "Remove Selected",
      `Remove ${selectedCount} selected item${selectedCount === 1 ? "" : "s"} and their complete price records?`,
      [
        {
          text:"Cancel",
          style:"cancel"
        },
        {
          text:"Remove Selected",
          style:"destructive",
          onPress:removeSelected
        }
      ]
    );

  }


  async function removeSelected(){

    try{

      const nextSession:ShoppingSession = {

        ...session,

        spent:0,

        items:
          session.items.filter(
            item=>!item.purchased
          )

      };


      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextSession)
      );


      router.replace(
        "/shoppingList"
      );


    }
    catch(error){

      Alert.alert(
        "Remove Error",
        "The selected items could not be removed."
      );

    }

  }
    function confirmStartNewList(){

    Alert.alert(
      "Start New List",
      "Start a new shopping list? This clears every item and resets the current budget.",
      [
        {
          text:"Cancel",
          style:"cancel"
        },
        {
          text:"Start New List",
          style:"destructive",
          onPress:startNewList
        }
      ]
    );

  }


  async function startNewList(){

    try{

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          budget:0,
          spent:0,
          items:[]
        })
      );


      router.replace(
        "/shoppingList"
      );


    }
    catch(error){

      Alert.alert(
        "Reset Error",
        "A new list could not be started."
      );

    }

  }


  return(

    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >

      <ScrollView

        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              Math.max(
                insets.top,
                24
              ),

            paddingBottom:
              Math.max(
                insets.bottom,
                24
              )
          }
        ]}

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}

      >


        <View style={styles.header}>


          <TouchableOpacity

            style={styles.backButton}

            onPress={()=>router.back()}

          >

            <Text style={styles.backText}>
              ‹
            </Text>


          </TouchableOpacity>


          <View style={styles.headerDetails}>


            <Text style={styles.title}>
              Edit Item
            </Text>


            <Text style={styles.subtitle}>
              Change the details or aisle
            </Text>


          </View>


          <Text style={styles.headerIcon}>
            ✏️
          </Text>


        </View>



        {loaded && (

          <View style={styles.card}>


            <Text style={styles.label}>
              Item Name
            </Text>


            <TextInput

              style={styles.nameInput}

              value={name}

              onChangeText={setName}

              placeholder="Shopping item"

              placeholderTextColor="#90A497"

              autoCapitalize="sentences"

              returnKeyType="next"

              selectTextOnFocus

            />



            <Text style={styles.label}>
              Quantity
            </Text>



            <TextInput

              style={styles.nameInput}

              value={quantity}

              onChangeText={setQuantity}

              placeholder="1"

              placeholderTextColor="#90A497"

              keyboardType="number-pad"

              returnKeyType="done"

              onSubmitEditing={saveChanges}

              selectTextOnFocus

            />



            <Text style={styles.label}>
              Price
            </Text>



            <View style={styles.priceBox}>


              <Text style={styles.dollar}>
                $
              </Text>


              <TextInput

                style={styles.priceInput}

                value={price}

                onChangeText={setPrice}

                placeholder="0.00"

                placeholderTextColor="#90A497"

                keyboardType="decimal-pad"

                returnKeyType="done"

                onSubmitEditing={saveChanges}

                selectTextOnFocus

              />


            </View>



            <Text style={styles.helpText}>
              The total and remaining budget update as soon as you save.
            </Text>



            <TouchableOpacity

              style={styles.saveButton}

              onPress={saveChanges}

              activeOpacity={0.85}

            >

              <Text style={styles.saveText}>
                Save Changes
              </Text>


            </TouchableOpacity>



            <TouchableOpacity

              style={styles.cancelButton}

              onPress={()=>router.back()}

            >

              <Text style={styles.cancelText}>
                Cancel
              </Text>


            </TouchableOpacity>
                        <View style={styles.managementDivider}/>


            <Text style={styles.managementTitle}>
              List Actions
            </Text>



            <TouchableOpacity

              style={styles.deleteItemButton}

              onPress={confirmDeleteItem}

            >

              <Text style={styles.deleteItemText}>
                Delete Item
              </Text>


            </TouchableOpacity>



            <TouchableOpacity

              style={styles.removeSelectedButton}

              onPress={confirmRemoveSelected}

            >

              <Text style={styles.removeSelectedText}>
                Remove Selected
              </Text>


            </TouchableOpacity>



            <TouchableOpacity

              style={styles.startNewButton}

              onPress={confirmStartNewList}

            >

              <Text style={styles.startNewText}>
                Start New List
              </Text>


            </TouchableOpacity>



          </View>

        )}



      </ScrollView>


    </KeyboardAvoidingView>

  );

}



const styles = StyleSheet.create({

  screen:{

    flex:1,

    backgroundColor:"#F3F7F1"

  },


  content:{

    flexGrow:1,

    paddingHorizontal:20

  },


  header:{

    flexDirection:"row",

    alignItems:"center"

  },


  backButton:{

    width:46,

    height:46,

    borderRadius:15,

    backgroundColor:"#E1F1E3",

    alignItems:"center",

    justifyContent:"center"

  },


  backText:{

    marginTop:-4,

    fontSize:38,

    color:"#1B5E20"

  },


  headerDetails:{

    flex:1,

    marginLeft:12

  },


  title:{

    color:"#173B25",

    fontSize:26,

    fontWeight:"900"

  },


  subtitle:{

    marginTop:2,

    color:"#78907D",

    fontSize:12,

    fontWeight:"700"

  },


  headerIcon:{

    fontSize:28

  },


  card:{

    marginTop:24,

    padding:20,

    borderRadius:25,

    backgroundColor:"#FFFFFF",

    borderWidth:1,

    borderColor:"#E1EBE2",

    elevation:4

  },


  label:{

    marginTop:7,

    marginBottom:8,

    color:"#263238",

    fontSize:16,

    fontWeight:"900"

  },


  nameInput:{

    minHeight:58,

    paddingVertical:14,

    paddingHorizontal:15,

    borderRadius:16,

    backgroundColor:"#F3F7F1",

    borderWidth:1,

    borderColor:"#D8E6DA",

    color:"#263238",

    fontSize:18,

    fontWeight:"700"

  },


  priceBox:{

    minHeight:64,

    paddingHorizontal:16,

    borderRadius:16,

    backgroundColor:"#F3F7F1",

    borderWidth:1,

    borderColor:"#D8E6DA",

    flexDirection:"row",

    alignItems:"center"

  },


  dollar:{

    color:"#2E7D32",

    fontSize:25,

    fontWeight:"900"

  },


  priceInput:{

    flex:1,

    paddingVertical:13,

    paddingHorizontal:8,

    color:"#263238",

    fontSize:25,

    fontWeight:"900"

  },


  helpText:{

    marginTop:13,

    color:"#78907D",

    fontSize:12,

    lineHeight:18

  },


  saveButton:{

    marginTop:23,

    paddingVertical:16,

    borderRadius:17,

    backgroundColor:"#2E7D32",

    alignItems:"center",

    elevation:3

  },


  saveText:{

    color:"#FFFFFF",

    fontSize:17,

    fontWeight:"900"

  },


  cancelButton:{

    marginTop:10,

    paddingVertical:13,

    alignItems:"center"

  },


  cancelText:{

    color:"#607D6B",

    fontSize:14,

    fontWeight:"800"

  },
    managementDivider:{

    height:1,

    marginTop:14,

    marginBottom:18,

    backgroundColor:"#E1EBE2"

  },


  managementTitle:{

    marginBottom:10,

    color:"#607D6B",

    fontSize:13,

    fontWeight:"900",

    textTransform:"uppercase",

    letterSpacing:0.7

  },


  deleteItemButton:{

    paddingVertical:14,

    borderRadius:15,

    backgroundColor:"#FFF0EF",

    borderWidth:1,

    borderColor:"#FFCDD2",

    alignItems:"center"

  },


  deleteItemText:{

    color:"#C62828",

    fontSize:15,

    fontWeight:"900"

  },


  removeSelectedButton:{

    marginTop:10,

    paddingVertical:14,

    borderRadius:15,

    backgroundColor:"#FFF7E6",

    borderWidth:1,

    borderColor:"#F2D8A7",

    alignItems:"center"

  },


  removeSelectedText:{

    color:"#8A5A14",

    fontSize:15,

    fontWeight:"900"

  },


  startNewButton:{

    marginTop:10,

    paddingVertical:14,

    borderRadius:15,

    backgroundColor:"#F3F7F1",

    borderWidth:1,

    borderColor:"#D8E6DA",

    alignItems:"center"

  },


  startNewText:{

    color:"#40503F",

    fontSize:15,

    fontWeight:"900"

  }

});

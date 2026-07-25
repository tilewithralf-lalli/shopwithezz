import React, {
  useCallback,
  useState
} from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  useRouter
} from "expo-router";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  Ionicons
} from "@expo/vector-icons";

import {
  ShoppingCategory
} from "../constants/shoppingCategories";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";

const USER_NAME_KEY =
  "shopwithezz-user-name";


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


const EMPTY_SESSION:ShoppingSession = {
  budget:0,
  spent:0,
  items:[]
};


export default function HomeScreen(){

  const router = useRouter();

  const [session,setSession] =
    useState<ShoppingSession>(EMPTY_SESSION);

  const [name,setName] =
    useState("Shopper");

  const [nameInput,setNameInput] =
    useState("Shopper");

  const [nameModalVisible,setNameModalVisible] =
    useState(false);

  const [budgetInput,setBudgetInput] =
    useState("");


  useFocusEffect(

    useCallback(()=>{

      loadHome();

    },[])

  );


  async function loadHome(){

    try{

      const [
        savedSession,
        savedName
      ] =
        await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(USER_NAME_KEY)
        ]);

      const nextSession =
        savedSession
          ? {
              ...JSON.parse(savedSession),
              spent:0
            }
          : EMPTY_SESSION;

      setSession(nextSession);

      setBudgetInput(
        nextSession.budget
          ? String(nextSession.budget)
          : ""
      );

      if(savedName){

        setName(savedName);
        setNameInput(savedName);

      }

    }
    catch(error){

      Alert.alert(
        "Loading Error",
        "Your shopping dashboard could not be loaded."
      );

    }

  }


  function openNameEditor(){

    setNameInput(name);
    setNameModalVisible(true);

  }


  async function saveName(){

    const cleanName =
      nameInput.trim();

    if(!cleanName){

      Alert.alert(
        "Enter Your Name",
        "Please enter the name you would like ShopWithEzz to use."
      );

      return;

    }

    try{

      await AsyncStorage.setItem(
        USER_NAME_KEY,
        cleanName
      );

      setName(cleanName);
      setNameInput(cleanName);
      setNameModalVisible(false);

    }
    catch(error){

      Alert.alert(
        "Saving Error",
        "Your name could not be saved."
      );

    }

  }


  async function saveSession(
    nextSession:ShoppingSession
  ){

    try{

      setSession(nextSession);

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextSession)
      );

    }
    catch(error){

      Alert.alert(
        "Saving Error",
        "Your shopping budget could not be saved."
      );

    }

  }


  async function saveBudget(){

    const value =
      Number(
        budgetInput.replace(",", ".")
      );

    if(
      budgetInput.trim() === ""
      ||
      Number.isNaN(value)
      ||
      value < 0
    ){

      Alert.alert(
        "Invalid Budget",
        "Please enter a valid shopping budget."
      );

      return;

    }

    await saveSession({
      ...session,
      budget:value
    });

    setBudgetInput(String(value));

  }


  const total =
    session.items.reduce(
      (sum,item)=>
        sum
        +
        Number(item.price || 0)
        *
        Math.max(
          1,
          Number(item.quantity || 1)
        ),
      0
    );

  const remaining =
    session.budget - total;

  const purchasedCount =
    session.items.filter(
      item=>item.purchased
    ).length;

  const progress =
    session.items.length
      ? Math.round(
          purchasedCount
          /
          session.items.length
          *
          100
        )
      : 0;


  return(

    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.brandRow}>

          <View style={styles.logoBox}>

            <Ionicons
              name="basket-outline"
              size={25}
              color="#FFFFFF"
            />

          </View>

          <Text style={styles.brand}>
            ShopWithEzz
          </Text>

          <Text style={styles.brandSub}>
            SHOP BEAUTIFULLY · SPEND SMARTER
          </Text>

        </View>


        <View style={styles.greetingCard}>

          <View style={styles.greetingTop}>

            <View style={styles.greetingTextBlock}>

              <Text style={styles.eyebrow}>
                WELCOME BACK
              </Text>

              <Text style={styles.hello}>
                Hi, {name} 👋
              </Text>

            </View>

            <TouchableOpacity
              style={styles.changeNameButton}
              onPress={openNameEditor}
              accessibilityRole="button"
              accessibilityLabel="Change name"
            >

              <Ionicons
                name="pencil-outline"
                size={16}
                color="#6F806A"
              />

            </TouchableOpacity>

          </View>

          <Text style={styles.welcome}>
            Everything you need is ready in one place.
          </Text>

        </View>


        <View style={styles.sectionHeading}>

          <Text style={styles.sectionTitle}>
            Shopping budget
          </Text>

          <Text style={styles.sectionHint}>
            Change it anytime
          </Text>

        </View>


        <View style={styles.budgetRow}>

          <View style={styles.moneyInputBox}>

            <Text style={styles.dollar}>
              $
            </Text>

            <TextInput
              style={styles.moneyInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="0.00"
              placeholderTextColor="#A79A93"
              keyboardType="decimal-pad"
              selectTextOnFocus
            />

          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveBudget}
            activeOpacity={0.84}
          >

            <Text style={styles.saveText}>
              Save
            </Text>

          </TouchableOpacity>

        </View>


        <View style={styles.summaryCard}>

          <View style={styles.summaryHeading}>

            <View>

              <Text style={styles.summaryLabel}>
                CURRENT SHOP
              </Text>

              <Text style={styles.summaryTitle}>
                Your spending
              </Text>

            </View>

            <View
              style={[
                styles.balancePill,
                remaining < 0 &&
                styles.balancePillOver
              ]}
            >

              <Text
                style={[
                  styles.balancePillText,
                  remaining < 0 &&
                  styles.balancePillTextOver
                ]}
              >
                {
                  remaining < 0
                    ? "Over budget"
                    : "On track"
                }
              </Text>

            </View>

          </View>

          <Text style={styles.totalLabel}>
            List total
          </Text>

          <Text style={styles.totalValue}>
            ${total.toFixed(2)}
          </Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryNumbers}>

            <View>

              <Text style={styles.smallLabel}>
                BUDGET
              </Text>

              <Text style={styles.smallValue}>
                ${session.budget.toFixed(2)}
              </Text>

            </View>

            <View style={styles.summaryNumberRight}>

              <Text style={styles.smallLabel}>
                {
                  remaining < 0
                    ? "OVER BY"
                    : "STILL AVAILABLE"
                }
              </Text>

              <Text
                style={[
                  styles.smallValue,
                  styles.remainingValue,
                  remaining < 0 &&
                  styles.overValue
                ]}
              >
                ${Math.abs(remaining).toFixed(2)}
              </Text>

            </View>

          </View>

          <View style={styles.progressTop}>

            <Text style={styles.progressText}>
              {purchasedCount} of {session.items.length} collected
            </Text>

            <Text style={styles.progressPercent}>
              {progress}%
            </Text>

          </View>

          <View style={styles.progressTrack}>

            <View
              style={[
                styles.progressFill,
                {
                  width:`${progress}%` as any
                }
              ]}
            />

          </View>

        </View>


        <TouchableOpacity
          style={styles.listButton}
          onPress={()=>
            router.push("/shoppingList")
          }
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityLabel="Open shopping list"
        >

          <View style={styles.listIconBox}>

            <Ionicons
              name="bag-handle-outline"
              size={25}
              color="#536650"
            />

          </View>

          <View style={styles.listDetails}>

            <Text style={styles.listTitle}>
              Shopping List
            </Text>

            <Text style={styles.listSubtitle}>
              {session.items.length} items · Ready when you are
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color="#536650"
          />

        </TouchableOpacity>


        <View style={styles.quickHeadingRow}>

          <View>

            <Text style={styles.quickEyebrow}>
              QUICK ACCESS
            </Text>

            <Text style={styles.quickHeading}>
              Shopping tools
            </Text>

          </View>

          <Text style={styles.quickHint}>
            One tap away
          </Text>

        </View>


        <View style={styles.quickGrid}>

          <TouchableOpacity
            style={[
              styles.quickCard,
              styles.quickCardLeft,
              styles.favouritesCard
            ]}
            activeOpacity={0.84}
            onPress={()=>
              router.push("/favourites")
            }
            accessibilityRole="button"
            accessibilityLabel="Open favourites"
          >

            <View style={styles.quickIconBox}>

              <Ionicons
                name="star"
                size={25}
                color="#9B7750"
              />

            </View>

            <Text style={styles.quickTitle}>
              Favourites
            </Text>

            <Text style={styles.quickSubtitle}>
              Add your saved items
            </Text>

            <View style={styles.quickArrowBox}>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#9B7750"
              />

            </View>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.quickCard,
              styles.handsFreeCard
            ]}
            activeOpacity={0.84}
            onPress={()=>
              router.push("/handsFree")
            }
            accessibilityRole="button"
            accessibilityLabel="Open Hands-Free"
          >

            <View style={styles.quickIconBox}>

              <Ionicons
                name="mic-outline"
                size={26}
                color="#536650"
              />

            </View>

            <Text style={styles.quickTitle}>
              Hands-Free
            </Text>

            <Text style={styles.quickSubtitle}>
              Control your list by voice
            </Text>

            <View style={styles.quickArrowBox}>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#536650"
              />

            </View>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.quickCard,
              styles.quickCardLeft,
              styles.shareCard
            ]}
            activeOpacity={0.84}
            onPress={()=>
              router.push("/shoppingList")
            }
            accessibilityRole="button"
            accessibilityLabel="Open shopping list sharing"
          >

            <View style={styles.quickIconBox}>

              <Ionicons
                name="share-social-outline"
                size={25}
                color="#7C647A"
              />

            </View>

            <Text style={styles.quickTitle}>
              Share List
            </Text>

            <Text style={styles.quickSubtitle}>
              Send your shopping list
            </Text>

            <View style={styles.quickArrowBox}>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#7C647A"
              />

            </View>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.quickCard,
              styles.scannerCard
            ]}
            activeOpacity={0.84}
            onPress={()=>
              router.push({
                pathname:"/scanner",
                params:{
                  mode:"shoppingList"
                }
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Open barcode scanner"
          >

            <View style={styles.quickIconBox}>

              <Ionicons
                name="barcode-outline"
                size={26}
                color="#5D7380"
              />

            </View>

            <Text style={styles.quickTitle}>
              Scanner
            </Text>

            <Text style={styles.quickSubtitle}>
              Scan a shopping item
            </Text>

            <View style={styles.quickArrowBox}>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#5D7380"
              />

            </View>

          </TouchableOpacity>

        </View>


        <Text style={styles.signature}>
          ✦ Designed &amp; Created by Lalli ✦
        </Text>

        <Text style={styles.creationDate}>
          24 July 2026
        </Text>

      </ScrollView>


      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={()=>
          setNameModalVisible(false)
        }
      >

        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
        >

          <View style={styles.nameModal}>

            <Text style={styles.nameModalIcon}>
              👋
            </Text>

            <Text style={styles.nameModalTitle}>
              Change Your Name
            </Text>

            <Text style={styles.nameModalText}>
              What name would you like ShopWithEzz to use?
            </Text>

            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor="#90A497"
              autoCapitalize="words"
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={saveName}
              selectTextOnFocus
            />

            <View style={styles.nameModalButtons}>

              <TouchableOpacity
                style={styles.cancelNameButton}
                onPress={()=>
                  setNameModalVisible(false)
                }
              >

                <Text style={styles.cancelNameText}>
                  Cancel
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveNameButton}
                onPress={saveName}
              >

                <Text style={styles.saveNameText}>
                  Save Name
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </KeyboardAvoidingView>

  );

}


const styles = StyleSheet.create({

  screen:{
    flex:1,
    backgroundColor:"#FBF7F2"
  },

  content:{
    paddingHorizontal:20,
    paddingTop:52,
    paddingBottom:30
  },

  brandRow:{
    alignItems:"center"
  },

  logoBox:{
    width:48,
    height:48,
    borderRadius:24,
    backgroundColor:"#7B8F75",
    alignItems:"center",
    justifyContent:"center",
    shadowColor:"#667561",
    shadowOffset:{
      width:0,
      height:5
    },
    shadowOpacity:0.18,
    shadowRadius:8,
    elevation:3
  },

  brand:{
    marginTop:9,
    fontSize:23,
    fontWeight:"900",
    letterSpacing:-0.5,
    color:"#3E4B3C"
  },

  brandSub:{
    marginTop:3,
    fontSize:8,
    fontWeight:"800",
    letterSpacing:1.15,
    color:"#A28E83"
  },

  greetingCard:{
    marginTop:22,
    padding:18,
    borderRadius:22,
    backgroundColor:"#F3E7E2"
  },

  greetingTop:{
    position:"relative",
    alignItems:"center"
  },

  greetingTextBlock:{
    alignItems:"center"
  },

  eyebrow:{
    fontSize:9,
    fontWeight:"900",
    letterSpacing:1.5,
    color:"#8F766B"
  },

  hello:{
    marginTop:3,
    fontSize:28,
    fontWeight:"900",
    letterSpacing:-0.6,
    color:"#463E3B"
  },

  welcome:{
    marginTop:8,
    fontSize:14,
    lineHeight:21,
    color:"#73635C",
    textAlign:"center"
  },

  changeNameButton:{
    position:"absolute",
    right:0,
    top:4,
    width:36,
    height:36,
    borderRadius:18,
    backgroundColor:"rgba(255,255,255,0.58)",
    alignItems:"center",
    justifyContent:"center"
  },

  sectionHeading:{
    marginTop:18,
    marginBottom:7,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between"
  },

  sectionTitle:{
    fontSize:14,
    fontWeight:"900",
    color:"#463E3B"
  },

  sectionHint:{
    fontSize:9,
    fontWeight:"700",
    color:"#A28E83"
  },

  budgetRow:{
    padding:8,
    borderRadius:18,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#EEE7E0",
    flexDirection:"row",
    alignItems:"center"
  },

  moneyInputBox:{
    flex:1,
    flexDirection:"row",
    alignItems:"center",
    borderRadius:13,
    backgroundColor:"#F7F3EE",
    paddingHorizontal:11
  },

  dollar:{
    fontSize:18,
    fontWeight:"900",
    color:"#7B8F75"
  },

  moneyInput:{
    flex:1,
    paddingVertical:10,
    paddingHorizontal:4,
    fontSize:16,
    fontWeight:"800",
    color:"#463E3B"
  },

  saveButton:{
    height:42,
    marginLeft:8,
    paddingHorizontal:18,
    borderRadius:13,
    backgroundColor:"#7B8F75",
    alignItems:"center",
    justifyContent:"center"
  },

  saveText:{
    fontSize:12,
    fontWeight:"900",
    color:"#FFFFFF"
  },

  summaryCard:{
    marginTop:14,
    padding:18,
    borderRadius:22,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#EEE7E0",
    shadowColor:"#8A7769",
    shadowOffset:{
      width:0,
      height:5
    },
    shadowOpacity:0.08,
    shadowRadius:12,
    elevation:2
  },

  summaryHeading:{
    flexDirection:"row",
    alignItems:"flex-start",
    justifyContent:"space-between"
  },

  summaryLabel:{
    fontSize:8,
    fontWeight:"900",
    letterSpacing:1.1,
    color:"#A28E83"
  },

  summaryTitle:{
    marginTop:3,
    fontSize:17,
    fontWeight:"900",
    color:"#463E3B"
  },

  balancePill:{
    paddingVertical:6,
    paddingHorizontal:10,
    borderRadius:12,
    backgroundColor:"#EDF3EB"
  },

  balancePillOver:{
    backgroundColor:"#FCE9E7"
  },

  balancePillText:{
    fontSize:9,
    fontWeight:"900",
    color:"#657B60"
  },

  balancePillTextOver:{
    color:"#C86761"
  },

  totalLabel:{
    marginTop:18,
    fontSize:10,
    fontWeight:"700",
    color:"#9A8980"
  },

  totalValue:{
    marginTop:1,
    fontSize:35,
    fontWeight:"900",
    letterSpacing:-1,
    color:"#3E4B3C"
  },

  summaryDivider:{
    height:1,
    marginVertical:15,
    backgroundColor:"#F0E9E4"
  },

  summaryNumbers:{
    flexDirection:"row",
    justifyContent:"space-between"
  },

  summaryNumberRight:{
    alignItems:"flex-end"
  },

  smallLabel:{
    fontSize:8,
    fontWeight:"900",
    letterSpacing:0.9,
    color:"#A28E83"
  },

  smallValue:{
    marginTop:4,
    fontSize:15,
    fontWeight:"900",
    color:"#514945"
  },

  remainingValue:{
    color:"#657B60"
  },

  overValue:{
    color:"#C86761"
  },

  progressTop:{
    marginTop:16,
    flexDirection:"row",
    justifyContent:"space-between"
  },

  progressText:{
    fontSize:10,
    fontWeight:"700",
    color:"#806E67"
  },

  progressPercent:{
    fontSize:10,
    fontWeight:"900",
    color:"#657B60"
  },

  progressTrack:{
    marginTop:7,
    height:6,
    borderRadius:4,
    backgroundColor:"#E8E4DE",
    overflow:"hidden"
  },

  progressFill:{
    height:"100%",
    backgroundColor:"#95AA8E",
    borderRadius:4
  },

  listButton:{
    marginTop:14,
    padding:14,
    borderRadius:22,
    backgroundColor:"#E6EEE2",
    borderWidth:1,
    borderColor:"#D4E0D0",
    flexDirection:"row",
    alignItems:"center"
  },

  listIconBox:{
    width:47,
    height:47,
    borderRadius:17,
    backgroundColor:"#FFFFFF",
    alignItems:"center",
    justifyContent:"center"
  },

  listDetails:{
    flex:1,
    marginLeft:12
  },

  listTitle:{
    fontSize:18,
    fontWeight:"900",
    color:"#465344"
  },

  listSubtitle:{
    marginTop:3,
    fontSize:10,
    fontWeight:"600",
    color:"#7C8D78"
  },

  quickHeadingRow:{
    marginTop:22,
    marginBottom:10,
    flexDirection:"row",
    alignItems:"flex-end",
    justifyContent:"space-between"
  },

  quickEyebrow:{
    fontSize:8,
    fontWeight:"900",
    letterSpacing:1.15,
    color:"#A28E83"
  },

  quickHeading:{
    marginTop:3,
    fontSize:18,
    fontWeight:"900",
    color:"#463E3B"
  },

  quickHint:{
    marginBottom:2,
    fontSize:9,
    fontWeight:"700",
    color:"#A28E83"
  },

  quickGrid:{
    flexDirection:"row",
    flexWrap:"wrap"
  },

  quickCard:{
    position:"relative",
    width:"48.5%",
    minHeight:150,
    marginBottom:10,
    padding:15,
    borderRadius:21,
    borderWidth:1,
    overflow:"hidden"
  },

  quickCardLeft:{
    marginRight:"3%"
  },

  favouritesCard:{
    backgroundColor:"#F7EFE2",
    borderColor:"#E9DBC6"
  },

  handsFreeCard:{
    backgroundColor:"#E6EEE2",
    borderColor:"#D4E0D0"
  },

  shareCard:{
    backgroundColor:"#F2E9F0",
    borderColor:"#E4D7E1"
  },

  scannerCard:{
    backgroundColor:"#E7EFF2",
    borderColor:"#D5E1E6"
  },

  quickIconBox:{
    width:46,
    height:46,
    borderRadius:16,
    backgroundColor:"rgba(255,255,255,0.72)",
    alignItems:"center",
    justifyContent:"center"
  },

  quickTitle:{
    marginTop:13,
    fontSize:15,
    fontWeight:"900",
    color:"#463E3B"
  },

  quickSubtitle:{
    marginTop:4,
    paddingRight:22,
    fontSize:10,
    lineHeight:15,
    fontWeight:"600",
    color:"#806E67"
  },

  quickArrowBox:{
    position:"absolute",
    right:12,
    bottom:12,
    width:28,
    height:28,
    borderRadius:14,
    backgroundColor:"rgba(255,255,255,0.72)",
    alignItems:"center",
    justifyContent:"center"
  },

  signature:{
    marginTop:22,
    textAlign:"center",
    fontSize:10,
    fontWeight:"800",
    color:"#796B64"
  },

  creationDate:{
    marginTop:4,
    textAlign:"center",
    fontSize:9,
    fontWeight:"700",
    color:"#8C7C73"
  },

  modalOverlay:{
    flex:1,
    backgroundColor:"rgba(23,59,37,0.55)",
    alignItems:"center",
    justifyContent:"center",
    padding:22
  },

  nameModal:{
    width:"100%",
    padding:22,
    borderRadius:25,
    backgroundColor:"#FFFFFF",
    elevation:10
  },

  nameModalIcon:{
    fontSize:32,
    textAlign:"center"
  },

  nameModalTitle:{
    marginTop:8,
    fontSize:23,
    fontWeight:"900",
    color:"#173B25",
    textAlign:"center"
  },

  nameModalText:{
    marginTop:7,
    fontSize:13,
    lineHeight:19,
    color:"#78907D",
    textAlign:"center"
  },

  nameInput:{
    marginTop:18,
    paddingVertical:13,
    paddingHorizontal:15,
    borderRadius:15,
    backgroundColor:"#F3F7F1",
    borderWidth:1,
    borderColor:"#D8E6DA",
    fontSize:18,
    fontWeight:"800",
    color:"#263238"
  },

  nameModalButtons:{
    marginTop:16,
    flexDirection:"row",
    justifyContent:"flex-end",
    alignItems:"center"
  },

  cancelNameButton:{
    paddingVertical:12,
    paddingHorizontal:17
  },

  cancelNameText:{
    fontSize:14,
    fontWeight:"800",
    color:"#78907D"
  },

  saveNameButton:{
    paddingVertical:12,
    paddingHorizontal:19,
    borderRadius:14,
    backgroundColor:"#2E7D32"
  },

  saveNameText:{
    fontSize:14,
    fontWeight:"900",
    color:"#FFFFFF"
  }

});
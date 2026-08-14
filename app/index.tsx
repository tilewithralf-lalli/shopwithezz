import React, {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
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
  Href,
  useFocusEffect,
  useRouter
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    Ionicons
} from "@expo/vector-icons";

import Constants from "expo-constants";

import {
    ShoppingCategory
} from "../constants/shoppingCategories";

import {
  calculateTrialStatus,
  DEVELOPMENT_TRIAL_DURATION_MILLISECONDS,
  TrialStatus,
  TRIAL_DURATION_MILLISECONDS
} from "../constants/trial";

import {
  loadTrialStatus,
  resetDevelopmentTrial
} from "../storage/trial";

import {
  observeBackupChanges,
  snoozeBackupReminder
} from "../storage/backupReminder";

import {usePurchase} from "../contexts/PurchaseContext";
import {
  ensureLists,
  getActiveList,
  selectList
} from "../storage/shoppingLists";


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


function clamp(
  value:number,
  min:number,
  max:number
){

  return Math.min(
    max,
    Math.max(min,value)
  );

}


function mixChannel(
  start:number,
  end:number,
  amount:number
){

  return Math.round(
    start + (end - start) * amount
  );

}


function toHex(
  channel:number
){

  return channel
    .toString(16)
    .padStart(2,"0")
    .toUpperCase();

}


function mixColor(
  start:[number,number,number],
  end:[number,number,number],
  amount:number
){

  const safeAmount =
    clamp(amount,0,1);

  const r =
    mixChannel(start[0],end[0],safeAmount);

  const g =
    mixChannel(start[1],end[1],safeAmount);

  const b =
    mixChannel(start[2],end[2],safeAmount);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;

}


function getBudgetProgressColor(
  usage:number
){

  if(usage <= 0.5){
    return "#B9DBA8";
  }

  if(usage <= 0.8){
    const amount =
      (usage - 0.5) / 0.3;

    return mixColor(
      [185,219,168],
      [216,92,87],
      amount
    );
  }

  if(usage <= 1){
    const amount =
      (usage - 0.8) / 0.2;

    return mixColor(
      [216,92,87],
      [139,30,30],
      amount
    );
  }

  return "#8B1E1E";

}


const EMPTY_SESSION:ShoppingSession = {
  budget:0,
  spent:0,
  items:[]
};


export default function HomeScreen(){

  const router = useRouter();

  const {isPurchasing,isUnlocked,productPrice,purchaseUnlock} = usePurchase();

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

  const [trialStatus,setTrialStatus] =
    useState<TrialStatus | null>(null);
  const [activeListName,setActiveListName] = useState("My Shopping List");
  const [homeListItemCount,setHomeListItemCount] = useState(0);
  const [importedList,setImportedList] =
    useState<{id:string;name:string;itemCount:number} | null>(null);


  useFocusEffect(

    useCallback(()=>{

      loadHome();

    },[])

  );


  useEffect(()=>{
    const timer = setInterval(()=>{
      setTrialStatus(current=>
        current
          ? calculateTrialStatus(
              current.nextState,
              Date.now(),
              __DEV__
                ? DEVELOPMENT_TRIAL_DURATION_MILLISECONDS
                : TRIAL_DURATION_MILLISECONDS
            )
          : current
      );
    },1000);

    return ()=>clearInterval(timer);
  },[]);


  async function loadHome(){

    try{

      const [
        savedSession,
        savedName,
        savedTrialStatus,
        activeList,
        savedLists
      ] =
        await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(USER_NAME_KEY),
          loadTrialStatus(),
          getActiveList(),
          ensureLists()
        ]);

      setTrialStatus(savedTrialStatus);
      const homeList =
        savedLists.find(list=>list.name === "My Shopping List")
        || activeList;
      setActiveListName(homeList.name);
      setHomeListItemCount(homeList.session.items.length);
      const nextImportedList =
        savedLists
          .filter(list=>list.id !== homeList.id)
          .sort((first,second)=>
            second.createdAt.localeCompare(first.createdAt)
          )[0];
      setImportedList(
        nextImportedList
          ? {
              id:nextImportedList.id,
              name:nextImportedList.name,
              itemCount:nextImportedList.session.items.length
            }
          : null
      );

      const reminder = await observeBackupChanges(
        savedSession || JSON.stringify(EMPTY_SESSION)
      );

      if(reminder.shouldRemind && !savedTrialStatus.isExpired){
        Alert.alert(
          "Consider a Backup",
          "You have made quite a few shopping changes since your last backup. Would you like to create one now?",
          [
            {text:"Remind Me Later",onPress:()=>snoozeBackupReminder()},
            {text:"Back Up Now",onPress:()=>router.push("/settings" as Href)}
          ]
        );
      }

      const nextSession = {
        ...homeList.session,
        spent:0
      };

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

  function openShareOptions(){

    Alert.alert(
      "Shopping List",
      "What would you like to do?",
      [
        {
          text:"Send as Text",
          onPress:()=>router.push({
            pathname:"/shoppingList",
            params:{action:"share"}
          })
        },
        {
          text:"Share as PDF",
          onPress:()=>router.push({
            pathname:"/shoppingList",
            params:{action:"pdf"}
          })
        },
        {
          text:"Print",
          onPress:()=>router.push({
            pathname:"/shoppingList",
            params:{action:"print"}
          })
        },
        {
          text:"Cancel",
          style:"cancel"
        }
      ]
    );

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

  const budgetUsage =
    session.budget > 0
      ? total / session.budget
      : 0;

  const budgetPercent =
    session.budget > 0
      ? Math.round(budgetUsage * 100)
      : 0;

  const budgetBarWidth =
    Math.min(100,budgetPercent);

  const budgetProgressColor =
    getBudgetProgressColor(budgetUsage);

  const purchasedCount =
    session.items.filter(
      item=>item.purchased
    ).length;

  const trialTimeText =
    trialStatus
      ? __DEV__
        ? `${Math.floor(trialStatus.millisecondsRemaining/60000)}:${String(
            Math.floor(trialStatus.millisecondsRemaining/1000)%60
          ).padStart(2,"0")} remaining`
        : `${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? "" : "s"} remaining`
      : "Starting trial…";

  async function restartTestTrial(){
    await resetDevelopmentTrial();
    setTrialStatus(await loadTrialStatus());
  }

  async function sendLockedFeedback(){
    const subject = encodeURIComponent("ShopWithEzz Feedback");
    const body = encodeURIComponent(
      `ShopWithEzz version ${Constants.expoConfig?.version || "1.1.0"}\nTrial status: Expired\n\nMy feedback:\n`
    );

    try{
      await Linking.openURL(`mailto:lalli61apps@hotmail.com?subject=${subject}&body=${body}`);
    }
    catch{
      Alert.alert("Send Feedback", "No email app is available on this device.");
    }
  }

  if(trialStatus?.isExpired && !isUnlocked){
    return(
      <View style={styles.trialLockScreen}>
        <View style={styles.trialLockCard}>
          <View style={styles.trialLockIcon}>
            <Ionicons name="lock-closed" size={38} color="#9F2D26"/>
          </View>
          <Text style={styles.trialLockEyebrow}>
            {__DEV__ ? "TEST TRIAL FINISHED" : "FREE TRIAL FINISHED"}
          </Text>
          <Text style={styles.trialLockTitle}>
            Your ShopWithEzz trial has expired
          </Text>
          <Text style={styles.trialLockMessage}>
            Your shopping information is still safe. Unlock ShopWithEzz to keep using the app.
          </Text>
          <TouchableOpacity
            style={styles.trialUnlockButton}
            activeOpacity={0.84}
            onPress={purchaseUnlock}
            disabled={isPurchasing}
            accessibilityRole="button"
            accessibilityLabel="Unlock ShopWithEzz"
          >
            <Ionicons name="key" size={20} color="#FFFFFF"/>
            <Text style={styles.trialUnlockButtonText}>
              {isPurchasing ? "OPENING GOOGLE PLAY…" : `UNLOCK FOR ${productPrice}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trialFeedbackButton}
            activeOpacity={0.84}
            onPress={sendLockedFeedback}
            accessibilityRole="button"
            accessibilityLabel="Send feedback"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#536650"/>
            <Text style={styles.trialFeedbackButtonText}>SEND FEEDBACK</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <TouchableOpacity
              style={styles.restartTrialButton}
              activeOpacity={0.84}
              onPress={restartTestTrial}
              accessibilityRole="button"
              accessibilityLabel="Restart one minute test trial"
            >
              <Text style={styles.restartTrialButtonText}>RESTART 1-MINUTE TEST</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

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

          <View style={styles.brandTitleRow}>

            <Image
              source={require("../assets/images/shopwithezz-icon.png")}
              style={styles.brandTrolley}
              resizeMode="contain"
              accessibilityLabel="Woman pushing a shopping trolley"
            />

            <Text style={styles.brand}>
              ShopWithEzz
            </Text>

          </View>

          <Text style={styles.brandSub}>
            SHOP BEAUTIFULLY · SPEND SMARTER
          </Text>

        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          activeOpacity={0.84}
          onPress={()=>router.push("/settings" as Href)}
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
        >
          <Ionicons name="settings-outline" size={18} color="#536650"/>
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>

        <View style={styles.greetingCard}>
          <View style={styles.greetingTop}>
            <View style={styles.greetingTextBlock}>
              <Text style={styles.eyebrow}>WELCOME BACK</Text>
              <Text style={styles.hello}>Hi, {name} 👋</Text>
            </View>
            <TouchableOpacity style={styles.changeNameButton} onPress={openNameEditor} accessibilityRole="button" accessibilityLabel="Change name">
              <Ionicons name="pencil-outline" size={16} color="#6F806A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.welcome}>Everything you need is ready in one place.</Text>
        </View>

        <TouchableOpacity
          style={styles.listButton}
          onPress={async()=>{
            const lists = await ensureLists();
            const homeList =
              lists.find(list=>list.name === "My Shopping List")
              || lists[0];
            await selectList(homeList.id);
            router.push("/shoppingList");
          }}
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityLabel="Open shopping list"
        >
          <View style={styles.listIconBox}>
            <Ionicons name="bag-handle-outline" size={25} color="#536650" />
          </View>
          <View style={styles.listDetails}>
            <Text style={styles.listTitle}>{activeListName}</Text>
            <Text style={styles.listSubtitle}>{homeListItemCount} items · Ready when you are</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="#536650" />
        </TouchableOpacity>


        <View style={styles.summaryCard}>

          <View style={styles.summaryHeading}>
            <Text style={styles.summaryTitle}>Spending</Text>

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

          <View style={styles.inlineBudgetRow}>
            <Text style={styles.inlineBudgetLabel}>YOUR BUDGET</Text>
            <View style={styles.inlineBudgetInputBox}>
              <Text style={styles.inlineBudgetDollar}>$</Text>
              <TextInput
                style={styles.inlineBudgetInput}
                value={budgetInput}
                onChangeText={setBudgetInput}
                placeholder="0.00"
                placeholderTextColor="#A79A93"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={saveBudget}
                onEndEditing={saveBudget}
                selectTextOnFocus
              />
            </View>
          </View>

          <View style={styles.summaryNumbers}>
            <View style={styles.summaryMetric}>
              <Text style={styles.smallLabel}>BUDGET</Text>
              <Text style={styles.smallValue}>${session.budget.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.smallLabel}>SPENT</Text>
              <Text style={styles.smallValue}>${total.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.smallLabel}>{remaining < 0 ? "OVER" : "LEFT"}</Text>
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
              {budgetPercent}%
            </Text>

          </View>

          <View style={styles.progressTrack}>

            <View
              style={[
                styles.progressFill,
                {
                  width:`${budgetBarWidth}%` as any,
                  backgroundColor:budgetProgressColor
                }
              ]}
            />

          </View>

        </View>


        <View style={styles.quickHeadingRow}>

          <View>

            <Text style={styles.quickHeading}>
              Tools
            </Text>

          </View>

        </View>


        <View style={styles.quickGrid}>

          <TouchableOpacity
            style={[
              styles.quickCard,
              styles.handsFreeCard,
              styles.hiddenTool
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

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>Hands-Free</Text>
              <Text style={styles.quickSubtitle}>Control your list by voice</Text>
            </View>

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
              styles.shareCard,
              styles.hiddenTool
            ]}
            activeOpacity={0.84}
            onPress={openShareOptions}
            accessibilityRole="button"
            accessibilityLabel="Share shopping list"
          >

            <View style={styles.quickIconBox}>

              <Ionicons
                name="share-social-outline"
                size={25}
                color="#7C647A"
              />

            </View>

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>Share List</Text>
              <Text style={styles.quickSubtitle}>Share as PDF or print</Text>
            </View>

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
              styles.howToCard
            ]}
            activeOpacity={0.84}
            onPress={()=>router.push("/howToUse")}
            accessibilityRole="button"
            accessibilityLabel="How to use ShopWithEzz"
          >

            <View style={styles.quickIconBox}>

              <Ionicons
                name="help-circle-outline"
                size={25}
                color="#79664D"
              />

            </View>

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>How to Use</Text>
              <Text style={styles.quickSubtitle}>Simple step-by-step help</Text>
            </View>

            <View style={styles.quickArrowBox}>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#79664D"
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

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>Scanner</Text>
              <Text style={styles.quickSubtitle}>Scan a shopping item</Text>
            </View>

            <View style={styles.quickArrowBox}>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#5D7380"
              />

            </View>

          </TouchableOpacity>

        </View>


        <View style={[styles.trialCard,trialStatus?.isExpired && styles.trialCardExpired]}>
          <Ionicons name={trialStatus?.isExpired ? "time" : "sparkles"} size={17} color={trialStatus?.isExpired ? "#9F2D26" : "#426047"} />
          <View style={styles.trialText}>
            <Text style={[styles.trialTitle,trialStatus?.isExpired && styles.trialTitleExpired]}>{__DEV__ ? "TEST TRIAL" : "31-DAY BETA TRIAL"}</Text>
            <Text style={styles.trialDetail}>{trialStatus?.isExpired ? "Expired" : trialTimeText}</Text>
          </View>
        </View>

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
    paddingHorizontal:18,
    paddingTop:20,
    paddingBottom:20
  },

  brandRow:{
    position:"relative",
    alignItems:"center",
    justifyContent:"center"
  },

  brandTitleRow:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  brandTrolley:{
    width:48,
    height:48,
    marginRight:2,
    transform:[{translateY:7}]
  },

  brand:{
    marginLeft:3,
    fontSize:23,
    fontWeight:"900",
    letterSpacing:-0.5,
    color:"#3E4B3C"
  },

  brandSub:{
    marginTop:8,
    fontSize:9,
    fontWeight:"900",
    letterSpacing:1.2,
    color:"#7D6C64"
  },

  greetingCard:{
    marginTop:14,
    padding:10,
    borderRadius:18,
    backgroundColor:"#E6EEE2"
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
    fontSize:20,
    fontWeight:"900",
    letterSpacing:-0.6,
    color:"#463E3B"
  },

  welcome:{
    marginTop:4,
    fontSize:11,
    lineHeight:15,
    color:"#73635C",
    textAlign:"center"
  },

  changeNameButton:{
    position:"absolute",
    right:0,
    top:4,
    width:32,
    height:32,
    borderRadius:16,
    backgroundColor:"rgba(255,255,255,0.58)",
    alignItems:"center",
    justifyContent:"center"
  },

  sectionHeading:{
    marginTop:13,
    marginBottom:6,
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
    padding:6,
    borderRadius:15,
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
    paddingVertical:8,
    paddingHorizontal:4,
    fontSize:16,
    fontWeight:"800",
    color:"#463E3B"
  },

  saveButton:{
    height:38,
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
    marginTop:6,
    padding:7,
    borderRadius:14,
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
    alignItems:"center",
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
    marginTop:10,
    fontSize:10,
    fontWeight:"700",
    color:"#9A8980"
  },

  totalValue:{
    marginTop:1,
    fontSize:28,
    fontWeight:"900",
    letterSpacing:-1,
    color:"#3E4B3C"
  },

  summaryDivider:{
    height:1,
    marginVertical:10,
    backgroundColor:"#F0E9E4"
  },

  summaryNumbers:{
    marginTop:12,
    flexDirection:"row",
    justifyContent:"space-between"
  },
  inlineBudgetRow:{
    marginTop:6,
    marginBottom:6,
    padding:6,
    borderRadius:10,
    backgroundColor:"#F6F3EE",
    flexDirection:"row",
    alignItems:"center"
  },
  inlineBudgetLabel:{flex:1,fontSize:11,fontWeight:"900",letterSpacing:1,color:"#786D66"},
  inlineBudgetInputBox:{width:130,height:42,borderRadius:11,backgroundColor:"#FFFFFF",flexDirection:"row",alignItems:"center",paddingHorizontal:10},
  inlineBudgetDollar:{fontSize:18,fontWeight:"900",color:"#6E8B68",marginRight:5},
  inlineBudgetInput:{flex:1,fontSize:18,fontWeight:"900",color:"#403A36",padding:0},

  summaryMetric:{
    flex:1,
    alignItems:"center"
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
    marginTop:10,
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
    backgroundColor:"#B9DBA8",
    borderRadius:4
  },

  listButton:{
    marginTop:10,
    padding:13,
    minHeight:148,
    borderRadius:17,
    backgroundColor:"#F3E7E2",
    borderWidth:1,
    borderColor:"#D4E0D0",
    flexDirection:"row",
    alignItems:"center"
  },

  listIconBox:{
    width:58,
    height:58,
    borderRadius:13,
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
    fontSize:11,
    fontWeight:"600",
    color:"#7C8D78"
  },

  quickHeadingRow:{
    marginTop:10,
    marginBottom:7,
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
    fontSize:16,
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
    flexDirection:"column"
  },

  quickCard:{
    position:"relative",
    width:"100%",
    minHeight:68,
    marginBottom:7,
    paddingVertical:10,
    paddingHorizontal:12,
    borderRadius:16,
    borderWidth:1,
    overflow:"hidden",
    flexDirection:"row",
    alignItems:"center"
  },

  quickCardLeft:{
    marginRight:0
  },

  shareCard:{
    backgroundColor:"#F2E9F0",
    borderColor:"#E4D7E1"
  },

  howToCard:{
    backgroundColor:"#F5EEE2",
    borderColor:"#E8DCC8"
  },

  scannerCard:{
    backgroundColor:"#E7EFF2",
    borderColor:"#D5E1E6"
  },

  quickIconBox:{
    width:40,
    height:40,
    borderRadius:13,
    backgroundColor:"rgba(255,255,255,0.72)",
    alignItems:"center",
    justifyContent:"center"
  },

  quickTitle:{
    fontSize:14,
    fontWeight:"900",
    color:"#463E3B"
  },

  quickSubtitle:{
    marginTop:2,
    paddingRight:35,
    fontSize:10,
    lineHeight:15,
    fontWeight:"600",
    color:"#806E67"
  },

  quickTextBox:{
    flex:1,
    marginLeft:11
  },

  quickArrowBox:{
    position:"absolute",
    right:12,
    top:19,
    width:27,
    height:27,
    borderRadius:13.5,
    backgroundColor:"rgba(255,255,255,0.72)",
    alignItems:"center",
    justifyContent:"center"
  },

  signature:{
    marginTop:9,
    textAlign:"center",
    fontSize:11,
    fontWeight:"900",
    color:"#514843"
  },

  creationDate:{
    marginTop:4,
    textAlign:"center",
    fontSize:10,
    fontWeight:"900",
    color:"#5F554F"
  },

  documentFooter:{
    marginTop:14,
    paddingTop:11,
    borderTopWidth:1,
    borderTopColor:"#DED7D0",
    alignItems:"center"
  },

  footerTitle:{
    fontSize:11,
    fontWeight:"900",
    color:"#514843"
  },

  footerInfo:{
    marginTop:3,
    fontSize:10,
    fontWeight:"800",
    color:"#5F554F"
  },

  footerDivider:{
    width:42,
    height:1,
    marginTop:8,
    backgroundColor:"#DED7D0"
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
  },

  settingsButton:{
    alignSelf:"flex-end",
    marginTop:-3,
    paddingVertical:8,
    paddingHorizontal:12,
    borderRadius:14,
    backgroundColor:"#EEF3EC",
    borderWidth:1,
    borderColor:"#DDE7DC",
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  settingsButtonText:{
    marginLeft:6,
    fontSize:12,
    fontWeight:"800",
    color:"#536650"
  },

  trialCard:{
    flexDirection:"row",
    alignItems:"center",
    marginTop:8,
    paddingVertical:7,
    paddingHorizontal:11,
    borderRadius:13,
    backgroundColor:"#E8F0E6",
    borderWidth:1,
    borderColor:"#D4E2D2"
  },

  trialCardExpired:{
    backgroundColor:"#FFF0EF",
    borderColor:"#E8B7B3"
  },

  trialText:{
    flex:1,
    marginLeft:10
  },

  trialTitle:{
    fontSize:11,
    fontWeight:"900",
    letterSpacing:1.1,
    color:"#426047"
  },

  trialTitleExpired:{
    color:"#9F2D26"
  },

  trialDetail:{
    marginTop:2,
    fontSize:13,
    fontWeight:"800",
    color:"#615B56"
  },

  trialLockScreen:{
    flex:1,
    backgroundColor:"#F4F1EA",
    paddingHorizontal:24,
    alignItems:"center",
    justifyContent:"center"
  },

  trialLockCard:{
    width:"100%",
    maxWidth:430,
    paddingVertical:34,
    paddingHorizontal:24,
    borderRadius:26,
    backgroundColor:"#FFFFFF",
    borderWidth:2,
    borderColor:"#E8B7B3",
    alignItems:"center"
  },

  trialLockIcon:{
    width:74,
    height:74,
    borderRadius:37,
    backgroundColor:"#FFF0EF",
    alignItems:"center",
    justifyContent:"center",
    marginBottom:18
  },

  trialLockEyebrow:{
    fontSize:12,
    fontWeight:"900",
    letterSpacing:1.4,
    color:"#9F2D26",
    textAlign:"center"
  },

  trialLockTitle:{
    marginTop:10,
    fontSize:25,
    lineHeight:31,
    fontWeight:"900",
    color:"#3E4B3C",
    textAlign:"center"
  },

  trialLockMessage:{
    marginTop:14,
    fontSize:16,
    lineHeight:23,
    fontWeight:"700",
    color:"#615B56",
    textAlign:"center"
  },

  trialUnlockButton:{
    width:"100%",
    marginTop:26,
    minHeight:56,
    borderRadius:17,
    backgroundColor:"#536650",
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  trialUnlockButtonText:{
    marginLeft:9,
    fontSize:15,
    fontWeight:"900",
    color:"#FFFFFF",
    letterSpacing:0.5
  },

  trialFeedbackButton:{
    width:"100%",
    marginTop:12,
    minHeight:50,
    borderRadius:17,
    backgroundColor:"#EEF3EC",
    borderWidth:1,
    borderColor:"#D4E2D2",
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center"
  },

  trialFeedbackButtonText:{
    marginLeft:8,
    fontSize:14,
    fontWeight:"900",
    color:"#536650",
    letterSpacing:0.4
  },

  restartTrialButton:{
    width:"100%",
    marginTop:12,
    minHeight:50,
    borderRadius:17,
    borderWidth:2,
    borderColor:"#536650",
    alignItems:"center",
    justifyContent:"center"
  },

  restartTrialButtonText:{
    fontSize:14,
    fontWeight:"900",
    color:"#536650",
    letterSpacing:0.4
  },

  hiddenTool:{
    display:"none"
  },

  settingsIconBox:{
    width:44,
    height:44,
    borderRadius:14,
    backgroundColor:"#E8F0E6",
    alignItems:"center",
    justifyContent:"center"
  },

  settingsDetails:{
    flex:1,
    marginLeft:12
  },

  settingsTitle:{
    fontSize:16,
    fontWeight:"900",
    color:"#3E4B3C"
  },

  settingsSubtitle:{
    marginTop:3,
    fontSize:11,
    color:"#788379"
  }

});

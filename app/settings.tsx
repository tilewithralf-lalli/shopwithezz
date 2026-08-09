import React, {useEffect, useState} from "react";

import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import {Ionicons} from "@expo/vector-icons";
import Constants from "expo-constants";
import {Directory, File} from "expo-file-system";
import {useRouter} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {markBackupCompleted} from "../storage/backupReminder";

const UPGRADE_PAGE_URL = "https://tilewithralf-lalli.github.io/shopwithezz/";

const USER_NAME_KEY = "shopwithezz-user-name";
const SESSION_KEY = "shopwithezz-v1-final-session-v1";
const APP_KEY_PREFIX = "shopwithezz";
const BACKUP_FORMAT = "shopwithezz-backup";

type BackupFile = {
  format:string;
  version:number;
  createdAt:string;
  data:Record<string,string>;
};

export default function SettingsScreen(){
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name,setName] = useState("");
  const [savingName,setSavingName] = useState(false);

  useEffect(()=>{
    AsyncStorage.getItem(USER_NAME_KEY)
      .then(saved=>setName(saved || ""))
      .catch(()=>Alert.alert("Profile", "Your profile could not be loaded."));
  },[]);

  async function saveProfile(){
    const cleanName = name.trim();
    if(!cleanName){
      Alert.alert("Enter Your Name", "Please enter the name you would like ShopWithEzz to use.");
      return;
    }

    try{
      setSavingName(true);
      await AsyncStorage.setItem(USER_NAME_KEY,cleanName);
      setName(cleanName);
      Alert.alert("Profile Saved", "Your name has been updated.");
    }
    catch{
      Alert.alert("Profile", "Your name could not be saved.");
    }
    finally{
      setSavingName(false);
    }
  }

  async function appData(){
    const keys = (await AsyncStorage.getAllKeys())
      .filter(key=>key.toLowerCase().startsWith(APP_KEY_PREFIX));
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(
      pairs.filter((pair):pair is [string,string]=>pair[1] !== null)
    );
  }

  async function createBackup(){
    try{
      const backup:BackupFile = {
        format:BACKUP_FORMAT,
        version:1,
        createdAt:new Date().toISOString(),
        data:await appData()
      };
      const stamp = backup.createdAt
        .slice(0,19)
        .replace(/[T:]/g,"-");
      const folder = await Directory.pickDirectoryAsync();
      const file = folder.createFile(
        `ShopWithEzz-backup-${stamp}.json`,
        "application/json"
      );
      file.write(JSON.stringify(backup,null,2));
      await markBackupCompleted(backup.data[SESSION_KEY] || "");
      Alert.alert(
        "Backup Saved",
        `ShopWithEzz-backup-${stamp}.json was saved in your chosen folder.`
      );
    }
    catch{
      Alert.alert("Backup Failed", "ShopWithEzz could not create the backup.");
    }
  }

  async function chooseRestoreFile(){
    try{
      const selected = await File.pickFileAsync(
        undefined,
        "application/json"
      );
      const file = Array.isArray(selected)
        ? selected[0]
        : selected;
      if(!file){
        return;
      }

      const text = await file.text();
      const backup = JSON.parse(text) as Partial<BackupFile>;
      if(
        backup.format !== BACKUP_FORMAT
        || backup.version !== 1
        || !backup.data
        || typeof backup.data !== "object"
      ){
        throw new Error("Invalid backup");
      }

      const entries = Object.entries(backup.data)
        .filter(([key,value])=>
          key.toLowerCase().startsWith(APP_KEY_PREFIX)
          && typeof value === "string"
        );
      if(!entries.length){
        throw new Error("Empty backup");
      }

      Alert.alert(
        "Restore Backup?",
        "This will replace your current ShopWithEzz profile, lists, favourites and budgets with the backup.",
        [
          {text:"Cancel",style:"cancel"},
          {
            text:"Restore",
            onPress:async()=>{
              try{
                const currentKeys = (await AsyncStorage.getAllKeys())
                  .filter(key=>key.toLowerCase().startsWith(APP_KEY_PREFIX));
                await AsyncStorage.multiRemove(currentKeys);
                await AsyncStorage.multiSet(entries);
                setName(backup.data?.[USER_NAME_KEY] || "");
                Alert.alert("Restore Complete", "Your ShopWithEzz data has been restored.");
              }
              catch{
                Alert.alert("Restore Failed", "Your current data was not replaced successfully.");
              }
            }
          }
        ]
      );
    }
    catch{
      Alert.alert("Invalid Backup", "Choose a backup file created by ShopWithEzz.");
    }
  }

  async function sendFeedback(){
    const subject = encodeURIComponent("ShopWithEzz Feedback");
    const body = encodeURIComponent(
      `ShopWithEzz version ${Constants.expoConfig?.version || "1.1.0"}\n\nMy feedback:\n`
    );
    try{
      await Linking.openURL(`mailto:lalli61apps@hotmail.com?subject=${subject}&body=${body}`);
    }
    catch{
      Alert.alert("Send Feedback", "No email app is available on this device.");
    }
  }

  async function upgradeEarly(){
    try{
      await Linking.openURL(UPGRADE_PAGE_URL);
    }
    catch{
      Alert.alert("Open Upgrade Page", "The ShopWithEzz page could not be opened. Check your internet connection and try again.");
    }
  }

  const Row = ({icon,title,detail,onPress,danger=false}:{
    icon:keyof typeof Ionicons.glyphMap;
    title:string;
    detail:string;
    onPress:()=>void;
    danger?:boolean;
  })=>(
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={[styles.rowIcon,danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={22} color={danger ? "#B3261E" : "#426047"}/>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle,danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8A998C"/>
    </TouchableOpacity>
  );

  return(
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content,{paddingBottom:Math.max(insets.bottom,20)+28}]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={()=>router.back()} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={25} color="#294A31"/>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Change something or fix something</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>CHANGE PROFILE</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Your name</Text>
          <View style={styles.profileRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={saveProfile}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={savingName}>
              <Text style={styles.saveText}>{savingName ? "Saving" : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>UPGRADE ANY TIME</Text>
        <View style={styles.card}>
          <Row
            icon="sparkles-outline"
            title="Unlock ShopWithEzz"
            detail="Upgrade now for one payment of AUD $29.99 — no subscription"
            onPress={upgradeEarly}
          />
        </View>

        <Text style={styles.sectionLabel}>EXTRAS</Text>
        <View style={styles.card}>
          <Row icon="mic-outline" title="Hands-Free Commands" detail="See voice commands and shopping mode" onPress={()=>router.push("/handsFree")}/>
          <View style={styles.divider}/>
          <Row icon="document-text-outline" title="Import a List" detail="Bring a typed shopping list into the app" onPress={()=>router.push("/importList")}/>
          <View style={styles.divider}/>
          <Row icon="share-social-outline" title="Share List" detail="Share your shopping list as PDF or print it" onPress={()=>router.push({pathname:"/shoppingList",params:{action:"share"}})}/>
          <View style={styles.divider}/>
          <Row icon="help-circle-outline" title="How to Use" detail="Step-by-step help and speaking commands" onPress={()=>router.push("/howToUse")}/>
        </View>

        <Text style={styles.sectionLabel}>HELP & DATA</Text>
        <View style={styles.card}>
          <Row icon="chatbubble-ellipses-outline" title="Send Feedback" detail="Open your email app with app details" onPress={sendFeedback}/>
          <View style={styles.divider}/>
          <Row icon="cloud-upload-outline" title="Backup" detail="Save a copy of all ShopWithEzz data" onPress={createBackup}/>
          <View style={styles.divider}/>
          <Row icon="cloud-download-outline" title="Restore from Backup" detail="Replace current data from a backup file" onPress={chooseRestoreFile}/>
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <View style={styles.aboutIcon}><Ionicons name="cart-outline" size={28} color="#426047"/></View>
            <View style={styles.aboutText}>
              <Text style={styles.aboutTitle}>ShopWithEzz</Text>
              <Text style={styles.aboutVersion}>Version {Constants.expoConfig?.version || "1.1.0"}</Text>
              <Text style={styles.aboutDetail}>Simple shopping, smarter budgeting and hands-free help.</Text>
            </View>
          </View>
          <View style={styles.documentFooter}>
            <Text style={styles.footerTitle}>Document Information</Text>
            <Text style={styles.footerInfo}>Version: {Constants.expoConfig?.version || "1.1.0"}</Text>
            <Text style={styles.footerInfo}>Created: 28 July 2026</Text>
            <Text style={styles.footerInfo}>Last Updated: 09 August 2026</Text>
            <View style={styles.footerDivider}/>
            <Text style={styles.footerBrand}>Designed &amp; Created by Team Lalli61</Text>
            <Text style={styles.footerMotto}>GSD — Get Stuff Done</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#F7F4EF"},
  content:{paddingHorizontal:18,paddingTop:48},
  header:{flexDirection:"row",alignItems:"center",marginBottom:24},
  backButton:{width:44,height:44,borderRadius:14,backgroundColor:"#E5EFE4",alignItems:"center",justifyContent:"center",marginRight:12},
  title:{fontSize:28,fontWeight:"900",color:"#273D2C"},
  subtitle:{marginTop:2,fontSize:12,color:"#728074"},
  sectionLabel:{marginTop:18,marginBottom:7,fontSize:10,fontWeight:"900",letterSpacing:1.3,color:"#7A887C"},
  card:{backgroundColor:"#FFFFFF",borderRadius:19,paddingHorizontal:14,borderWidth:1,borderColor:"#E3E9E2",overflow:"hidden"},
  inputLabel:{marginTop:14,fontSize:11,fontWeight:"800",color:"#607064"},
  profileRow:{flexDirection:"row",alignItems:"center",paddingVertical:12},
  input:{flex:1,paddingVertical:11,paddingHorizontal:13,borderRadius:12,backgroundColor:"#F3F6F2",fontSize:16,fontWeight:"700",color:"#273D2C"},
  saveButton:{marginLeft:9,paddingVertical:12,paddingHorizontal:17,borderRadius:12,backgroundColor:"#426B48"},
  saveText:{fontSize:13,fontWeight:"900",color:"#FFFFFF"},
  row:{minHeight:72,flexDirection:"row",alignItems:"center",paddingVertical:11},
  rowIcon:{width:42,height:42,borderRadius:13,backgroundColor:"#EAF1E8",alignItems:"center",justifyContent:"center"},
  dangerIcon:{backgroundColor:"#FDE9E6"},
  rowText:{flex:1,marginHorizontal:12},
  rowTitle:{fontSize:15,fontWeight:"800",color:"#2D4031"},
  dangerText:{color:"#A72C24"},
  rowDetail:{marginTop:3,fontSize:11,lineHeight:16,color:"#768079"},
  divider:{height:1,backgroundColor:"#EDF0EC",marginLeft:54},
  aboutCard:{padding:17,borderRadius:19,backgroundColor:"#EAF1E8"},
  aboutHeader:{flexDirection:"row",alignItems:"center"},
  aboutIcon:{width:52,height:52,borderRadius:17,backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center"},
  aboutText:{flex:1,marginLeft:14},
  aboutTitle:{fontSize:18,fontWeight:"900",color:"#2D4031"},
  aboutVersion:{marginTop:2,fontSize:12,fontWeight:"800",color:"#58705D"},
  aboutDetail:{marginTop:5,fontSize:11,lineHeight:16,color:"#6F7B71"}
  ,documentFooter:{marginTop:15,paddingTop:14,borderTopWidth:1,borderTopColor:"#CBD6CA",alignItems:"center"}
  ,footerTitle:{fontSize:12,fontWeight:"900",color:"#2D4031"}
  ,footerInfo:{marginTop:4,fontSize:11,fontWeight:"800",color:"#526357"}
  ,footerDivider:{width:48,height:1,marginTop:11,backgroundColor:"#CBD6CA"}
  ,footerBrand:{marginTop:11,fontSize:12,fontWeight:"900",color:"#2D4031",textAlign:"center"}
  ,footerMotto:{marginTop:5,fontSize:11,fontWeight:"900",color:"#526357"}
});

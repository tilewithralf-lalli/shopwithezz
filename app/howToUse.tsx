import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {HANDS_FREE_COMMANDS} from "../constants/handsFreeCommands";


const STEPS = [
  "Set your shopping budget.",
  "Add, scan or import your shopping items.",
  "Open Shopping List and tap the microphone to speak.",
  "Tick each item as it goes into your trolley.",
  "Share or print your list when needed."
] as const;


export default function HowToUseScreen(){

  const router = useRouter();
  const insets = useSafeAreaInsets();

  return(
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:Math.max(insets.top,18)+10,
            paddingBottom:Math.max(insets.bottom,20)+30
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={()=>router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#426047"/>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>How to Use</Text>
            <Text style={styles.subtitle}>Simple shopping and speaking help</Text>
          </View>
        </View>

        <View style={styles.importantCard}>
          <Ionicons name="alert-circle" size={30} color="#B3261E"/>
          <View style={styles.importantText}>
            <Text style={styles.importantTitle}>IN HANDS-FREE MODE, SAY “I NEED” FIRST</Text>
            <Text style={styles.importantExample}>Example: “I need milk.”</Text>
            <Text style={styles.importantDetail}>You only need to say “I need” when you start Shopping Mode. After that, just keep saying the item names.</Text>
            <Text style={styles.importantTimer}>You have 15 seconds to say the next item.</Text>
            <Text style={styles.importantDetail}>If the timer runs out, say “I need” once again to restart Shopping Mode.</Text>
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="cart" size={26} color="#426047"/>
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Shopping made simple</Text>
            <Text style={styles.introDetail}>Follow these steps, or use the exact speaking commands shown below.</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>BASIC STEPS</Text>
        <View style={styles.card}>
          {STEPS.map((step,index)=>(
            <View key={step} style={[styles.step,index > 0 && styles.withDivider]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index+1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>WHAT TO SAY</Text>
        <View style={styles.voiceTip}>
          <Ionicons name="mic" size={23} color="#FFFFFF"/>
          <Text style={styles.voiceTipText}>Open Shopping List, tap the microphone, then say one of these commands.</Text>
        </View>

        <View style={styles.card}>
          {HANDS_FREE_COMMANDS.map((item,index)=>(
            <View
              key={item.command}
              style={[styles.command,index > 0 && styles.withDivider]}
            >
              <View style={styles.quoteIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#426047"/>
              </View>
              <View style={styles.commandText}>
                <Text style={styles.commandPhrase}>“{item.command}”</Text>
                <Text style={styles.commandDetail}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#7D5A46"/>
          <Text style={styles.safetyText}>Delete commands always ask for confirmation before anything is removed.</Text>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  screen:{
    flex:1,
    backgroundColor:"#FBF7F2"
  },
  content:{
    paddingHorizontal:18
  },
  header:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:20
  },
  backButton:{
    width:44,
    height:44,
    borderRadius:15,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#E8F0E6",
    borderWidth:1,
    borderColor:"#D7E4D5"
  },
  headerText:{
    flex:1,
    marginLeft:13
  },
  title:{
    fontSize:27,
    fontWeight:"900",
    color:"#3E4B3C"
  },
  subtitle:{
    marginTop:2,
    fontSize:13,
    fontWeight:"600",
    color:"#7B6F68"
  },
  importantCard:{
    flexDirection:"row",
    alignItems:"flex-start",
    marginBottom:14,
    padding:16,
    borderRadius:18,
    backgroundColor:"#FFF0EF",
    borderWidth:2,
    borderColor:"#D64A41"
  },
  importantText:{
    flex:1,
    marginLeft:11
  },
  importantTitle:{
    fontSize:19,
    lineHeight:24,
    fontWeight:"900",
    color:"#B3261E"
  },
  importantExample:{
    marginTop:7,
    fontSize:18,
    lineHeight:23,
    fontWeight:"900",
    color:"#B3261E"
  },
  importantDetail:{
    marginTop:6,
    fontSize:13,
    lineHeight:18,
    fontWeight:"700",
    color:"#7D302B"
  },
  importantTimer:{
    marginTop:7,
    fontSize:16,
    lineHeight:21,
    fontWeight:"900",
    color:"#B3261E"
  },
  introCard:{
    flexDirection:"row",
    alignItems:"center",
    padding:16,
    borderRadius:19,
    backgroundColor:"#F3E7E2"
  },
  introIcon:{
    width:48,
    height:48,
    borderRadius:16,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#FFFFFF"
  },
  introText:{
    flex:1,
    marginLeft:13
  },
  introTitle:{
    fontSize:17,
    fontWeight:"900",
    color:"#4A433F"
  },
  introDetail:{
    marginTop:4,
    fontSize:13,
    lineHeight:18,
    color:"#766861"
  },
  sectionLabel:{
    marginTop:25,
    marginBottom:9,
    marginLeft:4,
    fontSize:11,
    fontWeight:"900",
    letterSpacing:1.3,
    color:"#7B6F68"
  },
  card:{
    paddingHorizontal:15,
    borderRadius:19,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#E8E1DA"
  },
  step:{
    flexDirection:"row",
    alignItems:"center",
    minHeight:68,
    paddingVertical:11
  },
  withDivider:{
    borderTopWidth:1,
    borderTopColor:"#EEE8E2"
  },
  stepNumber:{
    width:34,
    height:34,
    borderRadius:12,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#E8F0E6"
  },
  stepNumberText:{
    fontSize:15,
    fontWeight:"900",
    color:"#426047"
  },
  stepText:{
    flex:1,
    marginLeft:12,
    fontSize:15,
    lineHeight:20,
    fontWeight:"700",
    color:"#4A4845"
  },
  voiceTip:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:10,
    padding:14,
    borderRadius:17,
    backgroundColor:"#526D56"
  },
  voiceTipText:{
    flex:1,
    marginLeft:11,
    fontSize:14,
    lineHeight:19,
    fontWeight:"700",
    color:"#FFFFFF"
  },
  command:{
    flexDirection:"row",
    alignItems:"center",
    minHeight:72,
    paddingVertical:12
  },
  quoteIcon:{
    width:38,
    height:38,
    borderRadius:13,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#E8F0E6"
  },
  commandText:{
    flex:1,
    marginLeft:12
  },
  commandPhrase:{
    fontSize:16,
    fontWeight:"900",
    color:"#3E4B3C"
  },
  commandDetail:{
    marginTop:3,
    fontSize:13,
    lineHeight:18,
    color:"#776D66"
  },
  safetyCard:{
    flexDirection:"row",
    alignItems:"center",
    marginTop:16,
    padding:15,
    borderRadius:17,
    backgroundColor:"#F4E7DC"
  },
  safetyText:{
    flex:1,
    marginLeft:11,
    fontSize:13,
    lineHeight:19,
    fontWeight:"700",
    color:"#6D5141"
  }
});

import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import {
    Image
} from "expo-image";

import {
    useRouter
} from "expo-router";

import {
    Ionicons
} from "@expo/vector-icons";

import {
    useSafeAreaInsets
} from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    useShareIntentContext
} from "expo-share-intent";


const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";


type ShoppingItem = {
  id:string;
  name:string;
  price:number;
  purchased:boolean;
  quantity:number;
};

type ShoppingSession = {
  budget:number;
  spent?:number;
  items:ShoppingItem[];
};


function cleanRecognisedLines(
  recognised:string[]
){

  return recognised
    .flatMap(block=>block.split(/\r?\n/))
    .map(line=>
      line
        .replace(/^[\s\-•*✓✔☐☑\d.)]+/u,"")
        .replace(/\s+/g," ")
        .trim()
    )
    .filter(line=>
      line.length > 1
      &&
      line.length < 80
    )
    .filter((line,index,all)=>
      all.findIndex(
        candidate=>
          candidate.toLowerCase()
          ===
          line.toLowerCase()
      ) === index
    );

}


export default function ImportPhotoScreen(){

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAndroid =
    Platform.OS === "android";

  const {
    shareIntent,
    resetShareIntent
  } =
    useShareIntentContext();

  const image =
    useMemo(
      ()=>shareIntent.files?.find(
        file=>file.mimeType.startsWith("image/")
      ),
      [shareIntent.files]
    );

  const [itemsText,setItemsText] =
    useState("");

  const [reading,setReading] =
    useState(false);

  const [saving,setSaving] =
    useState(false);

  useEffect(()=>{

    if(!isAndroid){
      return;
    }

    if(!image?.path){
      return;
    }

    let active = true;

    async function readPhoto(){

      setReading(true);

      try{
        const {
          extractTextFromImage
        } =
          await import(
            "@zhanziyang/expo-text-extractor"
          );

        const recognised =
          await extractTextFromImage(
            image!.path
          );

        if(active){
          setItemsText(
            cleanRecognisedLines(
              recognised
            ).join("\n")
          );
        }
      }catch{
        if(active){
          Alert.alert(
            "Photo Reader Needs The New Build",
            "The photo is ready, but text reading will work after the Android app is rebuilt."
          );
        }
      }finally{
        if(active){
          setReading(false);
        }
      }

    }

    readPhoto();

    return ()=>{
      active = false;
    };

  },[image,isAndroid]);

  function closeImport(){

    resetShareIntent();
    router.replace("/");

  }

  async function addItems(){

    const names =
      cleanRecognisedLines([itemsText]);

    if(!names.length){
      Alert.alert(
        "No Items Yet",
        "Type one shopping item on each line."
      );
      return;
    }

    setSaving(true);

    try{
      const saved =
        await AsyncStorage.getItem(
          SESSION_KEY
        );

      const session:ShoppingSession =
        saved
          ? JSON.parse(saved)
          : {
              budget:0,
              spent:0,
              items:[]
            };

      const existingNames =
        new Set(
          session.items.map(
            item=>
              item.name
                .trim()
                .toLowerCase()
          )
        );

      const newItems =
        names
          .filter(name=>
            !existingNames.has(
              name.toLowerCase()
            )
          )
          .map((name,index)=>({
            id:`photo-${Date.now()}-${index}`,
            name,
            price:0,
            purchased:false,
            quantity:1
          }));

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...session,
          spent:0,
          items:[
            ...session.items,
            ...newItems
          ]
        })
      );

      resetShareIntent();

      Alert.alert(
        "Items Added",
        `${newItems.length} item${newItems.length === 1 ? "" : "s"} added to your shopping list.`,
        [
          {
            text:"Open List",
            onPress:()=>
              router.replace("/shoppingList")
          }
        ]
      );
    }catch{
      Alert.alert(
        "Could Not Add Items",
        "Please try importing the photo again."
      );
    }finally{
      setSaving(false);
    }

  }

  if(!image){

    if(!isAndroid){
      return(
        <View style={[
          styles.emptyScreen,
          {
            paddingTop:insets.top + 20,
            paddingBottom:insets.bottom + 20
          }
        ]}>
          <Ionicons
            name="phone-portrait-outline"
            size={46}
            color="#7B8F75"
          />
          <Text style={styles.emptyTitle}>
            Photo import is Android only for now
          </Text>
          <Text style={styles.emptyText}>
            You can still use shopping lists, scanning, and manual entry on iPhone.
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={closeImport}
          >
            <Text style={styles.homeButtonText}>
              Return Home
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return(
      <View style={[
        styles.emptyScreen,
        {
          paddingTop:insets.top + 20,
          paddingBottom:insets.bottom + 20
        }
      ]}>
        <Ionicons
          name="images-outline"
          size={46}
          color="#7B8F75"
        />
        <Text style={styles.emptyTitle}>
          No shared photo found
        </Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={closeImport}
        >
          <Text style={styles.homeButtonText}>
            Return Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return(
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop:insets.top + 14,
          paddingBottom:insets.bottom + 24
        }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeImport}
          accessibilityLabel="Close photo import"
        >
          <Ionicons
            name="close"
            size={22}
            color="#536650"
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>
            SHARED FROM YOUR PHONE
          </Text>
          <Text style={styles.title}>
            Import Shopping Photo
          </Text>
        </View>
      </View>

      <View style={styles.photoCard}>
        <Image
          source={{uri:image.path}}
          style={styles.photo}
          contentFit="contain"
          transition={180}
        />
      </View>

      <View style={styles.readerCard}>
        <View style={styles.readerHeading}>
          <View style={styles.readerIcon}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.readerHeadingText}>
            <Text style={styles.readerTitle}>
              Items found
            </Text>
            <Text style={styles.readerHint}>
              Check the words before adding them
            </Text>
          </View>
          {reading && (
            <ActivityIndicator
              color="#7B8F75"
            />
          )}
        </View>

        <TextInput
          style={styles.itemsInput}
          value={itemsText}
          onChangeText={setItemsText}
          placeholder={
            reading
              ? "Reading your photo..."
              : "One shopping item on each line"
          }
          placeholderTextColor="#A28E83"
          multiline
          textAlignVertical="top"
          editable={!reading}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          (
            reading
            ||
            saving
            ||
            !itemsText.trim()
          )
          &&
          styles.addButtonDisabled
        ]}
        onPress={addItems}
        disabled={
          reading
          ||
          saving
          ||
          !itemsText.trim()
        }
      >
        {saving
          ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            )
          : (
              <>
                <Ionicons
                  name="bag-add-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.addButtonText}>
                  Add Items To Shopping List
                </Text>
              </>
            )}
      </TouchableOpacity>

      <Text style={styles.privacy}>
        Your photo is read privately on this phone.
      </Text>
    </ScrollView>
  );

}


const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#FBF8F5"},
  content:{paddingHorizontal:18},
  header:{flexDirection:"row",alignItems:"center"},
  closeButton:{width:44,height:44,borderRadius:15,backgroundColor:"#E6EEE2",alignItems:"center",justifyContent:"center"},
  headerText:{flex:1,marginLeft:12},
  eyebrow:{fontSize:9,fontWeight:"900",letterSpacing:1.1,color:"#A28E83"},
  title:{marginTop:3,fontSize:22,fontWeight:"900",color:"#3E4B3C"},
  photoCard:{height:270,marginTop:18,padding:8,borderRadius:22,backgroundColor:"#F3E7E2",borderWidth:1,borderColor:"#E7D8D1",overflow:"hidden"},
  photo:{width:"100%",height:"100%",borderRadius:16},
  readerCard:{marginTop:14,padding:14,borderRadius:20,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#EEE7E0"},
  readerHeading:{flexDirection:"row",alignItems:"center"},
  readerIcon:{width:38,height:38,borderRadius:13,backgroundColor:"#7B8F75",alignItems:"center",justifyContent:"center"},
  readerHeadingText:{flex:1,marginLeft:10},
  readerTitle:{fontSize:16,fontWeight:"900",color:"#463E3B"},
  readerHint:{marginTop:2,fontSize:10,fontWeight:"700",color:"#947F75"},
  itemsInput:{minHeight:170,marginTop:12,padding:12,borderRadius:15,backgroundColor:"#F7F3EE",fontSize:15,fontWeight:"700",lineHeight:23,color:"#3E4B3C"},
  addButton:{height:54,marginTop:14,borderRadius:18,backgroundColor:"#7B8F75",flexDirection:"row",alignItems:"center",justifyContent:"center",elevation:3},
  addButtonDisabled:{backgroundColor:"#B8C5B4",elevation:0},
  addButtonText:{marginLeft:8,fontSize:14,fontWeight:"900",color:"#FFFFFF"},
  privacy:{marginTop:10,textAlign:"center",fontSize:10,fontWeight:"700",color:"#947F75"},
  emptyScreen:{flex:1,paddingHorizontal:24,backgroundColor:"#FBF8F5",alignItems:"center",justifyContent:"center"},
  emptyTitle:{marginTop:12,fontSize:19,fontWeight:"900",color:"#463E3B"},
  homeButton:{marginTop:18,paddingVertical:12,paddingHorizontal:20,borderRadius:14,backgroundColor:"#7B8F75"},
  homeButtonText:{fontSize:13,fontWeight:"900",color:"#FFFFFF"}
});

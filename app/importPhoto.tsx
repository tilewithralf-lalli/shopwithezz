import React, {useEffect, useMemo, useState} from "react";
import {ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Image} from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {Images} from "react-native-nitro-image";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useShareIntentContext} from "expo-share-intent";
import {getActiveList, saveActiveSession} from "../storage/shoppingLists";

type ShoppingItem = {id:string; name:string; price:number; purchased:boolean; quantity:number};

function tidyText(text:string){
  return text.split(/\r?\n/).map(line=>line.replace(/\s+/g," ").trim()).filter(line=>line.length > 1 && line.length < 100);
}

function parseShelfPrice(value:string){
  const cleaned = value.replace(/\s/g,"");
  if(/[.,]/.test(cleaned)){
    return Number(cleaned.replace(",","."));
  }
  // OCR can lose the decimal point on shelf labels: "$17.50" becomes "$1750".
  // Treat 3–4 digit currency amounts as cents, while leaving plain "$5" / "$25" alone.
  if(/^\d{3,4}$/.test(cleaned)){
    return Number(cleaned) / 100;
  }
  return Number(cleaned);
}

function prepareResult(text:string){
  const lines = tidyText(text);
  const pricePattern = /(?:\$|aud\s*)\s*(\d{1,4}(?:[.,]\d{2})?)/i;
  const ignoredPriceLine = /\b(?:was|save)\b|(?:\$|aud\s*)?\s*\d+(?:[.,]\d{2})?\s*(?:\/|\bper\b)\s*(?:100\s*(?:g|ml)|kg|g|l|ml|ea\b)/i;
  // Big shelf prices are often recognised without a dollar sign (for example, "14").
  // Prefer that standalone price over a smaller unit price such as "$5.28 per 100g".
  const standalonePricePattern = /^\s*\$?\s*(\d{1,4}(?:[.,]\d{2})?)\s*$/;
  const standalonePriceLine = lines.findIndex(line=>standalonePricePattern.test(line) && !ignoredPriceLine.test(line));
  const priceLine = standalonePriceLine >= 0 ? standalonePriceLine : lines.findIndex(line=>pricePattern.test(line) && !ignoredPriceLine.test(line));
  const selectedPattern = standalonePriceLine >= 0 ? standalonePricePattern : pricePattern;
  const match = priceLine >= 0 ? lines[priceLine].match(selectedPattern) : null;
  const price = match ? parseShelfPrice(match[1]) : 0;
  const nameOnPriceLine = priceLine >= 0 ? lines[priceLine].replace(selectedPattern,"").replace(/[|·–—-]+/g," ").trim() : "";
  const isProductLine = (line:string)=>/\b[a-z]{3,}\b/i.test(line)
    && !pricePattern.test(line)
    && !ignoredPriceLine.test(line)
    && !/^(?:lower|shelf price|range|was|save|contents|gross weight|ea)$/i.test(line);
  const productLinesAfterPrice = priceLine >= 0 ? lines.slice(priceLine + 1).filter(isProductLine) : [];
  const nearbyName = productLinesAfterPrice.length
    ? productLinesAfterPrice.slice(0,3).join(" ")
    : lines.slice(0, priceLine >= 0 ? priceLine : lines.length).reverse().find(isProductLine);
  return {name:nameOnPriceLine || nearbyName || "", price};
}

export default function ImportPhotoScreen(){
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {shareIntent, resetShareIntent} = useShareIntentContext();
  const sharedImage = useMemo(()=>shareIntent.files?.find(file=>file.mimeType.startsWith("image/")),[shareIntent.files]);
  const [imageUri,setImageUri] = useState<string | null>(sharedImage?.path || null);
  const [itemName,setItemName] = useState("");
  const [itemPrice,setItemPrice] = useState("");
  const [rawText,setRawText] = useState("");
  const [reading,setReading] = useState(false);
  const [saving,setSaving] = useState(false);

  useEffect(()=>{ if(sharedImage?.path){ setImageUri(sharedImage.path); } },[sharedImage?.path]);

  useEffect(()=>{
    if(!imageUri || Platform.OS !== "android"){ return; }
    let active = true;
    async function readPhoto(){
      setReading(true); setItemName(""); setItemPrice(""); setRawText("");
      try{
        const {extractTextFromImage} = await import("@zhanziyang/expo-text-extractor");
        const recognised = await extractTextFromImage(imageUri!);
        let text = tidyText(recognised.join("\n")).join("\n");
        let prepared = prepareResult(text);
        // A wide shop photo can read the price but miss the small product name.
        // When that happens, read the middle shelf-label band as a second pass.
        if(!prepared.name || !prepared.price){
          try{
            const original = await Images.loadFromFileAsync(imageUri!.replace(/^file:\/\//,""));
            const shelfBand = await original.cropAsync(0, original.height * 0.30, original.width, original.height * 0.75);
            const shelfBandPath = await shelfBand.saveToTemporaryFileAsync("jpg",100);
            const shelfText = tidyText((await extractTextFromImage(`file://${shelfBandPath}`)).join("\n")).join("\n");
            const shelfResult = prepareResult(shelfText);
            text = [text,shelfText].filter(Boolean).join("\n");
            prepared = {name:shelfResult.name || prepared.name,price:prepared.price || shelfResult.price};
          }catch{
            // The first read is still usable for price-only labels.
          }
        }
        if(active){ setRawText(text); setItemName(prepared.name); setItemPrice(prepared.price ? prepared.price.toFixed(2) : ""); }
      }catch{
        if(active){ Alert.alert("Could Not Read Photo", "Use a close photo of the printed item label and price tag, then try again."); }
      }finally{ if(active){ setReading(false); } }
    }
    readPhoto();
    return ()=>{ active=false; };
  },[imageUri]);

  async function takePhoto(){
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if(!permission.granted){ Alert.alert("Camera Permission Needed", "Allow camera access to take a photo of an item label or price tag."); return; }
    const result = await ImagePicker.launchCameraAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,quality:0.85,exif:true});
    if(!result.canceled){ await preparePickedImage(result.assets[0]); }
  }

  async function choosePhoto(){
    const result = await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,quality:0.85,exif:true});
    if(!result.canceled){ await preparePickedImage(result.assets[0]); }
  }

  async function preparePickedImage(asset:ImagePicker.ImagePickerAsset){
    const orientation = Number(asset.exif?.Orientation ?? asset.exif?.orientation ?? 1);
    const degrees = orientation === 3 ? 180 : orientation === 6 ? 90 : orientation === 8 ? 270 : 0;
    if(!degrees){ setImageUri(asset.uri); return; }
    try{
      const original = await Images.loadFromFileAsync(asset.uri.replace(/^file:\/\//,""));
      const corrected = await original.rotateAsync(degrees,false);
      setImageUri(`file://${await corrected.saveToTemporaryFileAsync("jpg",100)}`);
    }catch{
      setImageUri(asset.uri);
    }
  }

  async function turnRightWayUp(){
    if(!imageUri || reading){ return; }
    setReading(true);
    try{
      const original = await Images.loadFromFileAsync(imageUri.replace(/^file:\/\//,""));
      const corrected = await original.rotateAsync(180,false);
      const correctedPath = await corrected.saveToTemporaryFileAsync("jpg",100);
      setImageUri(`file://${correctedPath}`);
    }catch{
      Alert.alert("Could Not Turn Photo", "Try taking the photo again with the phone upright.");
    }finally{
      setReading(false);
    }
  }

  function leave(){ resetShareIntent(); router.replace("/"); }

  async function addToList(){
    const name = itemName.trim();
    const price = Number(itemPrice.replace(",","."));
    if(!name){ Alert.alert("Check Item Name", "Type the item name before adding it."); return; }
    if(itemPrice.trim() && (!Number.isFinite(price) || price < 0)){ Alert.alert("Check Price", "Enter a valid price, for example 4.80."); return; }
    setSaving(true);
    try{
      const activeList = await getActiveList();
      const item:ShoppingItem = {id:`photo-${Date.now()}`,name,price:itemPrice.trim()?price:0,purchased:false,quantity:1};
      await saveActiveSession({...activeList.session,spent:0,items:[...activeList.session.items,item]});
      resetShareIntent();
      setImageUri(null); setItemName(""); setItemPrice(""); setRawText("");
      Alert.alert("Added To Shopping List",`${name} has been added. You can take or choose another photo, or press X when you are finished.`);
    }catch{ Alert.alert("Could Not Add Item","Please try again."); }
    finally{ setSaving(false); }
  }

  if(Platform.OS !== "android"){
    return <View style={[styles.empty,{paddingTop:insets.top+20,paddingBottom:insets.bottom+20}]}><Ionicons name="phone-portrait-outline" size={46} color="#7B8F75"/><Text style={styles.emptyTitle}>Photo reader is Android only for now</Text><TouchableOpacity style={styles.backLink} onPress={leave}><Text style={styles.backLinkText}>Return Home</Text></TouchableOpacity></View>;
  }

  if(!imageUri){
    return <View style={[styles.empty,{paddingTop:insets.top+20,paddingBottom:insets.bottom+20}]}>
      <Ionicons name="receipt-outline" size={48} color="#7B8F75"/>
      <Text style={styles.emptyTitle}>Read Item And Price</Text>
      <Text style={styles.emptyText}>Take a close photo of a printed label or price tag, or choose a photo already on your phone.</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}><Ionicons name="camera-outline" size={21} color="#fff"/><Text style={styles.primaryButtonText}>Take Photo</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={choosePhoto}><Ionicons name="images-outline" size={21} color="#536650"/><Text style={styles.secondaryButtonText}>Choose From Phone</Text></TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={leave}><Text style={styles.backLinkText}>Return Home</Text></TouchableOpacity>
    </View>;
  }

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content,{paddingTop:insets.top+14,paddingBottom:insets.bottom+24}]} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><TouchableOpacity style={styles.closeButton} onPress={leave}><Ionicons name="close" size={22} color="#536650"/></TouchableOpacity><View style={styles.headerText}><Text style={styles.eyebrow}>PHOTO / IMPORT EXPERIMENT</Text><Text style={styles.title}>Check Item And Price</Text></View></View>
    <View style={styles.photoCard}><Image source={{uri:imageUri}} style={styles.photo} contentFit="contain"/></View>
    <View style={styles.switchRow}><TouchableOpacity style={styles.switchButton} onPress={takePhoto}><Ionicons name="camera-outline" size={17} color="#536650"/><Text style={styles.switchText}>Take Another</Text></TouchableOpacity><TouchableOpacity style={styles.switchButton} onPress={choosePhoto}><Ionicons name="images-outline" size={17} color="#536650"/><Text style={styles.switchText}>Choose Photo</Text></TouchableOpacity></View>
    <TouchableOpacity style={styles.rotateButton} onPress={turnRightWayUp} disabled={reading}><Ionicons name="sync-outline" size={18} color="#536650"/><Text style={styles.rotateText}>Turn Right Way Up</Text></TouchableOpacity>
    <View style={styles.readerCard}><View style={styles.readerHeading}><View style={styles.readerIcon}><Ionicons name="sparkles-outline" size={18} color="#fff"/></View><View style={styles.readerHeadingText}><Text style={styles.readerTitle}>Prepared result</Text><Text style={styles.readerHint}>{reading?"Reading printed text...":"Check it before adding"}</Text></View>{reading&&<ActivityIndicator color="#7B8F75"/>}</View>
      <Text style={styles.label}>ITEM</Text><TextInput style={styles.field} value={itemName} onChangeText={setItemName} editable={!reading} placeholder="Item name" placeholderTextColor="#A28E83"/>
      <Text style={styles.label}>PRICE</Text><TextInput style={styles.field} value={itemPrice} onChangeText={setItemPrice} editable={!reading} keyboardType="decimal-pad" placeholder="$0.00" placeholderTextColor="#A28E83"/>
      {!!rawText&&<Text style={styles.readText}>Text found: {rawText}</Text>}
    </View>
    <TouchableOpacity style={[styles.addButton,(reading||saving||!itemName.trim())&&styles.addButtonDisabled]} onPress={addToList} disabled={reading||saving||!itemName.trim()}>{saving?<ActivityIndicator color="#fff"/>:<><Ionicons name="bag-add-outline" size={20} color="#fff"/><Text style={styles.addButtonText}>Add To Shopping List</Text></>}</TouchableOpacity>
    <Text style={styles.privacy}>Your photo is read privately on this phone.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#FBF8F5"},content:{paddingHorizontal:18},empty:{flex:1,paddingHorizontal:24,backgroundColor:"#FBF8F5",alignItems:"center",justifyContent:"center"},emptyTitle:{marginTop:12,fontSize:21,fontWeight:"900",color:"#463E3B",textAlign:"center"},emptyText:{marginTop:9,fontSize:15,lineHeight:22,fontWeight:"600",color:"#655F59",textAlign:"center"},primaryButton:{height:55,alignSelf:"stretch",marginTop:25,borderRadius:17,backgroundColor:"#7B8F75",alignItems:"center",justifyContent:"center",flexDirection:"row"},primaryButtonText:{marginLeft:8,fontSize:15,fontWeight:"900",color:"#fff"},secondaryButton:{height:55,alignSelf:"stretch",marginTop:10,borderRadius:17,borderWidth:1,borderColor:"#B7C6B2",backgroundColor:"#EDF3EB",alignItems:"center",justifyContent:"center",flexDirection:"row"},secondaryButtonText:{marginLeft:8,fontSize:15,fontWeight:"900",color:"#536650"},backLink:{marginTop:18,padding:10},backLinkText:{fontSize:13,fontWeight:"800",color:"#536650"},header:{flexDirection:"row",alignItems:"center"},closeButton:{width:44,height:44,borderRadius:15,backgroundColor:"#E6EEE2",alignItems:"center",justifyContent:"center"},headerText:{flex:1,marginLeft:12},eyebrow:{fontSize:9,fontWeight:"900",letterSpacing:1.1,color:"#A28E83"},title:{marginTop:3,fontSize:22,fontWeight:"900",color:"#3E4B3C"},photoCard:{height:270,marginTop:18,padding:8,borderRadius:22,backgroundColor:"#F3E7E2",borderWidth:1,borderColor:"#E7D8D1",overflow:"hidden"},photo:{width:"100%",height:"100%",borderRadius:16},switchRow:{flexDirection:"row",gap:10,marginTop:11},switchButton:{flex:1,height:42,borderRadius:14,backgroundColor:"#EDF3EB",alignItems:"center",justifyContent:"center",flexDirection:"row"},switchText:{marginLeft:6,fontSize:12,fontWeight:"900",color:"#536650"},rotateButton:{height:42,marginTop:10,borderRadius:14,backgroundColor:"#EDF3EB",alignItems:"center",justifyContent:"center",flexDirection:"row"},rotateText:{marginLeft:6,fontSize:12,fontWeight:"900",color:"#536650"},readerCard:{marginTop:14,padding:14,borderRadius:20,backgroundColor:"#fff",borderWidth:1,borderColor:"#EEE7E0"},readerHeading:{flexDirection:"row",alignItems:"center"},readerIcon:{width:38,height:38,borderRadius:13,backgroundColor:"#7B8F75",alignItems:"center",justifyContent:"center"},readerHeadingText:{flex:1,marginLeft:10},readerTitle:{fontSize:16,fontWeight:"900",color:"#463E3B"},readerHint:{marginTop:2,fontSize:10,fontWeight:"700",color:"#947F75"},label:{marginTop:14,fontSize:10,fontWeight:"900",letterSpacing:1,color:"#947F75"},field:{height:48,marginTop:5,paddingHorizontal:13,borderRadius:14,backgroundColor:"#F7F3EE",fontSize:16,fontWeight:"800",color:"#3E4B3C"},readText:{marginTop:13,fontSize:11,lineHeight:17,color:"#655F59"},addButton:{height:54,marginTop:14,borderRadius:18,backgroundColor:"#7B8F75",flexDirection:"row",alignItems:"center",justifyContent:"center",elevation:3},addButtonDisabled:{backgroundColor:"#B8C5B4",elevation:0},addButtonText:{marginLeft:8,fontSize:14,fontWeight:"900",color:"#fff"},privacy:{marginTop:10,textAlign:"center",fontSize:10,fontWeight:"700",color:"#947F75"}
});

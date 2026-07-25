import React, {
  useRef,
  useState
} from "react";

import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";

import {
  Ionicons
} from "@expo/vector-icons";

import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult
} from "expo-camera";

import {
  useLocalSearchParams,
  useRouter
} from "expo-router";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  addPantryItem
} from "../storage/shopping";

import {
  categoryForName
} from "../constants/shoppingCategories";

const SESSION_KEY =
  "shopwithezz-v1-final-session-v1";


export default function ScannerScreen(){

  const router =
    useRouter();

  const params =
    useLocalSearchParams();

  const isPantryMode =
    String(params.mode || "")
    ===
    "pantry";

  const isShoppingListMode =
    String(params.mode || "")
    ===
    "shoppingList";

  const [
    permission,
    requestPermission
  ] =
    useCameraPermissions();

  const [scanned,setScanned] =
    useState(false);

  const [lookingUp,setLookingUp] =
    useState(false);

  const [reviewBarcode,setReviewBarcode] =
    useState("");

  const [reviewName,setReviewName] =
    useState("");

  const [reviewPrice,setReviewPrice] =
    useState("");

  const [duplicateFound,setDuplicateFound] =
    useState(false);

  const [duplicateItemId,setDuplicateItemId] =
    useState("");

  const [savingItem,setSavingItem] =
    useState(false);

  const scanLock =
    useRef(false);

  function resetScanner(){

    scanLock.current = false;
    setScanned(false);
    setLookingUp(false);
    setReviewBarcode("");
    setReviewName("");
    setReviewPrice("");
    setDuplicateFound(false);
    setDuplicateItemId("");

  }


  async function addReviewedItem(){

    const finalName =
      reviewName.trim();

    if(!finalName){

      Alert.alert(
        "Product Name Required",
        "Enter a product name before adding it to your shopping list."
      );

      return;

    }

    const normalizedPrice =
      reviewPrice.trim().replace(",",".");

    const price =
      normalizedPrice
        ? Number(normalizedPrice)
        : 0;

    if(!Number.isFinite(price) || price < 0){

      Alert.alert(
        "Check The Price",
        "Enter a valid price, or leave it blank."
      );

      return;

    }

    setSavingItem(true);

    try{

      const savedSession =
        await AsyncStorage.getItem(
          SESSION_KEY
        );

      const currentSession =
        savedSession
          ? JSON.parse(savedSession)
          : {
              budget:0,
              spent:0,
              items:[]
            };

      const currentItems =
        Array.isArray(currentSession.items)
          ? currentSession.items
          : [];

      if(duplicateFound && duplicateItemId){

        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            ...currentSession,
            items:currentItems.map(
              (item:{
                id?:unknown;
                quantity?:unknown;
                price?:unknown;
              })=>
                String(item.id || "")
                ===
                duplicateItemId
                  ? {
                      ...item,
                      quantity:
                        Math.max(
                          1,
                          Math.floor(
                            Number(item.quantity || 1)
                          )
                        )
                        +
                        1,
                      price:
                        normalizedPrice
                          ? price
                          : Number(item.price || 0)
                    }
                  : item
            )
          })
        );

        router.back();
        return;

      }

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...currentSession,
          items:[
            ...currentItems,
            {
              id:`${Date.now()}-${Math.random()}`,
              name:finalName,
              price,
              purchased:false,
              barcode:reviewBarcode,
              quantity:1,
              category:categoryForName(finalName)
            }
          ]
        })
      );

      router.back();

    }
    catch(error){

      setSavingItem(false);

      Alert.alert(
        "Could Not Add Item",
        "The scanned item could not be added to your shopping list."
      );

    }

  }


  async function barcodeScanned(
    result:BarcodeScanningResult
  ){

    if(scanLock.current){
      return;
    }

    scanLock.current = true;
    setScanned(true);

    setLookingUp(true);

    const barcode =
      result.data;

    let productName =
      String(params.name || "");

    if(!productName.trim()){

      try{

        const response =
          await fetch(

            `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`

          );

        const productData =
          await response.json();

        if(
          productData.status === 1
          &&
          productData.product
        ){

          productName =
            String(

              productData.product.product_name

              ||

              productData.product.generic_name

              ||

              productData.product.brands

              ||

              ""

            ).trim();

        }

      }
      catch(error){

        productName =
          String(params.name || "");

      }

    }

    setLookingUp(false);

    if(isShoppingListMode){

      const finalName =
        productName.trim()

        ||

        `Product ${barcode}`;

      try{

        const savedSession =
          await AsyncStorage.getItem(
            SESSION_KEY
          );

        const currentSession =
          savedSession
            ? JSON.parse(savedSession)
            : {
                budget:0,
                spent:0,
                items:[]
              };

        const currentItems =
          Array.isArray(currentSession.items)
            ? currentSession.items
            : [];

        const duplicateItem =
          currentItems.find(
            (item:{
              id?:unknown;
              barcode?:unknown;
            })=>
              String(item.barcode || "")
              ===
              barcode
          );

        setReviewBarcode(barcode);
        setReviewName(finalName);
        setReviewPrice("");
        setDuplicateFound(!!duplicateItem);
        setDuplicateItemId(
          duplicateItem
            ? String(duplicateItem.id || "")
            : ""
        );

      }
      catch(error){

        Alert.alert(
          "Could Not Review Item",
          "The scanned product could not be prepared for review.",
          [
            {
              text:"Try Again",
              onPress:resetScanner
            },
            {
              text:"Cancel",
              style:"cancel",
              onPress:()=>router.back()
            }
          ]
        );

      }

      return;

    }


    if(isPantryMode){

      const finalName =
        productName.trim()

        ||

        `Product ${barcode}`;

      try{

        await addPantryItem({

          name:
            finalName,

          quantity:1,

          barcode

        });

        router.replace(
          "/pantry"
        );

      }
      catch(error){

        Alert.alert(

          "Could Not Add Item",

          "The scanned item could not be added to your Pantry List.",

          [

            {
              text:"Try Again",
              onPress:resetScanner
            },

            {
              text:"Cancel",
              style:"cancel",
              onPress:()=>router.replace("/pantry")
            }

          ]

        );

      }

      return;

    }


    router.replace({

      pathname:"/addItem",

      params:{

        store:
          String(params.store || ""),

        name:
          productName,

        quantity:
          String(params.quantity || "1"),

        price:
          String(params.price || ""),

        barcode

      }

    });

  }


  function cancelScanner(){

    if(isShoppingListMode){

      router.back();
      return;

    }

    if(isPantryMode){

      router.replace(
        "/pantry"
      );

      return;

    }

    router.replace({

      pathname:"/addItem",

      params:{

        store:
          String(params.store || ""),

        name:
          String(params.name || ""),

        quantity:
          String(params.quantity || "1"),

        price:
          String(params.price || ""),

        barcode:
          String(params.barcode || "")

      }

    });

  }


  if(!permission){

    return(

      <View style={styles.messageScreen}>

        <ActivityIndicator

          size="large"

          color="#2E7D32"

        />

        <Text style={styles.message}>
          Loading camera...
        </Text>

      </View>

    );

  }


  if(!permission.granted){

    return(

      <View style={styles.messageScreen}>

        <Text style={styles.permissionIcon}>
          📷
        </Text>

        <Text style={styles.permissionTitle}>
          Camera Permission
        </Text>

        <Text style={styles.permissionText}>
          ShopWithEzz needs camera access to scan product barcodes.
        </Text>

        <TouchableOpacity

          style={styles.permissionButton}

          onPress={requestPermission}

        >

          <Text style={styles.permissionButtonText}>
            Allow Camera
          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.cancelPermissionButton}

          onPress={cancelScanner}

        >

          <Text style={styles.cancelPermissionText}>
            Cancel
          </Text>

        </TouchableOpacity>

      </View>

    );

  }

  if(
    isShoppingListMode
    &&
    scanned
    &&
    !lookingUp
    &&
    reviewBarcode
  ){

    return(

      <KeyboardAvoidingView
        style={styles.reviewScreen}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        <View style={styles.reviewHeader}>
          <View style={styles.reviewIcon}>
            <Ionicons
              name="barcode-outline"
              size={31}
              color="#2E7D32"
            />
          </View>

          <Text style={styles.reviewEyebrow}>
            PRODUCT FOUND
          </Text>

          <Text style={styles.reviewTitle}>
            Check before adding
          </Text>

          <Text style={styles.reviewSubtitle}>
            Make sure the name and price look right.
          </Text>
        </View>

        <View style={styles.reviewCard}>

          {duplicateFound && (
            <View style={styles.duplicateBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color="#A15C00"
              />
              <Text style={styles.duplicateText}>
                This product is already listed. Confirm to increase its quantity.
              </Text>
            </View>
          )}

          <Text style={styles.reviewLabel}>
            PRODUCT NAME
          </Text>

          <TextInput
            style={styles.reviewInput}
            value={reviewName}
            onChangeText={setReviewName}
            placeholder="Product name"
            placeholderTextColor="#90A497"
            autoCapitalize="sentences"
            selectTextOnFocus
          />

          <Text style={styles.reviewLabel}>
            PRICE (OPTIONAL)
          </Text>

          <View style={styles.priceInputRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={reviewPrice}
              onChangeText={setReviewPrice}
              placeholder="0.00"
              placeholderTextColor="#90A497"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.barcodeCard}>
            <Ionicons
              name="barcode-outline"
              size={25}
              color="#2E7D32"
            />
            <View style={styles.barcodeDetails}>
              <Text style={styles.barcodeLabel}>
                BARCODE
              </Text>
              <Text style={styles.barcodeValue}>
                {reviewBarcode}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addReviewedButton,
              savingItem && styles.disabledButton
            ]}
            onPress={addReviewedItem}
            disabled={savingItem}
            activeOpacity={0.84}
          >
            {savingItem ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="add-circle-outline"
                size={22}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.addReviewedText}>
              {savingItem
                ? "Adding..."
                : duplicateFound
                  ? "Increase Quantity"
                  : "Add to Shopping List"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewScanAgainButton}
            onPress={resetScanner}
            disabled={savingItem}
          >
            <Ionicons
              name="scan-outline"
              size={20}
              color="#2E7D32"
            />
            <Text style={styles.reviewScanAgainText}>
              Scan Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewCancelButton}
            onPress={cancelScanner}
            disabled={savingItem}
          >
            <Text style={styles.reviewCancelText}>
              Cancel
            </Text>
          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>

    );

  }


  return(

    <View style={styles.container}>


      <CameraView

        style={StyleSheet.absoluteFillObject}

        facing="back"

        barcodeScannerSettings={{

          barcodeTypes:[

            "ean13",

            "ean8",

            "upc_a",

            "upc_e",

            "code128",

            "itf14"

          ]

        }}

        onBarcodeScanned={
          scanned
            ? undefined
            : barcodeScanned
        }

      />


      <View style={styles.overlay}>


        <View style={styles.topPanel}>

          <Text style={styles.modeBadge}>

            {isPantryMode
              ? "PANTRY LIST"
              : "STORE ITEM"}

          </Text>

          <Text style={styles.title}>

            {isPantryMode
              ? "Scan Pantry Item"
              : "Scan Barcode"}

          </Text>

          <Text style={styles.instructions}>

            {isPantryMode
              ? "Scan something you need to buy"
              : "Place the product barcode inside the box"}

          </Text>

        </View>


        <View style={styles.scannerArea}>

          <View style={styles.scannerBox}>

            <View
              style={[
                styles.corner,
                styles.topLeft
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.topRight
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.bottomLeft
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.bottomRight
              ]}
            />

            <View style={styles.scanLine}/>

          </View>

        </View>


        <View style={styles.bottomPanel}>


          {lookingUp ? (

            <View style={styles.lookupBox}>

              <ActivityIndicator

                size="small"

                color="#FFFFFF"

              />

              <Text style={styles.lookupText}>

                {isPantryMode
                  ? "Adding to Pantry List..."
                  : "Finding product..."}

              </Text>

            </View>

          ) : (

            <Text style={styles.hint}>
              Hold the camera steady
            </Text>

          )}


          {scanned && !lookingUp && (

            <TouchableOpacity

              style={styles.scanAgainButton}

              onPress={resetScanner}

            >

              <Text style={styles.scanAgainText}>
                Scan Again
              </Text>

            </TouchableOpacity>

          )}


          <TouchableOpacity

            style={styles.cancelButton}

            onPress={cancelScanner}

          >

            <Text style={styles.cancelText}>
              Cancel
            </Text>

          </TouchableOpacity>


        </View>


      </View>


    </View>

  );

}


const styles = StyleSheet.create({

  container:{

    flex:1,

    backgroundColor:"#000000"

  },


  overlay:{

    flex:1,

    backgroundColor:"rgba(0,0,0,0.28)"

  },


  topPanel:{

    paddingTop:60,

    paddingHorizontal:25,

    paddingBottom:22,

    alignItems:"center",

    backgroundColor:"rgba(0,0,0,0.64)"

  },


  modeBadge:{

    color:"#A5D6A7",

    fontSize:10,

    fontWeight:"900",

    letterSpacing:1.5,

    marginBottom:8

  },


  title:{

    color:"#FFFFFF",

    fontSize:28,

    fontWeight:"900"

  },


  instructions:{

    marginTop:8,

    color:"#E0E0E0",

    fontSize:15,

    textAlign:"center"

  },


  scannerArea:{

    flex:1,

    justifyContent:"center",

    alignItems:"center"

  },


  scannerBox:{

    width:290,

    height:190,

    position:"relative",

    backgroundColor:"rgba(255,255,255,0.06)"

  },


  corner:{

    position:"absolute",

    width:42,

    height:42,

    borderColor:"#81C784"

  },


  topLeft:{

    top:0,

    left:0,

    borderTopWidth:5,

    borderLeftWidth:5,

    borderTopLeftRadius:10

  },


  topRight:{

    top:0,

    right:0,

    borderTopWidth:5,

    borderRightWidth:5,

    borderTopRightRadius:10

  },


  bottomLeft:{

    bottom:0,

    left:0,

    borderBottomWidth:5,

    borderLeftWidth:5,

    borderBottomLeftRadius:10

  },


  bottomRight:{

    bottom:0,

    right:0,

    borderBottomWidth:5,

    borderRightWidth:5,

    borderBottomRightRadius:10

  },


  scanLine:{

    position:"absolute",

    left:18,

    right:18,

    top:"50%",

    height:2,

    backgroundColor:"#81C784"

  },


  bottomPanel:{

    paddingHorizontal:25,

    paddingTop:24,

    paddingBottom:45,

    alignItems:"center",

    backgroundColor:"rgba(0,0,0,0.68)"

  },


  hint:{

    color:"#FFFFFF",

    fontSize:15,

    fontWeight:"700",

    marginBottom:18

  },


  lookupBox:{

    flexDirection:"row",

    alignItems:"center",

    marginBottom:18

  },


  lookupText:{

    marginLeft:10,

    color:"#FFFFFF",

    fontSize:15,

    fontWeight:"700"

  },


  scanAgainButton:{

    backgroundColor:"#2E7D32",

    paddingVertical:12,

    paddingHorizontal:28,

    borderRadius:16,

    marginBottom:12

  },


  scanAgainText:{

    color:"#FFFFFF",

    fontWeight:"800"

  },


  cancelButton:{

    borderWidth:1,

    borderColor:"#FFFFFF",

    paddingVertical:11,

    paddingHorizontal:35,

    borderRadius:16

  },


  cancelText:{

    color:"#FFFFFF",

    fontSize:15,

    fontWeight:"800"

  },

  reviewScreen:{

    flex:1,

    justifyContent:"center",

    backgroundColor:"#F4F8F2",

    paddingHorizontal:20,

    paddingVertical:34

  },


  reviewHeader:{

    alignItems:"center",

    marginBottom:18

  },


  reviewIcon:{

    width:62,

    height:62,

    borderRadius:20,

    alignItems:"center",

    justifyContent:"center",

    backgroundColor:"#E8F5E9",

    marginBottom:12

  },


  reviewEyebrow:{

    fontSize:10,

    fontWeight:"900",

    letterSpacing:1.5,

    color:"#2E7D32"

  },


  reviewTitle:{

    marginTop:5,

    fontSize:25,

    fontWeight:"900",

    color:"#173B25"

  },


  reviewSubtitle:{

    marginTop:5,

    fontSize:13,

    color:"#6F8575"

  },


  reviewCard:{

    padding:19,

    borderRadius:24,

    backgroundColor:"#FFFFFF",

    borderWidth:1,

    borderColor:"#DDE9DE",

    elevation:4

  },


  duplicateBanner:{

    marginBottom:15,

    padding:12,

    borderRadius:14,

    flexDirection:"row",

    alignItems:"center",

    backgroundColor:"#FFF3D9",

    borderWidth:1,

    borderColor:"#F4D795"

  },


  duplicateText:{

    flex:1,

    marginLeft:9,

    fontSize:12,

    lineHeight:17,

    fontWeight:"800",

    color:"#875000"

  },


  reviewLabel:{

    marginTop:3,

    marginBottom:7,

    fontSize:10,

    fontWeight:"900",

    letterSpacing:1,

    color:"#607D6B"

  },


  reviewInput:{

    marginBottom:15,

    paddingVertical:13,

    paddingHorizontal:14,

    borderRadius:14,

    borderWidth:1,

    borderColor:"#D8E6DA",

    backgroundColor:"#F7FAF6",

    fontSize:16,

    fontWeight:"800",

    color:"#263238"

  },


  priceInputRow:{

    marginBottom:15,

    paddingHorizontal:14,

    borderRadius:14,

    borderWidth:1,

    borderColor:"#D8E6DA",

    backgroundColor:"#F7FAF6",

    flexDirection:"row",

    alignItems:"center"

  },


  currency:{

    fontSize:18,

    fontWeight:"900",

    color:"#2E7D32"

  },


  priceInput:{

    flex:1,

    paddingVertical:13,

    paddingHorizontal:7,

    fontSize:16,

    fontWeight:"800",

    color:"#263238"

  },


  barcodeCard:{

    marginBottom:17,

    padding:12,

    borderRadius:14,

    flexDirection:"row",

    alignItems:"center",

    backgroundColor:"#E8F5E9"

  },


  barcodeDetails:{

    marginLeft:10

  },


  barcodeLabel:{

    fontSize:9,

    fontWeight:"900",

    letterSpacing:1,

    color:"#608067"

  },


  barcodeValue:{

    marginTop:2,

    fontSize:14,

    fontWeight:"900",

    color:"#173B25"

  },


  addReviewedButton:{

    height:52,

    borderRadius:16,

    flexDirection:"row",

    alignItems:"center",

    justifyContent:"center",

    backgroundColor:"#2E7D32",

    elevation:3

  },


  disabledButton:{

    opacity:0.65

  },


  addReviewedText:{

    marginLeft:8,

    fontSize:15,

    fontWeight:"900",

    color:"#FFFFFF"

  },


  reviewScanAgainButton:{

    marginTop:10,

    height:48,

    borderRadius:15,

    flexDirection:"row",

    alignItems:"center",

    justifyContent:"center",

    borderWidth:1,

    borderColor:"#B9D9BD",

    backgroundColor:"#F3F9F2"

  },


  reviewScanAgainText:{

    marginLeft:7,

    fontSize:14,

    fontWeight:"900",

    color:"#2E7D32"

  },


  reviewCancelButton:{

    paddingTop:13,

    alignItems:"center"

  },


  reviewCancelText:{

    fontSize:13,

    fontWeight:"800",

    color:"#78907D"

  },


  messageScreen:{

    flex:1,

    backgroundColor:"#F5F7F2",

    justifyContent:"center",

    alignItems:"center",

    padding:30

  },


  message:{

    marginTop:15,

    color:"#607D8B",

    fontSize:16

  },


  permissionIcon:{

    fontSize:55

  },


  permissionTitle:{

    marginTop:16,

    color:"#263238",

    fontSize:25,

    fontWeight:"900"

  },


  permissionText:{

    marginTop:10,

    color:"#607D8B",

    fontSize:16,

    lineHeight:23,

    textAlign:"center"

  },


  permissionButton:{

    marginTop:25,

    backgroundColor:"#2E7D32",

    paddingVertical:15,

    paddingHorizontal:30,

    borderRadius:18

  },


  permissionButtonText:{

    color:"#FFFFFF",

    fontSize:16,

    fontWeight:"900"

  },


  cancelPermissionButton:{

    marginTop:12,

    padding:12

  },


  cancelPermissionText:{

    color:"#607D8B",

    fontSize:15,

    fontWeight:"700"

  }

});

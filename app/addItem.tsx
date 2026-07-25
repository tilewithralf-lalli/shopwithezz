import React, {
  useRef,
  useState
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert
} from "react-native";

import {
  useLocalSearchParams,
  useRouter
} from "expo-router";

import {
  addShoppingItem
} from "../storage/shopping";


export default function AddItemScreen(){

  const router =
    useRouter();

  const scrollViewRef =
    useRef<ScrollView>(null);

  const params =
    useLocalSearchParams();

  const storeName =
    Array.isArray(params.store)
      ? params.store[0]
      : String(
          params.store
          ||
          "Shopping List"
        );

  const [name,setName] =
    useState(
      String(params.name || "")
    );

  const [quantity,setQuantity] =
    useState(
      String(params.quantity || "1")
    );

  const [price,setPrice] =
    useState(
      String(params.price || "")
    );

  const barcode =
    String(params.barcode || "");


  function openScanner(){

    router.push({

      pathname:"/scanner",

      params:{

        store:
          storeName,

        name,

        quantity,

        price,

        barcode

      }

    });

  }


  function showPriceInput(){

    setTimeout(()=>{

      scrollViewRef.current?.scrollToEnd({
        animated:true
      });

    },250);

  }


  async function saveItem(){

    if(!name.trim()){

      Alert.alert(
        "Item Name Required",
        "Please enter an item name or scan a product."
      );

      return;

    }

    const cleanPrice =
      price
        .replace(",", ".")
        .trim();

    await addShoppingItem({

      name:name.trim(),

      store:storeName,

      quantity:
        parseInt(quantity,10) || 1,

      price:
        parseFloat(cleanPrice) || 0

    });

    router.back();

  }


  return(

    <KeyboardAvoidingView

      style={styles.keyboardView}

      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }

      keyboardVerticalOffset={0}

    >

      <ScrollView

        ref={scrollViewRef}

        style={styles.container}

        contentContainerStyle={
          styles.content
        }

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}

      >


        <View style={styles.header}>

          <Text style={styles.headerText}>
            🛒 Add Shopping Item
          </Text>

          <Text style={styles.subtitle}>
            {storeName}
          </Text>

        </View>


        <TouchableOpacity

          style={styles.scanButton}

          onPress={openScanner}

        >

          <Text style={styles.scanButtonIcon}>
            📷
          </Text>

          <View style={styles.scanButtonDetails}>

            <Text style={styles.scanButtonTitle}>
              Scan Barcode
            </Text>

            <Text style={styles.scanButtonSubtitle}>
              Scan a product to find its name
            </Text>

          </View>

          <Text style={styles.scanArrow}>
            ›
          </Text>

        </TouchableOpacity>


        {barcode !== "" && (

          <View style={styles.barcodeCard}>

            <View style={styles.barcodeHeader}>

              <Text style={styles.barcodeLabel}>
                Barcode scanned
              </Text>

              <Text style={styles.barcodeTick}>
                ✓
              </Text>

            </View>

            <Text style={styles.barcodeNumber}>
              {barcode}
            </Text>

            {!name.trim() && (

              <Text style={styles.notFoundText}>
                Product name wasn’t found. Enter it manually below.
              </Text>

            )}

          </View>

        )}


        <View style={styles.card}>


          <Text style={styles.label}>
            Item Name
          </Text>

          <TextInput

            style={styles.input}

            placeholder="Example: Milk"

            placeholderTextColor="#90A4AE"

            value={name}

            onChangeText={setName}

            returnKeyType="next"

          />


          <Text style={styles.label}>
            Quantity
          </Text>

          <TextInput

            style={styles.input}

            placeholder="1"

            placeholderTextColor="#90A4AE"

            keyboardType="numeric"

            value={quantity}

            onChangeText={setQuantity}

            returnKeyType="next"

          />


          <Text style={styles.label}>
            Price
          </Text>

          <View style={styles.priceContainer}>

            <Text style={styles.dollar}>
              $
            </Text>

            <TextInput

              style={styles.priceInput}

              placeholder="Example: 3.50"

              placeholderTextColor="#90A4AE"

              keyboardType="decimal-pad"

              value={price}

              onChangeText={setPrice}

              onFocus={showPriceInput}

            />

          </View>


          <Text style={styles.priceNote}>
            Enter the current shelf price
          </Text>


          <TouchableOpacity

            style={styles.button}

            onPress={saveItem}

          >

            <Text style={styles.buttonText}>
              Save Item
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


        </View>


      </ScrollView>

    </KeyboardAvoidingView>

  );

}


const styles = StyleSheet.create({

  keyboardView:{

    flex:1,

    backgroundColor:"#F5F7F2"

  },


  container:{

    flex:1,

    backgroundColor:"#F5F7F2"

  },


  content:{

    flexGrow:1,

    paddingHorizontal:18,

    paddingTop:8,

    paddingBottom:120

  },


  header:{

    alignItems:"center",

    marginBottom:8

  },


  headerText:{

    fontSize:21,

    fontWeight:"900",

    color:"#2E7D32"

  },


  subtitle:{

    marginTop:2,

    color:"#607D8B",

    fontSize:13

  },


  scanButton:{

    backgroundColor:"#2E7D32",

    borderRadius:18,

    padding:14,

    flexDirection:"row",

    alignItems:"center",

    elevation:4,

    marginBottom:10

  },


  scanButtonIcon:{

    fontSize:30,

    marginRight:12

  },


  scanButtonDetails:{

    flex:1

  },


  scanButtonTitle:{

    color:"#FFFFFF",

    fontSize:18,

    fontWeight:"900"

  },


  scanButtonSubtitle:{

    marginTop:2,

    color:"#C8E6C9",

    fontSize:12

  },


  scanArrow:{

    color:"#FFFFFF",

    fontSize:30,

    fontWeight:"700"

  },


  barcodeCard:{

    backgroundColor:"#E8F5E9",

    borderWidth:1,

    borderColor:"#81C784",

    borderRadius:15,

    padding:12,

    marginBottom:10

  },


  barcodeHeader:{

    flexDirection:"row",

    justifyContent:"space-between",

    alignItems:"center"

  },


  barcodeLabel:{

    color:"#2E7D32",

    fontSize:13,

    fontWeight:"800"

  },


  barcodeTick:{

    color:"#2E7D32",

    fontSize:17,

    fontWeight:"900"

  },


  barcodeNumber:{

    marginTop:4,

    color:"#263238",

    fontSize:16,

    fontWeight:"900",

    letterSpacing:1

  },


  notFoundText:{

    marginTop:6,

    color:"#607D8B",

    fontSize:12,

    lineHeight:17

  },


  card:{

    backgroundColor:"#FFFFFF",

    borderRadius:20,

    padding:15,

    elevation:4

  },


  label:{

    fontSize:15,

    fontWeight:"800",

    color:"#263238",

    marginTop:5

  },


  input:{

    marginTop:5,

    backgroundColor:"#F5F7F2",

    borderRadius:14,

    paddingVertical:10,

    paddingHorizontal:13,

    fontSize:16,

    color:"#263238",

    borderWidth:1,

    borderColor:"#E0E5DE"

  },


  priceContainer:{

    marginTop:5,

    backgroundColor:"#F5F7F2",

    borderRadius:14,

    flexDirection:"row",

    alignItems:"center",

    borderWidth:1,

    borderColor:"#E0E5DE",

    paddingHorizontal:13

  },


  dollar:{

    fontSize:17,

    fontWeight:"800",

    color:"#263238"

  },


  priceInput:{

    flex:1,

    paddingVertical:10,

    paddingHorizontal:7,

    fontSize:16,

    color:"#263238"

  },


  priceNote:{

    marginTop:5,

    color:"#90A4AE",

    fontSize:11

  },


  button:{

    marginTop:14,

    backgroundColor:"#2E7D32",

    padding:13,

    borderRadius:17,

    alignItems:"center"

  },


  buttonText:{

    color:"#FFFFFF",

    fontSize:16,

    fontWeight:"800"

  },


  cancelButton:{

    marginTop:5,

    padding:9,

    alignItems:"center"

  },


  cancelText:{

    color:"#607D8B",

    fontSize:14,

    fontWeight:"700"

  }

});
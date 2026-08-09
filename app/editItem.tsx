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
  updateShoppingItem
} from "../storage/shopping";


export default function EditItemScreen(){

  const router =
    useRouter();

  const scrollViewRef =
    useRef<ScrollView>(null);

  const params =
    useLocalSearchParams();

  const [name,setName] =
    useState(
      String(params.name || "")
    );

  const [price,setPrice] =
    useState(
      String(params.price || "")
    );


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
        "Please enter an item name."
      );

      return;

    }

    const cleanPrice =
      price
        .replace(",", ".")
        .trim();

    await updateShoppingItem({

      id:String(params.id),

      name:name.trim(),

      store:String(
        params.store || ""
      ),

      price:
        parseFloat(cleanPrice) || 0,

      checked:
        params.checked === "true"

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
            ✏️ Edit Item
          </Text>

          <Text style={styles.subtitle}>
            Update your shopping item
          </Text>

        </View>


        <View style={styles.card}>


          <Text style={styles.label}>
            Item Name
          </Text>

          <TextInput

            style={styles.input}

            value={name}

            onChangeText={setName}

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

              keyboardType="decimal-pad"

              value={price}

              onChangeText={setPrice}

              onFocus={showPriceInput}

            />

          </View>


          <TouchableOpacity

            style={styles.button}

            onPress={saveItem}

          >

            <Text style={styles.buttonText}>
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


  button:{

    marginTop:15,

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

import React, {
  useCallback,
  useState
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter
} from "expo-router";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  getShoppingList
} from "../storage/shopping";


export default function BudgetScreen(){

  const router =
    useRouter();

  const { store } =
    useLocalSearchParams();

  const storeName =
    Array.isArray(store)
      ? store[0]
      : String(store || "Shopping");

  const budgetKey =
    `shopping-budget-${storeName}`;

  const [budget,setBudget] =
    useState("");

  const [total,setTotal] =
    useState(0);


  useFocusEffect(

    useCallback(()=>{

      loadBudget();

    },[storeName])

  );


  async function loadBudget(){

    try{

      const savedBudget =
        await AsyncStorage.getItem(
          budgetKey
        );

      const items =
        await getShoppingList();

      const shoppingTotal =
        items.reduce(

          (sum:number,item:any)=>

            sum +

            (
              (Number(item.quantity) || 1)
              *
              (Number(item.price) || 0)
            ),

          0

        );

      setBudget(
        savedBudget || ""
      );

      setTotal(
        shoppingTotal
      );

    }
    catch(error){

      Alert.alert(
        "Error",
        "Could not load your budget."
      );

    }

  }


  async function saveBudget(){

    const amount =
      Number(budget);

    if(
      budget.trim() === ""
      ||
      Number.isNaN(amount)
      ||
      amount < 0
    ){

      Alert.alert(
        "Invalid Budget",
        "Please enter a valid budget amount."
      );

      return;

    }

    try{

      await AsyncStorage.setItem(
        budgetKey,
        String(amount)
      );

      setBudget(
        String(amount)
      );

      Alert.alert(
        "Budget Saved",
        "Your shopping budget has been saved."
      );

    }
    catch(error){

      Alert.alert(
        "Error",
        "Could not save your budget."
      );

    }

  }


  const budgetAmount =
    Number(budget) || 0;

  const remaining =
    budgetAmount - total;

  const isOverBudget =
    remaining < 0;


  return(

    <View style={styles.container}>


      <TouchableOpacity

        style={styles.backButton}

        onPress={()=>router.back()}

      >

        <Text style={styles.backText}>
          ← Back
        </Text>

      </TouchableOpacity>


      <View style={styles.header}>

        <Text style={styles.icon}>
          💰
        </Text>

        <Text style={styles.title}>
          Shopping Budget
        </Text>

        <Text style={styles.subtitle}>
          {storeName}
        </Text>

      </View>


      <View style={styles.card}>

        <Text style={styles.label}>
          Your Budget
        </Text>

        <View style={styles.inputRow}>

          <Text style={styles.dollar}>
            $
          </Text>

          <TextInput

            style={styles.input}

            value={budget}

            onChangeText={setBudget}

            placeholder="0.00"

            keyboardType="decimal-pad"

          />

        </View>


        <TouchableOpacity

          style={styles.saveButton}

          onPress={saveBudget}

        >

          <Text style={styles.saveText}>
            Save Budget
          </Text>

        </TouchableOpacity>

      </View>


      <View style={styles.summaryCard}>


        <View style={styles.summaryRow}>

          <Text style={styles.summaryLabel}>
            Budget
          </Text>

          <Text style={styles.summaryValue}>
            ${budgetAmount.toFixed(2)}
          </Text>

        </View>


        <View style={styles.summaryRow}>

          <Text style={styles.summaryLabel}>
            Shopping Total
          </Text>

          <Text style={styles.summaryValue}>
            ${total.toFixed(2)}
          </Text>

        </View>


        <View style={styles.divider}/>


        <View style={styles.summaryRow}>

          <Text style={styles.remainingLabel}>

            {isOverBudget
              ? "Over Budget"
              : "Remaining"}

          </Text>

          <Text

            style={[

              styles.remainingValue,

              isOverBudget
                ? styles.overBudget
                : styles.underBudget

            ]}

          >

            ${Math.abs(remaining).toFixed(2)}

          </Text>

        </View>

      </View>


      {isOverBudget && (

        <View style={styles.warning}>

          <Text style={styles.warningText}>
            ⚠️ Your shopping total is over budget.
          </Text>

        </View>

      )}


    </View>

  );

}


const styles = StyleSheet.create({

  container:{

    flex:1,

    backgroundColor:"#F5F7F2",

    padding:20,

    paddingTop:60

  },


  backButton:{

    alignSelf:"flex-start",

    paddingVertical:10,

    paddingRight:20

  },


  backText:{

    color:"#2E7D32",

    fontSize:17,

    fontWeight:"800"

  },


  header:{

    alignItems:"center",

    marginTop:15,

    marginBottom:30

  },


  icon:{

    fontSize:48

  },


  title:{

    marginTop:10,

    fontSize:30,

    fontWeight:"900",

    color:"#2E7D32"

  },


  subtitle:{

    marginTop:6,

    color:"#607D8B",

    fontSize:16

  },


  card:{

    backgroundColor:"#FFFFFF",

    padding:22,

    borderRadius:22,

    elevation:3

  },


  label:{

    color:"#263238",

    fontSize:18,

    fontWeight:"800",

    marginBottom:12

  },


  inputRow:{

    flexDirection:"row",

    alignItems:"center",

    borderWidth:1,

    borderColor:"#CFD8DC",

    borderRadius:16,

    paddingHorizontal:16

  },


  dollar:{

    fontSize:22,

    fontWeight:"800",

    color:"#263238"

  },


  input:{

    flex:1,

    padding:15,

    fontSize:22,

    color:"#263238"

  },


  saveButton:{

    marginTop:18,

    backgroundColor:"#2E7D32",

    padding:16,

    borderRadius:16,

    alignItems:"center"

  },


  saveText:{

    color:"#FFFFFF",

    fontSize:17,

    fontWeight:"800"

  },


  summaryCard:{

    marginTop:22,

    backgroundColor:"#FFFFFF",

    padding:22,

    borderRadius:22,

    elevation:3

  },


  summaryRow:{

    flexDirection:"row",

    justifyContent:"space-between",

    alignItems:"center",

    marginVertical:10

  },


  summaryLabel:{

    color:"#607D8B",

    fontSize:17

  },


  summaryValue:{

    color:"#263238",

    fontSize:18,

    fontWeight:"800"

  },


  divider:{

    height:1,

    backgroundColor:"#E0E0E0",

    marginVertical:10

  },


  remainingLabel:{

    color:"#263238",

    fontSize:19,

    fontWeight:"900"

  },


  remainingValue:{

    fontSize:24,

    fontWeight:"900"

  },


  underBudget:{

    color:"#2E7D32"

  },


  overBudget:{

    color:"#D32F2F"

  },


  warning:{

    marginTop:20,

    padding:17,

    borderRadius:16,

    backgroundColor:"#FFEBEE"

  },


  warningText:{

    color:"#C62828",

    fontSize:16,

    fontWeight:"800",

    textAlign:"center"

  }

});
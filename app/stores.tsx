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
  ScrollView,
  Alert
} from "react-native";

import {
  useFocusEffect,
  useRouter
} from "expo-router";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  getShoppingList
} from "../storage/shopping";


const OVERALL_BUDGET_KEY =
  "overall-shopping-budget";


const STORES = [

  {
    name:"Aldi",
    icon:"🔵",
    text:"Great value everyday shopping"
  },

  {
    name:"Coles",
    icon:"🟡",
    text:"Fresh food and weekly specials"
  },

  {
    name:"Woolworths",
    icon:"🟢",
    text:"Fresh groceries and savings"
  },

  {
    name:"IGA",
    icon:"🟠",
    text:"Local community shopping"
  },

  {
    name:"Kmart",
    icon:"🔴",
    text:"Home, clothing and everyday essentials"
  }

];


type StoreSummary = {

  count:number;

  total:number;

};


export default function StoresScreen(){

  const router =
    useRouter();

  const [budget,setBudget] =
    useState("");

  const [savedBudget,setSavedBudget] =
    useState(0);

  const [shoppingTotal,setShoppingTotal] =
    useState(0);

  const [storeSummaries,setStoreSummaries] =
    useState<Record<string,StoreSummary>>({});


  useFocusEffect(

    useCallback(()=>{

      loadShoppingSummary();

    },[])

  );


  async function loadShoppingSummary(){

    try{

      const savedItems =
        await getShoppingList();

      const storedBudget =
        await AsyncStorage.getItem(
          OVERALL_BUDGET_KEY
        );

      const total =
        savedItems.reduce(

          (sum:number,item:any)=>

            sum +

            (
              (Number(item.quantity) || 1)
              *
              (Number(item.price) || 0)
            ),

          0

        );

      const summaries:
        Record<string,StoreSummary> = {};

      STORES.forEach((store)=>{

        const storeItems =
          savedItems.filter(

            (item:any)=>

              String(item.store || "")
                .trim()
                .toLowerCase()

              ===

              store.name
                .trim()
                .toLowerCase()

          );

        const storeTotal =
          storeItems.reduce(

            (sum:number,item:any)=>

              sum +

              (
                (Number(item.quantity) || 1)
                *
                (Number(item.price) || 0)
              ),

            0

          );

        summaries[store.name] = {

          count:
            storeItems.length,

          total:
            storeTotal

        };

      });

      const budgetAmount =
        Number(storedBudget) || 0;

      setBudget(
        storedBudget || ""
      );

      setSavedBudget(
        budgetAmount
      );

      setShoppingTotal(
        total
      );

      setStoreSummaries(
        summaries
      );

    }
    catch(error){

      Alert.alert(
        "Error",
        "Could not load your shopping summary."
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
        OVERALL_BUDGET_KEY,
        String(amount)
      );

      setBudget(
        String(amount)
      );

      setSavedBudget(
        amount
      );

      Alert.alert(
        "Budget Saved",
        "Your overall shopping budget has been saved."
      );

    }
    catch(error){

      Alert.alert(
        "Error",
        "Could not save your shopping budget."
      );

    }

  }


  function selectStore(store:string){

    router.push({

      pathname:"/shop",

      params:{
        store
      }

    });

  }


  function storeSummaryText(
    storeName:string
  ){

    const summary =
      storeSummaries[storeName];

    if(
      !summary
      ||
      summary.count === 0
    ){

      return "Empty list";

    }

    const itemWord =
      summary.count === 1
        ? "item"
        : "items";

    return (
      `${summary.count} ${itemWord}`
      +
      `  •  $${summary.total.toFixed(2)}`
    );

  }


  const remaining =
    savedBudget - shoppingTotal;

  const isOverBudget =
    remaining < 0;


  return(

    <ScrollView

      style={styles.container}

      contentContainerStyle={
        styles.content
      }

      keyboardShouldPersistTaps="handled"

      showsVerticalScrollIndicator={false}

    >


      <Text style={styles.title}>
        🏪 Choose Store
      </Text>


      <Text style={styles.subtitle}>
        Start your shopping trip
      </Text>


      <View style={styles.budgetCard}>


        <Text style={styles.budgetIcon}>
          💰
        </Text>


        <Text style={styles.budgetTitle}>
          Overall Shopping Budget
        </Text>


        <Text style={styles.budgetDescription}>
          Set one budget for shopping across all stores
        </Text>


        <View style={styles.budgetInputRow}>


          <View style={styles.inputContainer}>

            <Text style={styles.dollar}>
              $
            </Text>

            <TextInput

              style={styles.budgetInput}

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
              Save
            </Text>

          </TouchableOpacity>


        </View>


        <View style={styles.summaryCard}>


          <View style={styles.summaryColumn}>

            <Text style={styles.summaryLabel}>
              Budget
            </Text>

            <Text style={styles.summaryValue}>
              ${savedBudget.toFixed(2)}
            </Text>

          </View>


          <View style={styles.summaryDivider}/>


          <View style={styles.summaryColumn}>

            <Text style={styles.summaryLabel}>
              Total
            </Text>

            <Text style={styles.summaryValue}>
              ${shoppingTotal.toFixed(2)}
            </Text>

          </View>


          <View style={styles.summaryDivider}/>


          <View style={styles.summaryColumn}>

            <Text style={styles.summaryLabel}>

              {isOverBudget
                ? "Over"
                : "Remaining"}

            </Text>

            <Text

              style={[

                styles.summaryValue,

                isOverBudget
                  ? styles.overBudget
                  : styles.remaining

              ]}

            >

              ${Math.abs(remaining).toFixed(2)}

            </Text>

          </View>


        </View>


        {isOverBudget && (

          <View style={styles.warningCard}>

            <Text style={styles.warningText}>

              ⚠️ You are over your overall budget by ${Math.abs(remaining).toFixed(2)}

            </Text>

          </View>

        )}


      </View>


      <Text style={styles.storeSectionTitle}>
        Choose a Store
      </Text>


      {

        STORES.map((store)=>{

          const summary =
            storeSummaries[store.name];

          const hasItems =
            Boolean(
              summary
              &&
              summary.count > 0
            );

          return(

            <TouchableOpacity

              key={store.name}

              style={styles.card}

              onPress={()=>
                selectStore(store.name)
              }

            >


              <View style={styles.iconBox}>

                <Text style={styles.icon}>
                  {store.icon}
                </Text>

              </View>


              <View style={styles.storeDetails}>

                <Text style={styles.storeName}>
                  {store.name}
                </Text>

                <Text style={styles.description}>
                  {store.text}
                </Text>

                <View

                  style={[
                    styles.storeSummaryBadge,
                    hasItems
                      ? styles.activeSummaryBadge
                      : styles.emptySummaryBadge
                  ]}

                >

                  <Text

                    style={[
                      styles.storeSummaryText,
                      hasItems
                        ? styles.activeSummaryText
                        : styles.emptySummaryText
                    ]}

                  >

                    {hasItems
                      ? "🛒 "
                      : "○ "}

                    {storeSummaryText(
                      store.name
                    )}

                  </Text>

                </View>

              </View>


              <Text style={styles.arrow}>
                ›
              </Text>


            </TouchableOpacity>

          );

        })

      }


    </ScrollView>

  );

}


const styles = StyleSheet.create({

  container:{

    flex:1,

    backgroundColor:"#F5F7F2"

  },


  content:{

    padding:20,

    paddingTop:60,

    paddingBottom:40

  },


  title:{

    fontSize:30,

    fontWeight:"900",

    textAlign:"center",

    color:"#2E7D32"

  },


  subtitle:{

    textAlign:"center",

    marginTop:8,

    marginBottom:22,

    color:"#607D8B",

    fontSize:16

  },


  budgetCard:{

    backgroundColor:"#FFFFFF",

    padding:20,

    borderRadius:24,

    elevation:4,

    marginBottom:26

  },


  budgetIcon:{

    fontSize:35,

    textAlign:"center"

  },


  budgetTitle:{

    marginTop:8,

    textAlign:"center",

    fontSize:21,

    fontWeight:"900",

    color:"#263238"

  },


  budgetDescription:{

    marginTop:5,

    textAlign:"center",

    color:"#78909C",

    fontSize:14

  },


  budgetInputRow:{

    marginTop:17,

    flexDirection:"row",

    alignItems:"center"

  },


  inputContainer:{

    flex:1,

    flexDirection:"row",

    alignItems:"center",

    borderWidth:1,

    borderColor:"#CFD8DC",

    borderRadius:14,

    paddingHorizontal:13

  },


  dollar:{

    color:"#263238",

    fontSize:19,

    fontWeight:"800"

  },


  budgetInput:{

    flex:1,

    paddingVertical:12,

    paddingHorizontal:8,

    fontSize:19,

    color:"#263238"

  },


  saveButton:{

    marginLeft:10,

    backgroundColor:"#2E7D32",

    paddingVertical:14,

    paddingHorizontal:20,

    borderRadius:14

  },


  saveText:{

    color:"#FFFFFF",

    fontSize:15,

    fontWeight:"900"

  },


  summaryCard:{

    marginTop:17,

    backgroundColor:"#263238",

    paddingVertical:15,

    paddingHorizontal:6,

    borderRadius:18,

    flexDirection:"row",

    alignItems:"center",

    justifyContent:"space-around"

  },


  summaryColumn:{

    flex:1,

    alignItems:"center"

  },


  summaryLabel:{

    color:"#CFD8DC",

    fontSize:12,

    fontWeight:"700"

  },


  summaryValue:{

    marginTop:4,

    color:"#FFFFFF",

    fontSize:17,

    fontWeight:"900"

  },


  summaryDivider:{

    width:1,

    height:35,

    backgroundColor:"#546E7A"

  },


  remaining:{

    color:"#81C784"

  },


  overBudget:{

    color:"#FF8A80"

  },


  warningCard:{

    marginTop:12,

    backgroundColor:"#FFEBEE",

    padding:12,

    borderRadius:14

  },


  warningText:{

    color:"#C62828",

    textAlign:"center",

    fontWeight:"800"

  },


  storeSectionTitle:{

    marginBottom:13,

    color:"#263238",

    fontSize:21,

    fontWeight:"900"

  },


  card:{

    backgroundColor:"#FFFFFF",

    borderRadius:24,

    padding:17,

    marginBottom:14,

    flexDirection:"row",

    alignItems:"center",

    elevation:4

  },


  iconBox:{

    width:60,

    height:60,

    borderRadius:30,

    backgroundColor:"#E8F5E9",

    justifyContent:"center",

    alignItems:"center",

    marginRight:15

  },


  icon:{

    fontSize:29

  },


  storeDetails:{

    flex:1

  },


  storeName:{

    fontSize:21,

    fontWeight:"900",

    color:"#263238"

  },


  description:{

    marginTop:3,

    color:"#78909C",

    fontSize:12

  },


  storeSummaryBadge:{

    marginTop:8,

    alignSelf:"flex-start",

    paddingVertical:5,

    paddingHorizontal:9,

    borderRadius:10

  },


  activeSummaryBadge:{

    backgroundColor:"#E8F5E9"

  },


  emptySummaryBadge:{

    backgroundColor:"#ECEFF1"

  },


  storeSummaryText:{

    fontSize:12,

    fontWeight:"800"

  },


  activeSummaryText:{

    color:"#2E7D32"

  },


  emptySummaryText:{

    color:"#78909C"

  },


  arrow:{

    marginLeft:8,

    color:"#2E7D32",

    fontSize:32,

    fontWeight:"700"

  }

});
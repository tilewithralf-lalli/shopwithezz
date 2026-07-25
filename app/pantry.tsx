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
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";

import {
  useFocusEffect,
  useRouter
} from "expo-router";

import {
  addPantryItem,
  getPantryList,
  updatePantryItem,
  deletePantryItem,
  clearCompletedPantryItems,
  importPantryItemToStore
} from "../storage/shopping";


const STORES = [

  {
    name:"Aldi",
    icon:"🔵"
  },

  {
    name:"Coles",
    icon:"🟡"
  },

  {
    name:"Woolworths",
    icon:"🟢"
  },

  {
    name:"IGA",
    icon:"🟠"
  },

  {
    name:"Kmart",
    icon:"🔴"
  }

];


export default function PantryScreen(){

  const router =
    useRouter();

  const [items,setItems] =
    useState<any[]>([]);

  const [name,setName] =
    useState("");

  const [quantity,setQuantity] =
    useState("1");

  const [selectedItem,setSelectedItem] =
    useState<any>(null);

  const [storeModalVisible,setStoreModalVisible] =
    useState(false);


  useFocusEffect(

    useCallback(()=>{

      loadPantry();

    },[])

  );


  async function loadPantry(){

    const savedItems =
      await getPantryList();

    setItems(savedItems);

  }


  async function addManualItem(){

    const cleanName =
      name.trim();

    if(!cleanName){

      Alert.alert(
        "Item Name Required",
        "Enter the item you need."
      );

      return;

    }

    await addPantryItem({

      name:cleanName,

      quantity:
        parseInt(quantity,10) || 1,

      barcode:""

    });

    setName("");

    setQuantity("1");

    loadPantry();

  }


  function openScanner(){

    router.push({

      pathname:"/scanner",

      params:{

        mode:"pantry",

        returnTo:"/pantry"

      }

    });

  }


  async function toggleItem(item:any){

    await updatePantryItem({

      ...item,

      checked:
        !item.checked

    });

    loadPantry();

  }


  function confirmDelete(item:any){

    Alert.alert(

      "Delete Pantry Item",

      `Remove ${item.name} from your Pantry List?`,

      [

        {
          text:"Cancel",
          style:"cancel"
        },

        {
          text:"Delete",
          style:"destructive",
          onPress:()=>removeItem(item.id)
        }

      ]

    );

  }


  async function removeItem(id:string){

    await deletePantryItem(id);

    loadPantry();

  }


  function confirmClearCompleted(){

    const completedCount =
      items.filter(
        (item:any)=>item.checked
      ).length;

    if(completedCount === 0){

      Alert.alert(
        "Nothing to Clear",
        "Tick purchased items before clearing them."
      );

      return;

    }

    Alert.alert(

      "Clear Completed Items",

      `Remove ${completedCount} completed item${completedCount === 1 ? "" : "s"} from the Pantry List?`,

      [

        {
          text:"Cancel",
          style:"cancel"
        },

        {
          text:"Clear Completed",
          style:"destructive",
          onPress:clearCompleted
        }

      ]

    );

  }


  async function clearCompleted(){

    await clearCompletedPantryItems();

    loadPantry();

  }


  function openStorePicker(item:any){

    setSelectedItem(item);

    setStoreModalVisible(true);

  }


  function closeStorePicker(){

    setSelectedItem(null);

    setStoreModalVisible(false);

  }


  async function sendToStore(store:string){

    if(!selectedItem){

      return;

    }

    const imported =
      await importPantryItemToStore(

        selectedItem.id,

        store

      );

    closeStorePicker();

    await loadPantry();

    if(imported){

      Alert.alert(

        "Added to Store",

        `${selectedItem.name} is now on your ${store} shopping list.`,

        [

          {
            text:"Stay Here",
            style:"cancel"
          },

          {
            text:`Open ${store}`,
            onPress:()=>router.push({

              pathname:"/shop",

              params:{
                store
              }

            })
          }

        ]

      );

    }

  }


  const completedCount =
    items.filter(
      (item:any)=>item.checked
    ).length;

  const remainingCount =
    items.length - completedCount;


  return(

    <KeyboardAvoidingView

      style={styles.keyboardView}

      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }

    >

      <View style={styles.container}>


        <View style={styles.header}>

          <TouchableOpacity

            style={styles.backButton}

            onPress={()=>router.back()}

          >

            <Text style={styles.backText}>
              ‹
            </Text>

          </TouchableOpacity>

          <View style={styles.headerTextArea}>

            <Text style={styles.title}>
              🏠 Pantry List
            </Text>

            <Text style={styles.subtitle}>
              Scan what you need, then choose where to buy it
            </Text>

          </View>

        </View>


        <View style={styles.summaryCard}>

          <View style={styles.summaryItem}>

            <Text style={styles.summaryNumber}>
              {items.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Total
            </Text>

          </View>

          <View style={styles.summaryDivider}/>

          <View style={styles.summaryItem}>

            <Text style={styles.remainingNumber}>
              {remainingCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Needed
            </Text>

          </View>

          <View style={styles.summaryDivider}/>

          <View style={styles.summaryItem}>

            <Text style={styles.completedNumber}>
              {completedCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Bought
            </Text>

          </View>

        </View>


        <TouchableOpacity

          style={styles.scanButton}

          onPress={openScanner}

        >

          <Text style={styles.scanIcon}>
            📷
          </Text>

          <View style={styles.scanTextArea}>

            <Text style={styles.scanTitle}>
              Scan Pantry Item
            </Text>

            <Text style={styles.scanText}>
              Scan a barcode to add what you need
            </Text>

          </View>

          <Text style={styles.scanArrow}>
            ›
          </Text>

        </TouchableOpacity>


        <View style={styles.manualCard}>

          <Text style={styles.manualTitle}>
            Add Manually
          </Text>

          <View style={styles.manualRow}>

            <TextInput

              style={styles.nameInput}

              value={name}

              onChangeText={setName}

              placeholder="Example: Milk"

              placeholderTextColor="#90A4AE"

              returnKeyType="done"

              onSubmitEditing={addManualItem}

            />

            <TextInput

              style={styles.quantityInput}

              value={quantity}

              onChangeText={setQuantity}

              keyboardType="numeric"

              placeholder="1"

              placeholderTextColor="#90A4AE"

            />

            <TouchableOpacity

              style={styles.addButton}

              onPress={addManualItem}

            >

              <Text style={styles.addButtonText}>
                ＋
              </Text>

            </TouchableOpacity>

          </View>

        </View>


        <View style={styles.listHeader}>

          <Text style={styles.listTitle}>
            Items Needed
          </Text>

          <TouchableOpacity

            style={[
              styles.clearButton,
              completedCount === 0
                &&
              styles.clearButtonDisabled
            ]}

            onPress={confirmClearCompleted}

            disabled={completedCount === 0}

          >

            <Text

              style={[
                styles.clearText,
                completedCount === 0
                  &&
                styles.clearTextDisabled
              ]}

            >
              Clear Completed
            </Text>

          </TouchableOpacity>

        </View>


        <FlatList

          data={items}

          keyExtractor={(item)=>item.id}

          showsVerticalScrollIndicator={false}

          contentContainerStyle={
            items.length === 0
              ? styles.emptyList
              : styles.listContent
          }

          renderItem={({item})=>(

            <View

              style={[
                styles.itemCard,
                item.checked
                  &&
                styles.completedCard
              ]}

            >

              <TouchableOpacity

                style={styles.checkboxButton}

                onPress={()=>toggleItem(item)}

              >

                <Text style={styles.checkbox}>

                  {item.checked
                    ? "☑️"
                    : "☐"}

                </Text>

              </TouchableOpacity>

              <View style={styles.itemDetails}>

                <Text

                  style={[
                    styles.itemName,
                    item.checked
                      &&
                    styles.completedName
                  ]}

                >
                  {item.name}
                </Text>

                <View style={styles.itemMeta}>

                  <Text style={styles.quantityText}>
                    Qty {item.quantity || 1}
                  </Text>

                  {item.assignedStore ? (

                    <View style={styles.assignedBadge}>

                      <Text style={styles.assignedText}>
                        🏪 {item.assignedStore}
                      </Text>

                    </View>

                  ) : (

                    <View style={styles.unassignedBadge}>

                      <Text style={styles.unassignedText}>
                        Store not chosen
                      </Text>

                    </View>

                  )}

                </View>

                {item.barcode ? (

                  <Text style={styles.barcodeText}>
                    Barcode: {item.barcode}
                  </Text>

                ) : null}

              </View>

              <View style={styles.itemActions}>

                <TouchableOpacity

                  style={styles.storeButton}

                  onPress={()=>openStorePicker(item)}

                >

                  <Text style={styles.storeButtonText}>
                    🏪
                  </Text>

                </TouchableOpacity>

                <TouchableOpacity

                  style={styles.deleteButton}

                  onPress={()=>confirmDelete(item)}

                >

                  <Text style={styles.deleteText}>
                    🗑️
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          )}

          ListEmptyComponent={

            <View style={styles.emptyCard}>

              <Text style={styles.emptyIcon}>
                🧺
              </Text>

              <Text style={styles.emptyTitle}>
                Your Pantry List is empty
              </Text>

              <Text style={styles.emptyText}>
                Scan or manually add the things you need
              </Text>

            </View>

          }

        />


        <Modal

          visible={storeModalVisible}

          transparent={true}

          animationType="fade"

          onRequestClose={closeStorePicker}

        >

          <View style={styles.modalOverlay}>

            <View style={styles.modalCard}>

              <Text style={styles.modalIcon}>
                🏪
              </Text>

              <Text style={styles.modalTitle}>
                Choose a Store
              </Text>

              <Text style={styles.modalSubtitle}>

                Where will you buy {selectedItem?.name || "this item"}?

              </Text>

              <View style={styles.storeOptions}>

                {STORES.map((store)=>(

                  <TouchableOpacity

                    key={store.name}

                    style={styles.storeOption}

                    onPress={()=>sendToStore(store.name)}

                  >

                    <Text style={styles.storeOptionIcon}>
                      {store.icon}
                    </Text>

                    <Text style={styles.storeOptionName}>
                      {store.name}
                    </Text>

                    <Text style={styles.storeOptionArrow}>
                      ›
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

              <TouchableOpacity

                style={styles.modalCancelButton}

                onPress={closeStorePicker}

              >

                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </Modal>


      </View>

    </KeyboardAvoidingView>

  );

}


const styles = StyleSheet.create({

  keyboardView:{

    flex:1,

    backgroundColor:"#F3F7F1"

  },


  container:{

    flex:1,

    backgroundColor:"#F3F7F1",

    paddingHorizontal:18,

    paddingTop:48,

    paddingBottom:12

  },


  header:{

    flexDirection:"row",

    alignItems:"center"

  },


  backButton:{

    width:42,

    height:42,

    borderRadius:14,

    backgroundColor:"#FFFFFF",

    justifyContent:"center",

    alignItems:"center",

    elevation:2,

    marginRight:12

  },


  backText:{

    color:"#2E7D32",

    fontSize:32,

    lineHeight:34,

    fontWeight:"700"

  },


  headerTextArea:{

    flex:1

  },


  title:{

    color:"#173B25",

    fontSize:25,

    fontWeight:"900"

  },


  subtitle:{

    marginTop:3,

    color:"#78909C",

    fontSize:12,

    lineHeight:17

  },


  summaryCard:{

    marginTop:16,

    backgroundColor:"#173B25",

    borderRadius:18,

    paddingVertical:12,

    flexDirection:"row",

    alignItems:"center"

  },


  summaryItem:{

    flex:1,

    alignItems:"center"

  },


  summaryNumber:{

    color:"#FFFFFF",

    fontSize:20,

    fontWeight:"900"

  },


  remainingNumber:{

    color:"#FFCC80",

    fontSize:20,

    fontWeight:"900"

  },


  completedNumber:{

    color:"#81C784",

    fontSize:20,

    fontWeight:"900"

  },


  summaryLabel:{

    marginTop:2,

    color:"#C8D8CC",

    fontSize:11,

    fontWeight:"700"

  },


  summaryDivider:{

    width:1,

    height:32,

    backgroundColor:"#456350"

  },


  scanButton:{

    marginTop:12,

    backgroundColor:"#2E7D32",

    borderRadius:18,

    padding:13,

    flexDirection:"row",

    alignItems:"center",

    elevation:3

  },


  scanIcon:{

    fontSize:28,

    marginRight:11

  },


  scanTextArea:{

    flex:1

  },


  scanTitle:{

    color:"#FFFFFF",

    fontSize:17,

    fontWeight:"900"

  },


  scanText:{

    marginTop:2,

    color:"#C8E6C9",

    fontSize:11

  },


  scanArrow:{

    color:"#FFFFFF",

    fontSize:30,

    fontWeight:"700"

  },


  manualCard:{

    marginTop:10,

    backgroundColor:"#FFFFFF",

    padding:12,

    borderRadius:16,

    elevation:2

  },


  manualTitle:{

    color:"#263238",

    fontSize:13,

    fontWeight:"900",

    marginBottom:7

  },


  manualRow:{

    flexDirection:"row",

    alignItems:"center"

  },


  nameInput:{

    flex:1,

    backgroundColor:"#F3F7F1",

    borderWidth:1,

    borderColor:"#D8E4D9",

    borderRadius:12,

    paddingVertical:9,

    paddingHorizontal:11,

    color:"#263238",

    fontSize:15

  },


  quantityInput:{

    width:52,

    marginLeft:7,

    backgroundColor:"#F3F7F1",

    borderWidth:1,

    borderColor:"#D8E4D9",

    borderRadius:12,

    paddingVertical:9,

    paddingHorizontal:8,

    color:"#263238",

    fontSize:15,

    textAlign:"center"

  },


  addButton:{

    width:42,

    height:42,

    marginLeft:7,

    borderRadius:12,

    backgroundColor:"#2E7D32",

    justifyContent:"center",

    alignItems:"center"

  },


  addButtonText:{

    color:"#FFFFFF",

    fontSize:24,

    fontWeight:"800"

  },


  listHeader:{

    marginTop:14,

    marginBottom:8,

    flexDirection:"row",

    justifyContent:"space-between",

    alignItems:"center"

  },


  listTitle:{

    color:"#263238",

    fontSize:18,

    fontWeight:"900"

  },


  clearButton:{

    backgroundColor:"#FFEBEE",

    paddingVertical:7,

    paddingHorizontal:10,

    borderRadius:10

  },


  clearButtonDisabled:{

    backgroundColor:"#ECEFF1"

  },


  clearText:{

    color:"#C62828",

    fontSize:11,

    fontWeight:"800"

  },


  clearTextDisabled:{

    color:"#90A4AE"

  },


  listContent:{

    paddingBottom:20

  },


  emptyList:{

    flexGrow:1

  },


  itemCard:{

    backgroundColor:"#FFFFFF",

    borderRadius:17,

    padding:12,

    marginBottom:9,

    flexDirection:"row",

    alignItems:"center",

    elevation:2

  },


  completedCard:{

    backgroundColor:"#E8F5E9"

  },


  checkboxButton:{

    marginRight:10

  },


  checkbox:{

    fontSize:23

  },


  itemDetails:{

    flex:1

  },


  itemName:{

    color:"#263238",

    fontSize:16,

    fontWeight:"900"

  },


  completedName:{

    color:"#78909C",

    textDecorationLine:"line-through"

  },


  itemMeta:{

    marginTop:5,

    flexDirection:"row",

    alignItems:"center",

    flexWrap:"wrap"

  },


  quantityText:{

    color:"#607D8B",

    fontSize:11,

    fontWeight:"700",

    marginRight:6

  },


  assignedBadge:{

    backgroundColor:"#E8F5E9",

    borderRadius:8,

    paddingVertical:3,

    paddingHorizontal:6

  },


  assignedText:{

    color:"#2E7D32",

    fontSize:10,

    fontWeight:"800"

  },


  unassignedBadge:{

    backgroundColor:"#FFF3E0",

    borderRadius:8,

    paddingVertical:3,

    paddingHorizontal:6

  },


  unassignedText:{

    color:"#EF6C00",

    fontSize:10,

    fontWeight:"800"

  },


  barcodeText:{

    marginTop:4,

    color:"#90A4AE",

    fontSize:9

  },


  itemActions:{

    marginLeft:8,

    flexDirection:"row",

    alignItems:"center"

  },


  storeButton:{

    width:35,

    height:35,

    borderRadius:11,

    backgroundColor:"#E8F5E9",

    justifyContent:"center",

    alignItems:"center",

    marginRight:5

  },


  storeButtonText:{

    fontSize:17

  },


  deleteButton:{

    width:35,

    height:35,

    borderRadius:11,

    backgroundColor:"#FFEBEE",

    justifyContent:"center",

    alignItems:"center"

  },


  deleteText:{

    fontSize:16

  },


  emptyCard:{

    backgroundColor:"#FFFFFF",

    borderRadius:20,

    padding:28,

    marginTop:10,

    alignItems:"center"

  },


  emptyIcon:{

    fontSize:40

  },


  emptyTitle:{

    marginTop:10,

    color:"#263238",

    fontSize:18,

    fontWeight:"900"

  },


  emptyText:{

    marginTop:5,

    color:"#78909C",

    fontSize:13,

    textAlign:"center"

  },


  modalOverlay:{

    flex:1,

    backgroundColor:"rgba(0,0,0,0.50)",

    justifyContent:"center",

    padding:24

  },


  modalCard:{

    backgroundColor:"#FFFFFF",

    borderRadius:25,

    padding:20,

    elevation:10

  },


  modalIcon:{

    fontSize:35,

    textAlign:"center"

  },


  modalTitle:{

    marginTop:7,

    color:"#173B25",

    fontSize:23,

    fontWeight:"900",

    textAlign:"center"

  },


  modalSubtitle:{

    marginTop:5,

    color:"#78909C",

    fontSize:13,

    textAlign:"center"

  },


  storeOptions:{

    marginTop:17

  },


  storeOption:{

    backgroundColor:"#F3F7F1",

    borderRadius:14,

    padding:12,

    marginBottom:8,

    flexDirection:"row",

    alignItems:"center"

  },


  storeOptionIcon:{

    fontSize:22,

    marginRight:11

  },


  storeOptionName:{

    flex:1,

    color:"#263238",

    fontSize:16,

    fontWeight:"800"

  },


  storeOptionArrow:{

    color:"#2E7D32",

    fontSize:25,

    fontWeight:"700"

  },


  modalCancelButton:{

    marginTop:5,

    padding:11,

    alignItems:"center"

  },


  modalCancelText:{

    color:"#78909C",

    fontSize:14,

    fontWeight:"800"

  }

});
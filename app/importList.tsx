import React, {
  useEffect,
  useState
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import {
  File
} from "expo-file-system";

import {
  useLocalSearchParams,
  useRouter
} from "expo-router";

import {
  Ionicons
} from "@expo/vector-icons";

import {
  useSafeAreaInsets
} from "react-native-safe-area-context";

import {
  useShareIntentContext
} from "expo-share-intent";

import {
  createList,
  selectList
} from "../storage/shoppingLists";


const LIST_MIME =
  "application/vnd.shopwithezz.list+json";


type ImportedItem = {
  name:string;
  price:number;
  purchased:boolean;
  quantity:number;
  barcode?:string;
};

export default function ImportListScreen(){

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params =
    useLocalSearchParams<{data?:string}>();

  const encodedData =
    Array.isArray(params.data)
      ? params.data[0]
      : params.data;

  const {
    shareIntent,
    resetShareIntent
  } =
    useShareIntentContext();

  const [items,setItems] =
    useState<ImportedItem[]>([]);

  const [loading,setLoading] =
    useState(true);

  const [listName,setListName] =
    useState("");

  const incoming =
    shareIntent.files?.find(
      file=>
        file.mimeType === LIST_MIME
        ||
        file.fileName
          ?.toLowerCase()
          .endsWith(".shopwithezz")
    );

  useEffect(()=>{

    let active = true;

    async function readList(){

      if(!incoming?.path && !encodedData){
        if(active){
          setLoading(false);
        }
        return;
      }

      try{

        const raw =
          encodedData
            ? decodeURIComponent(encodedData)
            : await new File(incoming!.path).text();

        const parsed =
          JSON.parse(raw) as {
            format?:string;
            version?:number;
            items?:unknown[];
          };

        if(
          parsed.format
          !==
          "shopwithezz-list"
          ||
          !Array.isArray(parsed.items)
        ){
          throw new Error("Invalid list");
        }

        const safeItems =
          parsed.items
            .map(value=>{

              const item =
                value as Partial<ImportedItem>;

              return {
                name:String(item.name ?? "").trim(),
                price:Math.max(
                  0,
                  Number(item.price || 0)
                ),
                purchased:Boolean(item.purchased),
                quantity:Math.max(
                  1,
                  Math.round(
                    Number(item.quantity || 1)
                  )
                ),
                barcode:item.barcode
                  ? String(item.barcode)
                  : undefined
              };

            })
            .filter(item=>item.name);

        if(!safeItems.length){
          throw new Error("Empty list");
        }

        if(active){
          setItems(safeItems);
        }

      }catch{
        Alert.alert(
          "Could Not Open List",
          "This does not look like a valid ShopWithEzz list."
        );
      }finally{
        if(active){
          setLoading(false);
        }
      }

    }

    void readList();

    return ()=>{
      active = false;
    };

  },[incoming?.path,encodedData]);

  async function finishImport(){
    const cleanName = listName.trim();
    if(!cleanName){
      Alert.alert("Name Your List", "Please give this imported list a name.");
      return;
    }
    const imported = await createList(cleanName,{
      budget:0,
      spent:0,
      items:items.map((item,index)=>({...item,id:`shared-${Date.now()}-${index}`}))
    });
    await selectList(imported.id);

    resetShareIntent();
    router.replace("/shoppingList");
  }

  const total =
    items.reduce(
      (sum,item)=>
        sum
        +
        item.price
        *
        item.quantity,
      0
    );

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop:
            Math.max(insets.top,18)
        }
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={()=>{
            resetShareIntent();
            router.replace("/");
          }}
        >
          <Ionicons
            name="close"
            size={26}
            color="#1D4D35"
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>
            SHARED WITH YOU
          </Text>
          <Text style={styles.title}>
            Import Shopping List
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#2E8B3C"
          />
          <Text style={styles.loadingText}>
            Opening your list…
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryNumber}>
                {items.length}
              </Text>
              <Text style={styles.summaryLabel}>
                items received
              </Text>
            </View>
            <View style={styles.summaryDivider}/>
            <View>
              <Text style={styles.summaryNumber}>
                ${total.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>
                priced total
              </Text>
            </View>
          </View>

          <View style={styles.nameCard}>
            <Text style={styles.nameLabel}>NAME THIS IMPORTED LIST</Text>
            <TextInput
              value={listName}
              onChangeText={setListName}
              placeholder="Type a name here — e.g. Saturday BBQ"
              placeholderTextColor="#8A988E"
              style={styles.nameInput}
              maxLength={60}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={()=>void finishImport()}
            />
            <Text style={styles.nameHint}>Type the name you want before saving. It will be saved as its own list and your existing lists will not be changed.</Text>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {items.map((item,index)=>(
              <View
                key={`${item.name}-${index}`}
                style={styles.item}
              >
                <View style={styles.itemQuantity}>
                  <Text style={styles.itemQuantityText}>
                    {item.quantity}×
                  </Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemStatus}>
                    {item.price > 0
                      ? `$${item.price.toFixed(2)} each`
                      : "Price not added"}
                  </Text>
                </View>
                {item.purchased && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#66B96A"
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <View
            style={[
              styles.actions,
              {
                paddingBottom:
                  Math.max(insets.bottom,18)
              }
            ]}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={()=>void finishImport()}
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>
                Save as Separate List
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

}


const styles = StyleSheet.create({
  screen:{
    flex:1,
    backgroundColor:"#F7F4EF",
    paddingHorizontal:20
  },
  header:{
    flexDirection:"row",
    alignItems:"center",
    gap:14,
    marginBottom:18
  },
  backButton:{
    width:48,
    height:48,
    borderRadius:18,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#E4F2E7"
  },
  eyebrow:{
    color:"#6D8B76",
    fontSize:12,
    fontWeight:"800",
    letterSpacing:1.4
  },
  title:{
    color:"#173F2B",
    fontSize:25,
    fontWeight:"900"
  },
  loading:{
    flex:1,
    alignItems:"center",
    justifyContent:"center",
    gap:14
  },
  loadingText:{
    color:"#64806D",
    fontSize:16,
    fontWeight:"700"
  },
  summary:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-around",
    backgroundColor:"#E6F3E8",
    borderRadius:24,
    paddingVertical:18,
    marginBottom:14
  },
  summaryNumber:{
    color:"#194B31",
    fontSize:23,
    fontWeight:"900",
    textAlign:"center"
  },
  summaryLabel:{
    color:"#6B8272",
    fontSize:13,
    fontWeight:"700"
  },
  summaryDivider:{
    width:1,
    height:42,
    backgroundColor:"#C8DDCC"
  },
  nameCard:{
    marginBottom:14,
    padding:14,
    borderRadius:18,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#DCE7DE"
  },
  nameLabel:{color:"#476454",fontSize:11,fontWeight:"900",letterSpacing:1},
  nameInput:{marginTop:8,minHeight:46,borderRadius:13,paddingHorizontal:12,backgroundColor:"#F4F8F4",fontSize:16,fontWeight:"700",color:"#26362D"},
  nameHint:{marginTop:8,fontSize:12,lineHeight:17,fontWeight:"600",color:"#67806E"},
  list:{
    flex:1
  },
  listContent:{
    gap:9,
    paddingBottom:14
  },
  item:{
    minHeight:68,
    borderRadius:20,
    paddingHorizontal:14,
    flexDirection:"row",
    alignItems:"center",
    gap:12,
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#E3E8E2"
  },
  itemQuantity:{
    minWidth:42,
    height:38,
    paddingHorizontal:8,
    borderRadius:13,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#EFF7EF"
  },
  itemQuantityText:{
    color:"#2E843A",
    fontSize:16,
    fontWeight:"900"
  },
  itemDetails:{
    flex:1
  },
  itemName:{
    color:"#26362D",
    fontSize:17,
    fontWeight:"800"
  },
  itemStatus:{
    color:"#819087",
    fontSize:13,
    fontWeight:"600",
    marginTop:2
  },
  actions:{
    gap:10,
    paddingTop:12
  },
  addButton:{
    minHeight:56,
    borderRadius:18,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center",
    gap:8,
    backgroundColor:"#2E8B3C"
  },
  addButtonText:{
    color:"#FFFFFF",
    fontSize:17,
    fontWeight:"900"
  },
  replaceButton:{
    minHeight:50,
    borderRadius:18,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#FFFFFF",
    borderWidth:1,
    borderColor:"#D7DFD8"
  },
  replaceButtonText:{
    color:"#744F51",
    fontSize:15,
    fontWeight:"800"
  }
});

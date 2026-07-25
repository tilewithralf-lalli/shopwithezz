export const SHOPPING_CATEGORIES = [
  "Fruit & Veg",
  "Dairy",
  "Meat",
  "Bakery",
  "Pantry",
  "Frozen",
  "Drinks",
  "Household",
  "Other"
] as const;

export type ShoppingCategory =
  typeof SHOPPING_CATEGORIES[number];

export const CATEGORY_COLOURS:
  Record<
    ShoppingCategory,
    {
      background:string;
      text:string;
    }
  > = {
    "Fruit & Veg":{
      background:"#E5F5E7",
      text:"#247A36"
    },
    "Dairy":{
      background:"#E5F1FA",
      text:"#286A98"
    },
    "Meat":{
      background:"#FCE8E6",
      text:"#A13E35"
    },
    "Bakery":{
      background:"#FFF0D9",
      text:"#94601C"
    },
    "Pantry":{
      background:"#F3EBDD",
      text:"#74532D"
    },
    "Frozen":{
      background:"#E4F5F7",
      text:"#24747C"
    },
    "Drinks":{
      background:"#EEE8FA",
      text:"#65429A"
    },
    "Household":{
      background:"#ECEFF1",
      text:"#52636D"
    },
    "Other":{
      background:"#F1F4F1",
      text:"#637568"
    }
  };

const CATEGORY_KEYWORDS:
  {
    category:ShoppingCategory;
    words:string[];
  }[] = [
    {
      category:"Fruit & Veg",
      words:[
        "apple","banana","orange","lemon","lime","pear",
        "grape","berry","berries","strawberry","melon",
        "avocado","tomato","potato","onion","garlic",
        "carrot","broccoli","spinach","lettuce","salad",
        "capsicum","cucumber","mushroom","vegetable","fruit"
      ]
    },
    {
      category:"Dairy",
      words:[
        "milk","cheese","yoghurt","yogurt","cream",
        "butter","custard","egg","eggs"
      ]
    },
    {
      category:"Meat",
      words:[
        "beef","chicken","pork","lamb","steak","mince",
        "sausage","bacon","ham","turkey","fish","salmon",
        "tuna","prawn","seafood","meat"
      ]
    },
    {
      category:"Bakery",
      words:[
        "bread","roll","bun","bagel","wrap","tortilla",
        "croissant","muffin","cake","pastry"
      ]
    },
    {
      category:"Frozen",
      words:[
        "frozen","ice cream","icecream","pizza",
        "fish finger","frozen chips"
      ]
    },
    {
      category:"Drinks",
      words:[
        "water","juice","soft drink","soda","cola",
        "coffee","tea","beer","wine","drink"
      ]
    },
    {
      category:"Household",
      words:[
        "toilet paper","paper towel","tissue","detergent",
        "cleaner","bleach","soap","shampoo","conditioner",
        "toothpaste","deodorant","bin bag","foil","battery",
        "dishwashing","laundry"
      ]
    },
    {
      category:"Pantry",
      words:[
        "rice","pasta","noodle","flour","sugar","salt",
        "pepper","oil","sauce","soup","cereal","biscuit",
        "cracker","chip","chocolate","jam","honey",
        "tin","canned","bean","spice"
      ]
    }
  ];

export function categoryForName(
  name:string
):ShoppingCategory{

  const cleanName =
    name.trim().toLowerCase();

  for(const group of CATEGORY_KEYWORDS){

    if(
      group.words.some(word=>
        cleanName.includes(word)
      )
    ){
      return group.category;
    }

  }

  return "Other";

}

export function normaliseCategory(
  category:unknown,
  name:string
):ShoppingCategory{

  const saved =
    String(category || "");

  const match =
    SHOPPING_CATEGORIES.find(
      option=>option === saved
    );

  return match || categoryForName(name);

}

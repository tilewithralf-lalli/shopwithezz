import React from "react";

import {
  Redirect
} from "expo-router";


export default function RemovedFavouritesScreen(){

  return(
    <Redirect href="/shoppingList"/>
  );

}

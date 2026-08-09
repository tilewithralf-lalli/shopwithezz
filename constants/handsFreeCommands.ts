export const HANDS_FREE_COMMANDS = [
  {
    command:"Add milk",
    description:"Adds a new item"
  },
  {
    command:"Collect milk",
    description:"Marks an item collected"
  },
  {
    command:"Collected milk",
    description:"Also marks an item collected"
  },
  {
    command:"Uncollect milk",
    description:"Moves an item back to To Buy"
  },
  {
    command:"Not collected milk",
    description:"Also moves an item back to To Buy"
  },
  {
    command:"Increase milk",
    description:"Adds one to its quantity"
  },
  {
    command:"Decrease milk",
    description:"Removes one from its quantity"
  },
  {
    command:"What is left?",
    description:"Reads your remaining items"
  },
  {
    command:"What's left?",
    description:"Also reads your remaining items"
  },
  {
    command:"Read my list",
    description:"Reads your remaining items"
  },
  {
    command:"Read my collected",
    description:"Reads every collected item"
  },
  {
    command:"Read my whole list",
    description:"Reads every item on your list"
  },
  {
    command:"Read my complete list",
    description:"Also reads every item on your list"
  },
  {
    command:"Read my full list",
    description:"Also reads every item on your list"
  },
  {
    command:"Read all my items",
    description:"Also reads every item on your list"
  },
  {
    command:"Delete my collected",
    description:"Deletes collected items after confirmation"
  },
  {
    command:"Delete my list",
    description:"Deletes the whole list after confirmation"
  },
  {
    command:"Delete my whole list",
    description:"Also deletes the whole list after confirmation"
  },
  {
    command:"Delete my whole",
    description:"Also deletes the whole list after confirmation"
  },
  {
    command:"Stop listening",
    description:"Ends Hands-Free mode"
  },
  {
    command:"Stop mic",
    description:"Also ends Hands-Free mode"
  },
  {
    command:"Done",
    description:"Also ends Hands-Free mode"
  }
] as const;

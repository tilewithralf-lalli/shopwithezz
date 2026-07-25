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
    command:"Uncollect milk",
    description:"Moves an item back to To Buy"
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
    command:"Stop listening",
    description:"Ends Hands-Free mode"
  }
] as const;


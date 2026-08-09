import React, { useEffect, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_NAME_KEY = "shopwithezz-user-name";

export default function WelcomeScreen() {
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadName();
  }, []);

  async function loadName() {
    try {
      const savedName = await AsyncStorage.getItem(USER_NAME_KEY);

      if (savedName) {
        setName(savedName);
        setNameInput(savedName);
      } else {
        setEditingName(true);
      }
    } catch {
      setEditingName(true);
    } finally {
      setLoading(false);
    }
  }

  async function saveName() {
    const cleanName = nameInput.trim();

    if (!cleanName) {
      Alert.alert(
        "Enter Your Name",
        "Please enter the name you would like ShopWithEzz to use."
      );
      return;
    }

    try {
      await AsyncStorage.setItem(USER_NAME_KEY, cleanName);
      setName(cleanName);
      setNameInput(cleanName);
      setEditingName(false);
    } catch {
      Alert.alert("Error", "Your name could not be saved.");
    }
  }

  function cancelEditing() {
    if (!name) {
      return;
    }

    setNameInput(name);
    setEditingName(false);
  }

  function showHowToUse() {
    Alert.alert(
      "How to Use ShopWithEzz",
      [
        "1. Create or open your shopping list.",
        "2. Add items by typing, scanning or using the microphone.",
        "3. Set your budget and add prices as you shop.",
        "4. Use Shopping Mode and tick off each item you buy.",
        "5. Share your list whenever you need to."
      ].join("\n\n"),
      [{ text: "Got it" }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundCircleOne} />
        <View style={styles.backgroundCircleTwo} />

        <View style={styles.topBar}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>🛍️</Text>
          </View>

          <Text style={styles.appName}>ShopWithEzz</Text>
        </View>

        {!loading && (
          <View style={styles.welcomeArea}>
            {editingName ? (
              <View style={styles.nameCard}>
                <Text style={styles.nameCardIcon}>👋</Text>

                <Text style={styles.nameCardTitle}>
                  Welcome to ShopWithEzz
                </Text>

                <Text style={styles.nameCardText}>
                  What name would you like us to use?
                </Text>

                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#90A4AE"
                  autoCapitalize="words"
                  maxLength={30}
                  autoFocus={!name}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />

                <View style={styles.nameButtons}>
                  {name !== "" && (
                    <TouchableOpacity
                      style={styles.cancelNameButton}
                      onPress={cancelEditing}
                    >
                      <Text style={styles.cancelNameText}>Cancel</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.saveNameButton}
                    onPress={saveName}
                  >
                    <Text style={styles.saveNameText}>Save Name</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.greetingArea}>
                <Text style={styles.helloText}>Welcome back,</Text>
                <Text style={styles.userName}>{name} 👋</Text>

                <Text style={styles.greetingText}>
                  Ready to plan what you need and shop smarter?
                </Text>

                <TouchableOpacity
                  style={styles.changeNameButton}
                  onPress={() => setEditingName(true)}
                >
                  <Text style={styles.changeNameText}>✏️ Change name</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroDecorationOne} />
          <View style={styles.heroDecorationTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroIconCircle}>
              <Text style={styles.heroIcon}>🛒</Text>
            </View>

            <View style={styles.smartBadge}>
              <Text style={styles.smartBadgeText}>SMART SHOPPING</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Plan it. Price it. Shop it.</Text>

          <Text style={styles.heroText}>
            Build your shopping list, scan products and stay on budget.
          </Text>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureText}>Shopping List</Text>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureText}>Scanner</Text>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>Budgets</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.howToUseButton}
          onPress={showHowToUse}
          activeOpacity={0.85}
        >
          <View style={styles.howToUseIcon}>
            <Text style={styles.howToUseEmoji}>💡</Text>
          </View>

          <View style={styles.howToUseDetails}>
            <Text style={styles.howToUseTitle}>
              How to Use ShopWithEzz
            </Text>
            <Text style={styles.howToUseText}>
              View a quick guide to shopping smarter
            </Text>
          </View>

          <Text style={styles.howToUseArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How it works</Text>

          <View style={styles.stepsRow}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Create List</Text>
            </View>

            <Text style={styles.stepArrow}>→</Text>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Add Items</Text>
            </View>

            <Text style={styles.stepArrow}>→</Text>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Tick as Bought</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Shop smarter with ShopWithEzz</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#F3F7F1"
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F7F1"
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 35,
    overflow: "hidden"
  },
  backgroundCircleOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#DDF2DF",
    top: -95,
    right: -85
  },
  backgroundCircleTwo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#E8F5E9",
    top: 280,
    left: -110
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28
  },
  miniLogo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3
  },
  miniLogoText: {
    fontSize: 25
  },
  appName: {
    marginLeft: 12,
    fontSize: 23,
    fontWeight: "900",
    color: "#1B5E20",
    letterSpacing: 0.3
  },
  welcomeArea: {
    marginBottom: 22
  },
  greetingArea: {
    alignItems: "flex-start"
  },
  helloText: {
    color: "#607D6B",
    fontSize: 18,
    fontWeight: "700"
  },
  userName: {
    marginTop: 2,
    color: "#173B25",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.8
  },
  greetingText: {
    marginTop: 8,
    color: "#6D8174",
    fontSize: 15,
    lineHeight: 21
  },
  changeNameButton: {
    marginTop: 11,
    backgroundColor: "#E3F2E5",
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 11
  },
  changeNameText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "800"
  },
  nameCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    elevation: 4
  },
  nameCardIcon: {
    fontSize: 30
  },
  nameCardTitle: {
    marginTop: 8,
    color: "#173B25",
    fontSize: 23,
    fontWeight: "900"
  },
  nameCardText: {
    marginTop: 6,
    color: "#6D8174",
    fontSize: 14
  },
  nameInput: {
    marginTop: 16,
    backgroundColor: "#F3F7F1",
    borderWidth: 1,
    borderColor: "#D4E4D5",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: "#263238",
    fontSize: 17,
    fontWeight: "700"
  },
  nameButtons: {
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center"
  },
  cancelNameButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginRight: 8
  },
  cancelNameText: {
    color: "#78909C",
    fontSize: 14,
    fontWeight: "800"
  },
  saveNameButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 11,
    paddingHorizontal: 19,
    borderRadius: 14
  },
  saveNameText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  heroCard: {
    backgroundColor: "#173B25",
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
    elevation: 6
  },
  heroDecorationOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(129,199,132,0.13)",
    top: -70,
    right: -35
  },
  heroDecorationTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -45,
    left: -20
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  heroIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center"
  },
  heroIcon: {
    fontSize: 28
  },
  smartBadge: {
    backgroundColor: "rgba(129,199,132,0.18)",
    borderWidth: 1,
    borderColor: "rgba(129,199,132,0.35)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  smartBadgeText: {
    color: "#A5D6A7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1
  },
  heroTitle: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4
  },
  heroText: {
    marginTop: 8,
    color: "#C8D8CC",
    fontSize: 14,
    lineHeight: 21
  },
  featureRow: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 17,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  featureItem: {
    flex: 1,
    alignItems: "center"
  },
  featureIcon: {
    fontSize: 18
  },
  featureText: {
    marginTop: 4,
    color: "#E8F5E9",
    fontSize: 11,
    fontWeight: "800"
  },
  featureDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.15)"
  },
  howToUseButton: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E1EBE2"
  },
  howToUseIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center"
  },
  howToUseEmoji: {
    fontSize: 27
  },
  howToUseDetails: {
    flex: 1,
    marginLeft: 14
  },
  howToUseTitle: {
    color: "#173B25",
    fontSize: 18,
    fontWeight: "900"
  },
  howToUseText: {
    marginTop: 3,
    color: "#78909C",
    fontSize: 12
  },
  howToUseArrow: {
    color: "#2E7D32",
    fontSize: 34,
    fontWeight: "700"
  },
  howItWorksCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E1EBE2"
  },
  howItWorksTitle: {
    color: "#607D6B",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  stepsRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  step: {
    flex: 1,
    alignItems: "center"
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center"
  },
  stepNumberText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "900"
  },
  stepText: {
    marginTop: 6,
    color: "#607D6B",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center"
  },
  stepArrow: {
    marginTop: 5,
    color: "#A5B7AA",
    fontSize: 17
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    color: "#90A497",
    fontSize: 12,
    fontWeight: "700"
  }
});

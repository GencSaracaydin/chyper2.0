import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../convex/_generated/api";
import { ui } from "./ui";

export function AuthForm() {
  const signIn = useSignInWithUsernamePassword(api.auth);
  const signUp = useSignUpWithUsernamePassword(api.auth);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = signIn.pending || signUp.pending;

  const submit = async () => {
    setError(null);
    const result =
      mode === "signIn" ? await signIn.signIn({ username, password }) : await signUp.signUp({ username, password });
    if (result.status !== "complete") setError(result.userError.error.replace(/_/g, " ").toLowerCase());
  };

  return (
    <View style={styles.wrap}>
      <Text style={ui.h1}>{mode === "signIn" ? "Sign in to make games" : "Create your account"}</Text>
      <TextInput
        style={ui.input}
        placeholder="Username"
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoComplete="username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={ui.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={ui.error}>{error}</Text> : null}
      <Pressable style={[ui.button, pending && ui.disabled]} onPress={submit} disabled={pending}>
        <Text style={ui.buttonText}>{mode === "signIn" ? "Sign in" : "Create account"}</Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
        <Text style={ui.link}>{mode === "signIn" ? "New here? Create an account" : "Have an account? Sign in"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
});

import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "./convex/_generated/api";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function App() {
  return (
    <ConvexAuthProvider
      client={convex}
      storage={secureStorage}
      api={{
        refreshSession: api.auth.refreshSession,
        signOut: api.auth.signOut,
        isAuthenticated: api.auth.isAuthenticated,
      }}
    >
      <View style={styles.container}>
        <AuthLoading>
          <Text>Loading…</Text>
        </AuthLoading>
        <Unauthenticated>
          <AuthForm />
        </Unauthenticated>
        <Authenticated>
          <Moments />
        </Authenticated>
        <StatusBar style="auto" />
      </View>
    </ConvexAuthProvider>
  );
}

function AuthForm() {
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
      mode === "signIn"
        ? await signIn.signIn({ username, password })
        : await signUp.signUp({ username, password });
    if (result.status !== "complete") {
      setError(result.userError.error);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        autoComplete="username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={mode === "signIn" ? "Sign in" : "Create account"}
        onPress={submit}
        disabled={pending}
      />
      <Button
        title={mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
        onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
      />
    </View>
  );
}

function Moments() {
  const { signOut } = useAuthActions();
  const moments = useQuery(api.moments.listMine);
  const addMoment = useMutation(api.moments.add);
  const [text, setText] = useState("");

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="What's happening?"
        value={text}
        onChangeText={setText}
      />
      <Button
        title="Add moment"
        disabled={text.trim() === ""}
        onPress={async () => {
          await addMoment({ text: text.trim() });
          setText("");
        }}
      />
      <FlatList
        data={moments ?? []}
        keyExtractor={(moment) => moment._id}
        renderItem={({ item }) => <Text style={styles.moment}>{item.text}</Text>}
      />
      <Button title="Sign out" onPress={() => void signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '80%',
    gap: 8,
    paddingVertical: 64,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
  },
  error: {
    color: '#c00',
  },
  moment: {
    paddingVertical: 6,
  },
});

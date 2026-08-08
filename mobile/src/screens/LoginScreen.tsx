import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
    } catch {
      setError("Telefon veya şifre hatalı");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>SultanSu</Text>
        <Text style={styles.subtitle}>Kurye Girişi</Text>

        <Text style={styles.label}>Telefon</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="5550000002"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#12233d",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 360,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#12233d" },
  subtitle: { fontSize: 14, color: "#6b7683", marginBottom: 20 },
  label: { fontSize: 13, color: "#6b7683", marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e5e9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { color: "#d63b3b", marginTop: 12, fontSize: 13 },
  button: {
    backgroundColor: "#1d6fd6",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});

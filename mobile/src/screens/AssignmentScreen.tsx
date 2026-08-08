import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, ApiError, type AssignmentItemView, type AssignmentView } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function AssignmentScreen() {
  const { user, logout } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignmentItemView | null>(null);
  const [quantity, setQuantity] = useState("");
  const [saleError, setSaleError] = useState<string | null>(null);
  const [submittingSale, setSubmittingSale] = useState(false);

  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.activeAssignment();
      setAssignment(data);
      setNotFound(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setAssignment(null);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openSaleModal(item: AssignmentItemView) {
    setSelectedItem(item);
    setQuantity("");
    setSaleError(null);
    setSaleModalVisible(true);
  }

  async function submitSale() {
    if (!assignment || !selectedItem) return;
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setSaleError("Geçerli bir miktar girin");
      return;
    }
    if (qty > selectedItem.quantityRemaining) {
      setSaleError(`Kalan miktardan fazla giremezsiniz (kalan: ${selectedItem.quantityRemaining})`);
      return;
    }
    setSubmittingSale(true);
    setSaleError(null);
    try {
      const updated = await api.addSale(assignment.id, selectedItem.product.id, qty);
      setAssignment(updated);
      setSaleModalVisible(false);
    } catch (err) {
      setSaleError(err instanceof ApiError ? err.message : "Satış girilemedi");
    } finally {
      setSubmittingSale(false);
    }
  }

  async function confirmClose() {
    if (!assignment) return;
    setClosing(true);
    try {
      const updated = await api.closeAssignment(assignment.id);
      setAssignment(updated);
      setCloseModalVisible(false);
    } catch (err) {
      Alert.alert("Hata", err instanceof ApiError ? err.message : "Gün kapatılamadı");
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d6fd6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Merhaba, {user?.name}</Text>
          <Text style={styles.headerSubtitle}>Bugünkü Zimmetim</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {notFound && (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Bugün size henüz bir zimmet atanmadı. Patronunuzla iletişime geçin.</Text>
        </View>
      )}

      {assignment && (
        <>
          {assignment.status === "CLOSED" && (
            <View style={[styles.card, styles.closedBanner]}>
              <Text style={styles.closedBannerText}>
                Gün kapatıldı. Kalan ürünler depoya iade edildi.
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zimmetim ({assignment.status === "OPEN" ? "Sahada" : "Kapandı"})</Text>
            {assignment.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemMeta}>
                    Zimmet: {item.quantityAssigned} · Satılan: {item.quantitySold} · Kalan: {item.quantityRemaining}
                    {item.quantityReturned != null ? ` · İade: ${item.quantityReturned}` : ""}
                  </Text>
                </View>
                {assignment.status === "OPEN" && item.quantityRemaining > 0 && (
                  <TouchableOpacity style={styles.smallButton} onPress={() => openSaleModal(item)}>
                    <Text style={styles.smallButtonText}>Satış Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Satışlarım ({assignment.totalSalesAmount.toLocaleString("tr-TR")} ₺)</Text>
            {assignment.sales.length === 0 ? (
              <Text style={styles.emptyText}>Henüz satış girilmedi.</Text>
            ) : (
              assignment.sales
                .slice()
                .reverse()
                .map((sale) => (
                  <View key={sale.id} style={styles.saleRow}>
                    <Text style={styles.itemName}>
                      {sale.product.name} × {sale.quantity}
                    </Text>
                    <Text style={styles.itemMeta}>{sale.total.toLocaleString("tr-TR")} ₺</Text>
                  </View>
                ))
            )}
          </View>

          {assignment.status === "OPEN" && (
            <TouchableOpacity style={styles.closeDayButton} onPress={() => setCloseModalVisible(true)}>
              <Text style={styles.closeDayButtonText}>Günü Kapat</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Satış Ekle Modal */}
      <Modal visible={saleModalVisible} transparent animationType="slide" onRequestClose={() => setSaleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.cardTitle}>{selectedItem?.product.name} — Satış Ekle</Text>
            <Text style={styles.itemMeta}>Kalan: {selectedItem?.quantityRemaining}</Text>
            <TextInput
              style={styles.input}
              placeholder="Miktar"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
            {saleError && <Text style={styles.error}>{saleError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setSaleModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={submitSale} disabled={submittingSale}>
                {submittingSale ? <ActivityIndicator color="#fff" /> : <Text style={styles.smallButtonText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Günü Kapat Modal */}
      <Modal visible={closeModalVisible} transparent animationType="slide" onRequestClose={() => setCloseModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.cardTitle}>Günü Kapat</Text>
            <Text style={styles.itemMeta}>Aşağıdaki kalan ürünler depoya iade edilecek:</Text>
            {assignment?.items
              .filter((i) => i.quantityRemaining > 0)
              .map((i) => (
                <Text key={i.id} style={styles.itemName}>
                  {i.product.name}: {i.quantityRemaining} adet
                </Text>
              ))}
            {assignment?.items.every((i) => i.quantityRemaining === 0) && (
              <Text style={styles.itemName}>İade edilecek ürün yok, hepsi satıldı.</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCloseModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeDayButton} onPress={confirmClose} disabled={closing}>
                {closing ? <ActivityIndicator color="#fff" /> : <Text style={styles.closeDayButtonText}>Onayla ve Kapat</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f6f8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f6f8" },
  content: { padding: 18, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#12233d" },
  headerSubtitle: { fontSize: 13, color: "#6b7683" },
  logout: { color: "#d63b3b", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e5e9",
  },
  closedBanner: { backgroundColor: "#dcf3e4", borderColor: "#b7e4c7" },
  closedBannerText: { color: "#146c3a", fontSize: 13, fontWeight: "600" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#12233d", marginBottom: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef1f4",
  },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1c2530" },
  itemMeta: { fontSize: 12.5, color: "#6b7683", marginTop: 2 },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#eef1f4",
  },
  emptyText: { color: "#6b7683", fontSize: 13.5 },
  smallButton: {
    backgroundColor: "#1d6fd6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  smallButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "#eef1f4",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: { color: "#1c2530", fontSize: 13.5, fontWeight: "600" },
  closeDayButton: {
    backgroundColor: "#d63b3b",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  closeDayButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 22,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e5e9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 12,
  },
  error: { color: "#d63b3b", marginTop: 10, fontSize: 13 },
});

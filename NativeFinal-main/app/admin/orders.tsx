import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const COLORS = {
    primary: '#007AFF',
    danger: '#FF3B30',
    success: '#34C759',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
    white: '#FFFFFF',
};

export default function AdminOrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const storedOrders = await AsyncStorage.getItem('orders');
            if (storedOrders) {
                setOrders(JSON.parse(storedOrders).reverse());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (order: any, newStatus: string) => {
        try {
            const storedOrders = await AsyncStorage.getItem('orders');
            if (storedOrders) {
                const currentOrders = JSON.parse(storedOrders);
                const idx = currentOrders.findIndex((o: any) => o.id === order.id);
                if (idx > -1) {
                    currentOrders[idx].status = newStatus;
                    await AsyncStorage.setItem('orders', JSON.stringify(currentOrders));
                    setOrders([...currentOrders].reverse());

                    if (order.userEmail) {
                        const notifKey = `notifications_${order.userEmail}`;
                        const storedNotifs = await AsyncStorage.getItem(notifKey) || '[]';
                        const parseNotifs = JSON.parse(storedNotifs);

                        parseNotifs.unshift({
                            id: Date.now().toString(),
                            title: 'Sifariş Statusu Yeniləndi',
                            message: `#${order.id.slice(0, 8)} saylı sifarişinizin yeni statusu: ${newStatus}`,
                            date: new Date().toLocaleString('az-AZ'),
                            read: false
                        });
                        await AsyncStorage.setItem(notifKey, JSON.stringify(parseNotifs));
                    }
                }
            }
        } catch (error) {
            console.error('Status Error:', error);
        }
    };

    const deleteOrder = async (order: any) => {
        try {
            const storedOrders = await AsyncStorage.getItem('orders');
            if (storedOrders) {
                const currentOrders = JSON.parse(storedOrders);
                const updatedOrders = currentOrders.filter((o: any) => String(o.id) !== String(order.id));
                await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));

                setOrders([...updatedOrders].reverse());
            }

            if (order.userEmail) {
                const notifKey = `notifications_${order.userEmail}`;
                const storedNotifs = await AsyncStorage.getItem(notifKey) || '[]';
                const parseNotifs = JSON.parse(storedNotifs);
                parseNotifs.unshift({
                    id: Date.now().toString(),
                    title: 'Sifariş Ləğv Edildi',
                    message: `#${order.id.slice(0, 8)} saylı sifarişiniz admin tərəfindən ləğv edildi.`,
                    date: new Date().toLocaleString('az-AZ'),
                    read: false
                });
                await AsyncStorage.setItem(notifKey, JSON.stringify(parseNotifs));
            }
        } catch (error) {
            console.error('Delete order error:', error);
        }
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.idText}>ID: #{item.id.slice(0, 8)}</Text>
                    <Text style={styles.dateText}>{item.date || 'Bugün'}</Text>
                    <Text style={styles.emailText}>{item.userEmail || 'Anonim'}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    item.status === 'Çatdırıldı' ? styles.statusSuccess :
                        item.status === 'Kuryerdə' ? styles.statusWarning :
                            styles.statusInfo
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'Çatdırıldı' ? styles.textSuccess :
                            item.status === 'Kuryerdə' ? styles.textWarning :
                                styles.textInfo
                    ]}>{item.status || 'Gözləmədə'}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderBody}>
                {item.items?.map((prod: any, idx: number) => (
                    <Text key={idx} style={styles.prodRow}>
                        • {prod.title} x {prod.quantity || 1}
                    </Text>
                ))}
            </View>

            <View style={styles.statusActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, item.status === 'Hazırlanır' && styles.actionBtnActive]}
                    onPress={() => updateOrderStatus(item, 'Hazırlanır')}
                >
                    <Text style={[styles.actionBtnText, item.status === 'Hazırlanır' && { color: '#FFF' }]}>Hazırlanır</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, item.status === 'Kuryerdə' && styles.actionBtnActive]}
                    onPress={() => updateOrderStatus(item, 'Kuryerdə')}
                >
                    <Text style={[styles.actionBtnText, item.status === 'Kuryerdə' && { color: '#FFF' }]}>Kuryerdə</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, item.status === 'Çatdırıldı' && styles.actionBtnActive]}
                    onPress={() => updateOrderStatus(item, 'Çatdırıldı')}
                >
                    <Text style={[styles.actionBtnText, item.status === 'Çatdırıldı' && { color: '#FFF' }]}>Çatdırıldı</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Məbləğ:</Text>
                <Text style={styles.totalVal}>{item.total} ₼</Text>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOrder(item)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                <Text style={styles.deleteBtnText}>Sifarişi Sil</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sifarişlərin İdarə Edilməsi</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.main}>
                {isLoading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>Heç bir sifariş yoxdur</Text>}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    main: { flex: 1, padding: 16 },
    list: { paddingBottom: 20 },
    orderCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    idText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
    dateText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    emailText: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusInfo: { backgroundColor: '#E3F2FD' },
    statusWarning: { backgroundColor: '#FFF3E0' },
    statusSuccess: { backgroundColor: '#E8F5E9' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    textInfo: { color: '#1976D2' },
    textWarning: { color: '#F57C00' },
    textSuccess: { color: '#2E7D32' },
    divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
    orderBody: { marginBottom: 12 },
    prodRow: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
    statusActions: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 5 },
    actionBtn: { flex: 1, backgroundColor: '#F0F0F0', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
    actionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    actionBtnText: { fontSize: 11, color: '#666', fontWeight: '500' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    totalLabel: { fontSize: 14, color: COLORS.textSecondary },
    totalVal: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#FFEBEB' },
    deleteBtnText: { marginLeft: 6, fontSize: 13, color: COLORS.danger, fontWeight: '500' },
    emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textSecondary, fontSize: 14 },
});

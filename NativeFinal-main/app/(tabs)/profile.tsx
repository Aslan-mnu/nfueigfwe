import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState<{ name: string; surname: string; email: string } | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings' | 'favorites' | 'notifications' | 'edit_account'>('menu');
    const [orders, setOrders] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);

    // Edit Profile State
    const [editName, setEditName] = useState('');
    const [editSurname, setEditSurname] = useState('');
    const [notifCount, setNotifCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const parsed = JSON.parse(userJson);
                setUserData(parsed);
                setEditName(parsed.name);
                setEditSurname(parsed.surname);
            }

            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');

            const storedOrders = await AsyncStorage.getItem('orders');
            if (storedOrders) setOrders(JSON.parse(storedOrders));

            const storedFavs = await AsyncStorage.getItem('favorites');
            if (storedFavs) setFavorites(JSON.parse(storedFavs));

            const hasReadNotifs = await AsyncStorage.getItem('notificationsRead');
            setNotifCount(hasReadNotifs === 'true' ? 0 : 1);
        } catch (error) {
            console.error('Failed to load data', error);
        }
    };

    const toggleDarkMode = async () => {
        const newValue = !isDarkMode;
        setIsDarkMode(newValue);
        await AsyncStorage.setItem('darkMode', String(newValue));
        DeviceEventEmitter.emit('themeChanged', newValue);
    };

    const handleUpdateAccount = async () => {
        try {
            const updatedUser = { ...userData, name: editName, surname: editSurname };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUserData(updatedUser as any);
            setActiveTab('settings');
            Alert.alert('Uğurlu', 'Məlumatlar yeniləndi!');
        } catch (error) {
            console.error(error);
        }
    };

    const cancelOrder = async (orderId: string) => {
        try {
            const newOrders = orders.filter(o => o.id !== orderId);
            await AsyncStorage.setItem('orders', JSON.stringify(newOrders));
            setOrders(newOrders);
        } catch (error) {
            console.error(error);
        }
    };

    const removeFavorite = async (id: string) => {
        try {
            const newFavs = favorites.filter(f => f.id !== id);
            await AsyncStorage.setItem('favorites', JSON.stringify(newFavs));
            setFavorites(newFavs);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        router.replace('/login');
    };

    const MenuItem = ({ icon, title, badge, onPress }: { icon: string; title: string; badge?: number, onPress?: () => void }) => (
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon as any} size={24} color={isDarkMode ? '#AAA' : '#666'} />
                <Text style={[styles.menuItemTitle, isDarkMode && styles.menuItemTitleDark]}>{title}</Text>
            </View>
            <View style={styles.menuItemRight}>
                {badge ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                ) : null}
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#555' : '#CCC'} />
            </View>
        </TouchableOpacity>
    );

    const OrderCard = ({ order }: { order: any }) => (
        <View style={[styles.orderCard, isDarkMode && styles.orderCardDark]}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={[styles.orderDate, isDarkMode && styles.textDark]}>Sifariş #{order.id.slice(0, 8)}</Text>
                    <Text style={[styles.orderInfo, isDarkMode && styles.textDarkSecondary]}>{order.date || 'Bugün'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.cancelOrderBtn}
                    onPress={() => cancelOrder(order.id)}
                >
                    <Text style={styles.cancelOrderTxt}>Ləğv et</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.deliveryInfoRow}>
                    <Ionicons name="time-outline" size={14} color={isDarkMode ? '#007AFF' : '#666'} />
                    <Text style={[styles.deliveryInfoTxt, isDarkMode && styles.textDarkSecondary]}>
                        Çatdırılma: {order.deliveryDate || 'Məlum deyil'}
                    </Text>
                </View>
                <Text style={[styles.orderTotal, isDarkMode && styles.textDark]}>{order.total} ₼</Text>
            </View>
            <View style={{ marginTop: 8 }}>
                <Text style={[styles.orderInfo, isDarkMode && styles.textDarkSecondary]}>
                    {order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0} məhsul
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person-outline" size={40} color="#FFF" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {userData ? `${userData.name} ${userData.surname}` : 'Qonaq İstifadəçi'}
                        </Text>
                        <Text style={styles.userEmail}>
                            {userData?.email || 'email@example.com'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.contentWrapper, isDarkMode && styles.contentWrapperDark]}>
                <ScrollView contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                    {activeTab === 'menu' && (
                        <View style={styles.menuContainer}>
                            <MenuItem
                                icon="cube-outline"
                                title="Sifarişlərim"
                                onPress={() => setActiveTab('orders')}
                            />
                            <MenuItem
                                icon="heart-outline"
                                title="Sevimli Məhsullar"
                                onPress={() => setActiveTab('favorites')}
                            />
                            <MenuItem
                                icon="notifications-outline"
                                title="Bildirişlər"
                                badge={notifCount > 0 ? notifCount : undefined}
                                onPress={() => {
                                    setActiveTab('notifications');
                                    setNotifCount(0);
                                    AsyncStorage.setItem('notificationsRead', 'true');
                                }}
                            />
                            <MenuItem
                                icon="settings-outline"
                                title="Tənzimləmələr"
                                onPress={() => setActiveTab('settings')}
                            />
                        </View>
                    )}

                    {activeTab === 'orders' && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Mənim Sifarişlərim</Text>
                                <TouchableOpacity onPress={() => setActiveTab('menu')}><Text style={styles.backLink}>Geri</Text></TouchableOpacity>
                            </View>
                            {orders.length === 0 ? (
                                <Text style={[styles.emptyText, isDarkMode && styles.textDarkSecondary]}>Heç bir sifariş yoxdur</Text>
                            ) : orders.map(order => <OrderCard key={order.id} order={order} />)}
                        </View>
                    )}

                    {activeTab === 'favorites' && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Sevimli Məhsullar</Text>
                                <TouchableOpacity onPress={() => setActiveTab('menu')}><Text style={styles.backLink}>Geri</Text></TouchableOpacity>
                            </View>
                            {favorites.length === 0 ? (
                                <Text style={[styles.emptyText, isDarkMode && styles.textDarkSecondary]}>Heç bir bəyənilmiş məhsul yoxdur</Text>
                            ) : favorites.map(item => (
                                <View key={item.id} style={[styles.orderCard, isDarkMode && styles.orderCardDark]}>
                                    <View style={styles.orderHeader}>
                                        <Text style={[styles.orderDate, isDarkMode && styles.textDark]}>{item.title}</Text>
                                        <TouchableOpacity onPress={() => removeFavorite(item.id)}>
                                            <Ionicons name="heart" size={24} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={[styles.orderTotal, isDarkMode && styles.textDark]}>{item.price} ₼</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {activeTab === 'notifications' && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Bildirişlər</Text>
                                <TouchableOpacity onPress={() => setActiveTab('menu')}><Text style={styles.backLink}>Geri</Text></TouchableOpacity>
                            </View>
                            <View style={[styles.orderCard, isDarkMode && styles.orderCardDark]}>
                                <Text style={[styles.orderDate, isDarkMode && styles.textDark]}>Xoş gəldiniz!</Text>
                                <Text style={[styles.orderInfo, isDarkMode && styles.textDarkSecondary]}>MiniShop tətbiqini seçdiyiniz üçün təşəkkürlər.</Text>
                            </View>
                        </View>
                    )}

                    {activeTab === 'settings' && (
                        <View style={styles.sectionContainer}>
                            <View style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
                                <View style={styles.settingTextContent}>
                                    <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={isDarkMode ? "#007AFF" : "#666"} />
                                    <Text style={[styles.settingLabel, isDarkMode && styles.textDark]}>Qara Rejim</Text>
                                </View>
                                <TouchableOpacity onPress={toggleDarkMode} style={[styles.toggleWrap, isDarkMode && styles.toggleWrapDark]}>
                                    <View style={[styles.toggleDot, isDarkMode && styles.toggleDotDark]} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]} onPress={() => setActiveTab('edit_account')}>
                                <View style={styles.settingTextContent}>
                                    <Ionicons name="person-circle-outline" size={22} color={isDarkMode ? "#007AFF" : "#666"} />
                                    <Text style={[styles.settingLabel, isDarkMode && styles.textDark]}>Hesab məlumatlarını dəyiş</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CCC" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('menu')} style={styles.backBtn}><Text style={styles.backBtnTxt}>Geri qayıt</Text></TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'edit_account' && (
                        <View style={styles.sectionContainer}>
                            <Text style={[styles.sectionTitle, isDarkMode && styles.textDark, { marginBottom: 20 }]}>Məlumatları Yenilə</Text>
                            <View style={styles.inputBox}>
                                <Text style={[styles.inputLab, isDarkMode && styles.textDarkSecondary]}>Ad</Text>
                                <TextInput style={[styles.inp, isDarkMode && styles.inpDark]} value={editName} onChangeText={setEditName} />
                            </View>
                            <View style={styles.inputBox}>
                                <Text style={[styles.inputLab, isDarkMode && styles.textDarkSecondary]}>Soyad</Text>
                                <TextInput style={[styles.inp, isDarkMode && styles.inpDark]} value={editSurname} onChangeText={setEditSurname} />
                            </View>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateAccount}><Text style={styles.saveBtnTxt}>Yadda Saxla</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('settings')} style={styles.backBtn}><Text style={styles.backBtnTxt}>Ləğv et</Text></TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.logoutBtn, isDarkMode && styles.logoutBtnDark]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutTxt}>Çıxış</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#007AFF' },
    containerDark: { backgroundColor: '#1A1A1A' },
    header: { backgroundColor: '#007AFF', paddingBottom: 30, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: Platform.OS === 'android' ? 20 : 0 },
    headerDark: { backgroundColor: '#1A1A1A' },
    profileInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', marginRight: 16 },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginBottom: 4 },
    userEmail: { fontSize: 14, fontFamily: 'Inter-Regular', color: 'rgba(255,255,255,0.8)' },
    contentWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
    contentWrapperDark: { backgroundColor: '#121212' },
    menuContainer: { paddingHorizontal: 24 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    menuItemDark: { borderBottomColor: '#2A2A2A' },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuItemTitle: { marginLeft: 12, fontSize: 15, fontFamily: 'Inter-Medium', color: '#333' },
    menuItemTitleDark: { color: '#EEE' },
    menuItemRight: { flexDirection: 'row', alignItems: 'center' },
    badge: { backgroundColor: '#007AFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
    badgeText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter-Bold' },
    sectionContainer: { paddingHorizontal: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontFamily: 'Montserrat-Bold', color: '#111' },
    backLink: { color: '#007AFF', fontFamily: 'Inter-Medium' },
    orderCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
    orderCardDark: { backgroundColor: '#1E1E1E', borderColor: '#333' },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    orderDate: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#333' },
    orderInfo: { fontSize: 13, color: '#666' },
    orderTotal: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#007AFF' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    deliveryInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    deliveryInfoTxt: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#666' },
    cancelOrderBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    cancelOrderTxt: { color: '#FFF', fontSize: 11, fontFamily: 'Inter-Bold' },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    settingItemDark: { borderBottomColor: '#2A2A2A' },
    settingTextContent: { flexDirection: 'row', alignItems: 'center' },
    settingLabel: { marginLeft: 12, fontSize: 15, fontFamily: 'Inter-Medium', color: '#333' },
    toggleWrap: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#E8E8E8', padding: 2 },
    toggleWrapDark: { backgroundColor: '#007AFF' },
    toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
    toggleDotDark: { alignSelf: 'flex-end' },
    inputBox: { marginBottom: 16 },
    inputLab: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#666', marginBottom: 8 },
    inp: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, fontFamily: 'Inter-Regular', color: '#333' },
    inpDark: { backgroundColor: '#1E1E1E', color: '#FFF' },
    saveBtn: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 20 },
    saveBtnTxt: { color: '#FFF', fontSize: 16, fontFamily: 'Inter-Bold' },
    backBtn: { marginTop: 24, alignItems: 'center', padding: 12 },
    backBtnTxt: { color: '#007AFF', fontFamily: 'Inter-Bold' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30', marginTop: 40, backgroundColor: '#FFF' },
    logoutBtnDark: { backgroundColor: '#1A1A1A' },
    logoutTxt: { color: '#FF3B30', fontSize: 16, fontFamily: 'Inter-SemiBold' },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, fontFamily: 'Inter-Medium', color: '#999' },
    textDark: { color: '#FFF' },
    textDarkSecondary: { color: '#AAA' },
});

import { DeviceEventEmitter } from 'react-native';

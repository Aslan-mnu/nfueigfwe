import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    DeviceEventEmitter,
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import DeliverySystem from '../../components/DeliveryEstimator';

interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    category: string;
}

export default function CartScreen() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [shippingType, setShippingType] = useState<'Standard' | 'Express' | 'Manual'>('Standard');
    const [manualDate, setManualDate] = useState<Date | undefined>(undefined);
    const [deliveryEstimate, setDeliveryEstimate] = useState<string>('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('themeChanged', (val) => setIsDarkMode(val));
        return () => sub.remove();
    }, []);

    const loadAllData = async () => {
        try {
            const storedCart = await AsyncStorage.getItem('cart');
            setCartItems(storedCart ? JSON.parse(storedCart) : []);

            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');
        } catch (error) { console.error(error); }
    };

    const updateQuantity = async (id: string, delta: number) => {
        try {
            let newCart = [...cartItems];
            const index = newCart.findIndex(item => item.id === id);
            if (index > -1) {
                newCart[index].quantity += delta;
                if (newCart[index].quantity <= 0) {
                    newCart = newCart.filter(item => item.id !== id);
                }
                await AsyncStorage.setItem('cart', JSON.stringify(newCart));
                setCartItems(newCart);
            }
        } catch (error) { console.error(error); }
    };

    const removeItem = async (id: string) => {
        try {
            const newCart = cartItems.filter(item => item.id !== id);
            await AsyncStorage.setItem('cart', JSON.stringify(newCart));
            setCartItems(newCart);
        } catch (error) { console.error(error); }
    };

    const handleCheckout = async () => {
        try {
            if (shippingType === 'Manual' && !manualDate) {
                Alert.alert('Xəta', 'Lütfən çatdırılma tarixini seçin.');
                return;
            }

            const storedOrders = await AsyncStorage.getItem('orders') || '[]';
            const orders = JSON.parse(storedOrders);

            const newOrder = {
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toLocaleDateString('az-AZ'),
                items: cartItems,
                total: total.toFixed(2),
                status: 'Sifariş verildi',
                shippingType: shippingType === 'Standard' ? 'Standart' : shippingType === 'Express' ? 'Express' : 'Manual',
                deliveryDate: deliveryEstimate || (shippingType === 'Manual' ? manualDate?.toLocaleDateString('az-AZ') : 'Təxmini')
            };

            orders.unshift(newOrder); // Add to beginning
            await AsyncStorage.setItem('orders', JSON.stringify(orders));
            await AsyncStorage.removeItem('cart');
            setCartItems([]);

            Alert.alert('Uğurlu', 'Sifarişiniz qəbul edildi!', [
                { text: 'Tamam', onPress: () => router.push('/(tabs)/profile') }
            ]);
        } catch (error) { console.error(error); }
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = cartItems.length > 0 ? (shippingType === 'Standard' ? 2.00 : shippingType === 'Express' ? 10.00 : 5.00) : 0;
    const total = subtotal + shipping;

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={[styles.cartItem, isDarkMode && styles.cartItemDark]}>
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="contain" />
            <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, isDarkMode && styles.textDark]} numberOfLines={1}>{item.title}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.itemCategory, isDarkMode && styles.textDarkSecondary]}>{item.category}</Text>
                <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>{item.price} ₼</Text>
                    <View style={[styles.quantityContainer, isDarkMode && styles.quantityContainerDark]}>
                        <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, -1)}>
                            <Ionicons name="remove" size={16} color={isDarkMode ? '#FFF' : '#333'} />
                        </TouchableOpacity>
                        <Text style={[styles.quantityText, isDarkMode && styles.textDark]}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, 1)}>
                            <Ionicons name="add" size={16} color={isDarkMode ? '#FFF' : '#333'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFF' : '#333'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Səbət ({cartItems.length})</Text>
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyContent}>
                    <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                        <Ionicons name="cart-outline" size={80} color={isDarkMode ? '#555' : '#999'} />
                    </View>
                    <Text style={[styles.emptyTitle, isDarkMode && styles.textDark]}>Səbət boşdur</Text>
                    <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/(tabs)')}>
                        <Text style={styles.shopButtonText}>Alış-verişə başla</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList data={cartItems} renderItem={renderCartItem} keyExtractor={item => item.id} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />
                    <View style={[styles.footer, isDarkMode && styles.footerDark]}>
                        <View style={{ marginBottom: 20 }}>
                            <DeliverySystem
                                productName="Səbətdəki məhsullar"
                                productPrice={subtotal}
                                isDarkMode={isDarkMode}
                                currentType={shippingType}
                                onTypeChange={(type) => setShippingType(type)}
                                manualDate={manualDate}
                                onDateChange={(date) => setManualDate(date)}
                                onEstimateChange={(est) => setDeliveryEstimate(est)}
                            />
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, isDarkMode && styles.textDarkSecondary]}>Məhsulun qiyməti</Text>
                            <Text style={[styles.summaryValue, isDarkMode && styles.textDark]}>{subtotal.toFixed(2)} ₼</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, isDarkMode && styles.textDarkSecondary]}>Çatdırılma</Text>
                            <Text style={[styles.summaryValue, isDarkMode && styles.textDark]}>{shipping.toFixed(2)} ₼</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={[styles.totalLabel, isDarkMode && styles.textDark]}>Ümumi</Text>
                            <Text style={styles.totalValue}>{total.toFixed(2)} ₼</Text>
                        </View>
                        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                            <Text style={styles.checkoutButtonText}>Sifarişi tamamla</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: Platform.OS === 'android' ? 40 : 0 },
    containerDark: { backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerDark: { backgroundColor: '#1A1A1A', borderBottomColor: '#333' },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#111' },
    listContent: { padding: 16 },
    cartItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 16, elevation: 3 },
    cartItemDark: { backgroundColor: '#1A1A1A', elevation: 0, borderWidth: 1, borderColor: '#333' },
    itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F5F5F5' },
    itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#333', flex: 1, marginRight: 8 },
    itemCategory: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#999', marginTop: 2 },
    itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    itemPrice: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#007AFF' },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 4 },
    quantityContainerDark: { backgroundColor: '#333' },
    quantityButton: { padding: 6 },
    quantityText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#333', marginHorizontal: 12 },
    footer: { backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
    footerDark: { backgroundColor: '#1A1A1A', elevation: 0, borderTopWidth: 1, borderTopColor: '#333' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#666' },
    summaryValue: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#333' },
    totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginBottom: 20 },
    totalLabel: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#111' },
    totalValue: { fontSize: 20, fontFamily: 'Inter-ExtraBold', color: '#007AFF' },
    checkoutButton: { backgroundColor: '#007AFF', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    checkoutButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-Bold' },
    emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    iconContainer: { marginBottom: 24, width: 120, height: 120, borderRadius: 60, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    iconContainerDark: { backgroundColor: '#1A1A1A' },
    emptyTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#111', marginBottom: 12 },
    shopButton: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center' },
    shopButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-Bold' },
    textDark: { color: '#FFF' },
    textDarkSecondary: { color: '#AAA' },
});

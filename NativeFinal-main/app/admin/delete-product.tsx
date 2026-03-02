import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const COLORS = {
    primary: '#007AFF',
    danger: '#FF3B30',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    white: '#FFFFFF',
};

export default function DeleteProductScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [])
    );

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const storedProducts = await AsyncStorage.getItem('products');
            if (storedProducts) {
                setProducts(JSON.parse(storedProducts));
            }
        } catch (error) {
            console.error('Load Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string, name: string) => {
        deleteProduct(id);
    };

    const deleteProduct = async (id: string) => {
        try {
            const newProducts = products.filter(item => String(item.id) !== String(id));
            await AsyncStorage.setItem('products', JSON.stringify(newProducts));
            setProducts(newProducts);

            const storedCart = await AsyncStorage.getItem('cart');
            if (storedCart) {
                const currentCart = JSON.parse(storedCart);
                const newCart = currentCart.filter((item: any) => String(item.id) !== String(id));
                await AsyncStorage.setItem('cart', JSON.stringify(newCart));
            }

            const storedFavs = await AsyncStorage.getItem('favorites');
            if (storedFavs) {
                const currentFavs = JSON.parse(storedFavs);
                const newFavs = currentFavs.filter((item: any) => String(item.id) !== String(id));
                await AsyncStorage.setItem('favorites', JSON.stringify(newFavs));
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Xəta', error.message);
        }
    };

    const renderProductItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardPrice}>{item.price} ₼</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item.id, item.title)}
            >
                <Ionicons name="trash" size={24} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Məhsul Sil</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.main}>
                {isLoading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                    <FlatList
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyText}>Məhsul tapılmadı</Text>}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    main: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
    list: { paddingBottom: 20 },
    card: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center', elevation: 2 },
    cardImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15, backgroundColor: '#F0F0F0' },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    cardPrice: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
    deleteBtn: { padding: 10, backgroundColor: '#FFEBEB', borderRadius: 10 },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 50, fontSize: 14 },
});

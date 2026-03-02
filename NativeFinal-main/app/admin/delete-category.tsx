import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    white: '#FFFFFF',
};

export default function DeleteCategoryScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [])
    );

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const storedCats = await AsyncStorage.getItem('categories');
            if (storedCats) {
                setCategories(JSON.parse(storedCats));
            }
        } catch (error) {
            console.error('Load Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string, name: string) => {
        deleteCategory(id);
    };

    const deleteCategory = async (id: string) => {
        try {
            const catToDelete = categories.find((c: any) => String(c.id) === String(id));
            if (!catToDelete) return;

            if (catToDelete.name === 'Hamısı') {
                Alert.alert('Məlumat', 'Bu kateqoriya sistem tərəfindən qorunur və silinə bilməz');
                return;
            }

            const newCategories = categories.filter(item => String(item.id) !== String(id));
            await AsyncStorage.setItem('categories', JSON.stringify(newCategories));
            setCategories(newCategories);

            const updateProductsWithCategory = async (storageKey: string) => {
                const storedItems = await AsyncStorage.getItem(storageKey);
                if (storedItems) {
                    const currentItems = JSON.parse(storedItems);
                    const newItems = currentItems.map((item: any) => {
                        if (item.category === catToDelete.name) return { ...item, category: 'Hamısı' };
                        return item;
                    });
                    await AsyncStorage.setItem(storageKey, JSON.stringify(newItems));
                }
            };

            await updateProductsWithCategory('products');
            await updateProductsWithCategory('cart');
            await updateProductsWithCategory('favorites');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Xəta', error.message);
        }
    };

    const renderCategoryItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any || 'list'} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            {item.name !== 'Hamısı' && (
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(item.id, item.name)}
                >
                    <Ionicons name="trash" size={24} color={COLORS.danger} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kateqoriya Sil</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.main}>
                {isLoading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyText}>Kateqoriya tapılmadı</Text>}
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
    iconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    deleteBtn: { padding: 10, backgroundColor: '#FFEBEB', borderRadius: 10 },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 50, fontSize: 14 },
});

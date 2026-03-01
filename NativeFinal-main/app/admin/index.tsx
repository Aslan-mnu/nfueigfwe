import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Modern Color Palette
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

export default function AdminScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'products' | 'categories'>('products');
    const [newCategoryName, setNewCategoryName] = useState('');

    // Load data whenever the screen is focused
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [storedProducts, storedCats] = await Promise.all([
                AsyncStorage.getItem('products'),
                AsyncStorage.getItem('categories')
            ]);

            if (storedProducts) {
                setProducts(JSON.parse(storedProducts));
            } else {
                // Initial Seed if empty
                const initialProducts = [
                    { id: '1', title: 'iPhone 15 Pro Max', price: 2599.99, image: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/products/iphone.jpg', category: 'Elektronika' },
                    { id: '2', title: 'Samsung Galaxy Watch 6', price: 459.99, image: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/products/watch.jpg', category: 'Elektronika' },
                ];
                setProducts(initialProducts);
                await AsyncStorage.setItem('products', JSON.stringify(initialProducts));
            }

            if (storedCats) {
                setCategories(JSON.parse(storedCats));
            } else {
                // Initial Seed if empty
                const initialCats = [
                    { id: 'all', name: 'Hamısı', icon: 'grid-outline' },
                    { id: '1', name: 'Elektronika', icon: 'phone-portrait-outline' },
                ];
                setCategories(initialCats);
                await AsyncStorage.setItem('categories', JSON.stringify(initialCats));
            }
        } catch (error) {
            console.error('Load Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (type: 'product' | 'category', id: string, name: string) => {
        Alert.alert(
            'Silməni Təsdiqlə',
            `"${name}" adlı ${type === 'product' ? 'məhsulu' : 'kateqoriyanı'} silmək istədiyinizə əminsiniz?`,
            [
                { text: 'Ləğv et', style: 'cancel' },
                {
                    text: 'Bəli, Sil',
                    style: 'destructive',
                    onPress: () => type === 'product' ? deleteProduct(id) : deleteCategory(id)
                }
            ]
        );
    };

    const deleteProduct = async (id: string) => {
        try {
            // Debug: Start
            console.log('Silmə başlayır, ID:', id);

            // Fetch current fresh data from storage
            const stored = await AsyncStorage.getItem('products');
            if (!stored) {
                Alert.alert('Xəta', 'Yaddaşda heç bir məhsul tapılmadı (Data null)');
                return;
            }

            const currentProducts = JSON.parse(stored);
            const exists = currentProducts.some((p: any) => String(p.id) === String(id));

            if (!exists) {
                Alert.alert('Problem', `Bu ID (${id}) ilə məhsul bazada tapılmadı. Siyahıda olan ID-lər: ${currentProducts.map((p: any) => p.id).join(', ')}`);
                return;
            }

            const updatedProducts = currentProducts.filter((p: any) => String(p.id) !== String(id));

            // Save to storage
            await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));

            // Update UI
            setProducts(updatedProducts);

            Alert.alert('Uğur', 'Məhsul bazadan və ekrandan uğurla silindi');
        } catch (error: any) {
            console.error('Delete error:', error);
            Alert.alert('Xəta (Catch)', 'Xəta mesajı: ' + error.message);
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const storedCats = await AsyncStorage.getItem('categories');
            const storedProds = await AsyncStorage.getItem('products');

            if (!storedCats) {
                Alert.alert('Xəta', 'Kateqoriyalar yaddaşda tapılmadı');
                return;
            }

            const currentCats = JSON.parse(storedCats);
            const currentProds = storedProds ? JSON.parse(storedProds) : [];

            const catToDelete = currentCats.find((c: any) => String(c.id) === String(id));

            if (!catToDelete) {
                Alert.alert('Problem', 'Bu kateqoriya artıq mövcud deyil');
                return;
            }

            if (catToDelete.name === 'Hamısı') {
                Alert.alert('Məlumat', 'Bu kateqoriya sistem tərəfindən qorunur və silinə bilməz');
                return;
            }

            const newCats = currentCats.filter((c: any) => String(c.id) !== String(id));
            const newProds = currentProds.map((p: any) => {
                if (p.category === catToDelete.name) return { ...p, category: 'Hamısı' };
                return p;
            });

            await Promise.all([
                AsyncStorage.setItem('categories', JSON.stringify(newCats)),
                AsyncStorage.setItem('products', JSON.stringify(newProds))
            ]);

            setCategories(newCats);
            setProducts(newProds);

            Alert.alert('Uğur', 'Kateqoriya silindi və aid olan məhsullar "Hamısı" bölməsinə köçürüldü');
        } catch (error: any) {
            console.error('Cat Delete error:', error);
            Alert.alert('Problem (Catch)', 'Xəta: ' + error.message);
        }
    };

    const addCategory = async () => {
        if (!newCategoryName.trim()) return;
        const newCat = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
            icon: 'list-outline'
        };
        const updated = [...categories, newCat];
        setCategories(updated);
        await AsyncStorage.setItem('categories', JSON.stringify(updated));
        setNewCategoryName('');
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
                onPress={() => confirmDelete('product', item.id, item.title)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="trash" size={20} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

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
                    onPress={() => confirmDelete('category', item.id, item.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>İdarəetmə Paneli</Text>
                <TouchableOpacity onPress={() => router.replace('/login')} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            {/* Toggle Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'products' && styles.tabActive]}
                    onPress={() => setViewMode('products')}
                >
                    <Text style={[styles.tabText, viewMode === 'products' && styles.tabTextActive]}>Məhsullar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'categories' && styles.tabActive]}
                    onPress={() => setViewMode('categories')}
                >
                    <Text style={[styles.tabText, viewMode === 'categories' && styles.tabTextActive]}>Kateqoriyalar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.main}>
                {viewMode === 'products' ? (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Bütün Məhsullar ({products.length})</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => router.push('/admin/add-product')}
                            >
                                <Ionicons name="add" size={20} color={COLORS.white} />
                                <Text style={styles.primaryBtnText}>Yeni</Text>
                            </TouchableOpacity>
                        </View>
                        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                            <FlatList
                                data={products}
                                renderItem={renderProductItem}
                                keyExtractor={item => String(item.id)}
                                contentContainerStyle={styles.list}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={<Text style={styles.emptyText}>Məhsul tapılmadı</Text>}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <View style={styles.addInputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Yeni kateqoriya adı..."
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                            />
                            <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
                                <Ionicons name="send" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                            <FlatList
                                data={categories}
                                renderItem={renderCategoryItem}
                                keyExtractor={item => String(item.id)}
                                contentContainerStyle={styles.list}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.white },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    logoutBtn: { padding: 5 },
    tabContainer: { flexDirection: 'row', margin: 20, backgroundColor: '#E9E9EB', borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: COLORS.white, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    tabTextActive: { color: COLORS.primary },
    main: { flex: 1, paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    primaryBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    primaryBtnText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 5 },
    list: { paddingBottom: 20 },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    cardImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15, backgroundColor: '#F0F0F0' },
    iconContainer: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    cardPrice: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
    deleteBtn: { padding: 10 },
    addInputRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    input: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: COLORS.border },
    addBtn: { backgroundColor: COLORS.success, width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 50, fontSize: 14 },
});

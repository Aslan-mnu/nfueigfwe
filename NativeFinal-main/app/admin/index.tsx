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
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    const [viewMode, setViewMode] = useState<'products' | 'categories'>('products');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [storedProducts, storedCats, storedOrders] = await Promise.all([
                AsyncStorage.getItem('products'),
                AsyncStorage.getItem('categories'),
                AsyncStorage.getItem('orders')
            ]);

            let activeProducts = [];
            if (storedProducts) {
                const parsedProds = JSON.parse(storedProducts);
                activeProducts = parsedProds;
                setProducts(activeProducts);
            }

            let orders = [];
            if (storedOrders) {
                orders = JSON.parse(storedOrders);
            }

            setStats({
                totalProducts: activeProducts.length,
                totalOrders: orders.length,
                totalRevenue: orders.reduce((acc: number, curr: any) => acc + (parseFloat(curr.total) || 0), 0)
            });

            if (storedCats) {
                const parsedCats = JSON.parse(storedCats);
                setCategories(parsedCats);
            } else {
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
        if (type === 'product') {
            deleteProduct(id);
        } else {
            deleteCategory(id);
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const storedProducts = await AsyncStorage.getItem('products');
            if (storedProducts) {
                const currentProducts = JSON.parse(storedProducts);
                const updatedProducts = currentProducts.filter((p: any) => String(p.id) !== String(id));
                await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
                setProducts(updatedProducts);
            }

            const cleanStorage = async (key: string) => {
                const stored = await AsyncStorage.getItem(key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const filtered = parsed.filter((item: any) => String(item.id) !== String(id));
                    await AsyncStorage.setItem(key, JSON.stringify(filtered));
                }
            };

            await cleanStorage('favorites');

            loadData();
        } catch (error: any) {
            console.error('Delete error:', error);
            Alert.alert('Xəta', error.message);
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const catToDelete = categories.find((c: any) => String(c.id) === String(id));
            if (!catToDelete) return;

            if (catToDelete.name === 'Hamısı') {
                Alert.alert('Məlumat', 'Bu kateqoriya qorunur');
                return;
            }

            const storedCats = await AsyncStorage.getItem('categories');
            if (storedCats) {
                const currentCats = JSON.parse(storedCats);
                const updatedCats = currentCats.filter((c: any) => String(c.id) !== String(id));
                await AsyncStorage.setItem('categories', JSON.stringify(updatedCats));
                setCategories(updatedCats);
            }

            const storedProds = await AsyncStorage.getItem('products');
            if (storedProds) {
                const currentProds = JSON.parse(storedProds);
                const updatedProds = currentProds.map((p: any) =>
                    p.category === catToDelete.name ? { ...p, category: 'Hamısı' } : p
                );
                await AsyncStorage.setItem('products', JSON.stringify(updatedProds));
            }

            loadData();
        } catch (error: any) {
            console.error('Cat Delete error:', error);
            Alert.alert('Problem', error.message);
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
            <Image
                source={item.image.startsWith('http') ? { uri: item.image } : { uri: item.image }}
                style={styles.cardImage}
            />
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardPrice}>{item.price} ₼</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push({ pathname: '/admin/edit-product', params: { id: item.id } })}
                >
                    <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete('product', item.id, item.title)}
                >
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
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
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>İdarəetmə Paneli</Text>
                <TouchableOpacity onPress={() => router.replace('/login')} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard}>
                    <Text style={styles.statVal}>{stats.totalProducts}</Text>
                    <Text style={styles.statLabel}>Məhsul</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => router.push('/admin/orders' as any)}>
                    <Text style={styles.statVal}>{stats.totalOrders}</Text>
                    <Text style={styles.statLabel}>Sifariş</Text>
                    <Ionicons name="chevron-forward" size={12} color={COLORS.textSecondary} style={{ marginTop: 4 }} />
                </TouchableOpacity>
                <View style={styles.statCard}>
                    <Text style={styles.statVal}>{stats.totalRevenue.toFixed(0)} ₼</Text>
                    <Text style={styles.statLabel}>Gəlir</Text>
                </View>
            </View>

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
                        <View style={styles.searchBox}>
                            <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Məhsul axtar..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Bütün Məhsullar ({products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).length})</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={styles.secondaryBtn}
                                    onPress={() => router.push('/admin/orders' as any)}
                                >
                                    <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.secondaryBtnText}>Sifarişlər</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.primaryBtn}
                                    onPress={() => router.push('/admin/add-product')}
                                >
                                    <Ionicons name="add" size={20} color={COLORS.white} />
                                    <Text style={styles.primaryBtnText}>Yeni</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                            <FlatList
                                data={products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))}
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
    primaryBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    primaryBtnText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
    secondaryBtn: { backgroundColor: '#F0F7FF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#D1E7FF' },
    secondaryBtnText: { color: COLORS.primary, fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
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
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, height: 44 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.text },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: COLORS.white, padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    statVal: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    editBtn: { padding: 8, marginRight: 4 },
});

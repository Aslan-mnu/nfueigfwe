import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const PRODUCT_WIDTH = width / 2 - 24;

interface Product {
    id: string;
    title: string;
    price: number;
    oldPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    discount?: number;
}

const CATEGORIES = [
    { id: 'all', name: 'Hamısı', icon: 'grid-outline' },
    { id: 'electronics', name: 'Elektronika', icon: 'phone-portrait-outline' },
    { id: 'fashion', name: 'Moda', icon: 'shirt-outline' },
    { id: 'home', name: 'Ev', icon: 'home-outline' },
    { id: 'beauty', name: 'Gözəllik', icon: 'rose-outline' },
    { id: 'sports', name: 'İdman', icon: 'basketball-outline' },
];

const SORT_OPTIONS = [
    { id: 'relevance', name: 'Uyğunluq', icon: 'stats-chart-outline' },
    { id: 'price_asc', name: 'Ucuzdan bahaya', icon: 'trending-up-outline' },
    { id: 'price_desc', name: 'Bahadan ucuza', icon: 'trending-down-outline' },
    { id: 'rating', name: 'Reytinqə görə', icon: 'star-outline' },
];

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [priceRange, setPriceRange] = useState(3000);
    const [selectedRating, setSelectedRating] = useState('all');
    const [selectedSort, setSelectedSort] = useState('relevance');

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
            const stored = await AsyncStorage.getItem('products');
            let allProducts = stored ? JSON.parse(stored) : [];

            if (allProducts.length === 0) {
                allProducts = [
                    { id: '1', title: 'iPhone 15 Pro Max', price: 2599.99, rating: 4.8, reviews: 2840, image: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/products/iphone.jpg', discount: 10, category: 'Elektronika' },
                    { id: '2', title: 'Samsung Galaxy Watch 6', price: 459.99, rating: 3.0, reviews: 1523, image: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/products/watch.jpg', discount: 15, category: 'Elektronika' },
                    { id: '3', title: 'Sony WH-1000XM5', price: 649.99, rating: 4.9, reviews: 3200, image: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/products/headphone.jpg', category: 'Elektronika' },
                    { id: '4', title: 'MacBook Air M2', price: 1899.00, rating: 4.7, reviews: 890, image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665', category: 'Elektronika' }
                ];
                await AsyncStorage.setItem('products', JSON.stringify(allProducts));
            }
            setProducts(allProducts.filter((p: any) => p.visible !== false));

            const storedCart = await AsyncStorage.getItem('cart');
            setCart(storedCart ? JSON.parse(storedCart) : []);

            const storedFavs = await AsyncStorage.getItem('favorites');
            setFavorites(storedFavs ? JSON.parse(storedFavs) : []);

            const storedHistory = await AsyncStorage.getItem('searchHistory');
            setSearchHistory(storedHistory ? JSON.parse(storedHistory) : []);

            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');
        } catch (error) { console.error(error); }
    };

    const toggleFavorite = async (product: any) => {
        try {
            const storedFavs = await AsyncStorage.getItem('favorites') || '[]';
            let currentFavs = JSON.parse(storedFavs);
            const idx = currentFavs.findIndex((i: any) => i.id === product.id);
            if (idx > -1) {
                currentFavs = currentFavs.filter((i: any) => i.id !== product.id);
            } else {
                currentFavs.push(product);
            }
            await AsyncStorage.setItem('favorites', JSON.stringify(currentFavs));
            setFavorites(currentFavs);
        } catch (error) { console.error(error); }
    };

    const addToCart = async (product: any) => {
        try {
            const storedCart = await AsyncStorage.getItem('cart') || '[]';
            let currentCart = JSON.parse(storedCart);
            const idx = currentCart.findIndex((i: any) => i.id === product.id);
            if (idx > -1) currentCart[idx].quantity += 1;
            else currentCart.push({ ...product, quantity: 1 });
            await AsyncStorage.setItem('cart', JSON.stringify(currentCart));
            setCart(currentCart);
            Alert.alert('Səbət', 'Məhsul əlavə olundu!');
        } catch (error) { console.error(error); }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) return;

        let history = [...searchHistory];
        if (!history.includes(query)) {
            history.unshift(query);
            if (history.length > 5) history.pop();
            setSearchHistory(history);
            await AsyncStorage.setItem('searchHistory', JSON.stringify(history));
        }
    };

    const clearHistory = async () => {
        setSearchHistory([]);
        await AsyncStorage.removeItem('searchHistory');
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase());

        const catObj = CATEGORIES.find(c => c.id === selectedCategory);
        const matchesCategory = selectedCategory === 'all' || product.category === catObj?.name;

        const matchesPrice = product.price <= priceRange;

        const matchesRating = selectedRating === 'all' || product.rating >= parseFloat(selectedRating);

        return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    }).sort((a, b) => {
        if (selectedSort === 'price_asc') return a.price - b.price;
        if (selectedSort === 'price_desc') return b.price - a.price;
        if (selectedSort === 'rating') return b.rating - a.rating;
        return 0;
    });

    const resetFilters = () => {
        setSelectedCategory('all');
        setPriceRange(3000);
        setSelectedRating('all');
        setSelectedSort('relevance');
    };

    const renderProductItem = ({ item }: { item: Product }) => {
        const isFav = favorites.some(f => f.id === item.id);
        return (
            <TouchableOpacity style={[styles.productCard, isDarkMode && styles.productCardDark]}>
                <View style={[styles.imageContainer, isDarkMode && styles.imageContainerDark]}>
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
                    {item.discount ? <View style={styles.discountBadge}><Text style={styles.discountText}>-{item.discount}%</Text></View> : null}
                    <TouchableOpacity style={[styles.favoriteButton, isDarkMode && styles.favoriteButtonDark]} onPress={() => toggleFavorite(item)}>
                        <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#FF3B30" : "#666"} />
                    </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                    <Text style={[styles.productTitle, isDarkMode && styles.textDark]} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={[styles.ratingText, isDarkMode && styles.textDarkSecondary]}>{item.rating} ({item.reviews})</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{item.price} ₼</Text>
                        {item.oldPrice ? <Text style={styles.oldPrice}>{item.oldPrice} ₼</Text> : null}
                    </View>
                    <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
                        <Ionicons name="cart-outline" size={16} color="#FFF" />
                        <Text style={styles.addToCartText}>Səbətə at</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFF' : '#333'} /></TouchableOpacity>
                <View style={[styles.searchBar, isDarkMode && styles.searchBarDark]}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                        style={[styles.input, isDarkMode && styles.textDark]}
                        placeholder="Məhsul, marka və ya kateqoriya..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (text.length > 3) handleSearch(text);
                        }}
                        onSubmitEditing={() => handleSearch(searchQuery)}
                        clearButtonMode="while-editing"
                    />
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.cartBtn}>
                    <Ionicons name="cart-outline" size={24} color={isDarkMode ? '#FFF' : '#333'} />
                    {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeTxt}>{cart.length}</Text></View>}
                </TouchableOpacity>
            </View>

            <View style={styles.filterBar}>
                <TouchableOpacity style={[styles.filterButton, isDarkMode && styles.filterButtonDark]} onPress={() => setIsFilterVisible(true)}>
                    <Ionicons name="options-outline" size={18} color={isDarkMode ? '#007AFF' : "#333"} />
                    <Text style={[styles.filterButtonText, isDarkMode && styles.textDark]}>Filtrlər</Text>
                </TouchableOpacity>
                <Text style={[styles.resultCount, isDarkMode && styles.textDarkSecondary]}>{filteredProducts.length} məhsul tapıldı</Text>
            </View>

            {searchQuery === '' && searchHistory.length > 0 && (
                <View style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.historyTitle, isDarkMode && styles.textDark]}>Son axtarışlar</Text>
                        <TouchableOpacity onPress={clearHistory}>
                            <Text style={styles.clearHistoryTxt}>Təmizlə</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.historyList}>
                        {searchHistory.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.historyItem, isDarkMode && styles.historyItemDark]}
                                onPress={() => handleSearch(item)}
                            >
                                <Ionicons name="time-outline" size={16} color="#999" />
                                <Text style={[styles.historyItemTxt, isDarkMode && styles.textDark]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {filteredProducts.length === 0 ? (
                <View style={styles.noResults}>
                    <Ionicons name="search-outline" size={60} color={isDarkMode ? '#333' : '#E8E8E8'} />
                    <Text style={[styles.noResultsTitle, isDarkMode && styles.textDark]}>Məhsul tapılmadı</Text>
                    <Text style={[styles.noResultsSub, isDarkMode && styles.textDarkSecondary]}>Axtarış sözünü dəyişməyi və ya filtrləri sıfırlamağı yoxlayın</Text>
                    <TouchableOpacity style={styles.resetSearchBtn} onPress={() => { setSearchQuery(''); resetFilters(); }}>
                        <Text style={styles.resetSearchTxt}>Sıfırla</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Modal animationType="slide" transparent visible={isFilterVisible} onRequestClose={() => setIsFilterVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>Filtrlər</Text>
                                <Text style={[styles.modalSub, isDarkMode && styles.textDarkSecondary]}>Axtarışınızı dəqiqləşdirin</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={isDarkMode ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                            <View style={styles.filterSection}>
                                <Text style={[styles.filterSectionTitle, isDarkMode && styles.textDarkSecondary]}>Kateqoriya</Text>
                                <View style={styles.categoryGrid}>
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.catChip,
                                                selectedCategory === cat.id && styles.catChipSelected,
                                                isDarkMode && styles.catChipDark
                                            ]}
                                            onPress={() => setSelectedCategory(cat.id)}
                                        >
                                            {cat.icon && <Ionicons name={cat.icon as any} size={16} color={selectedCategory === cat.id ? '#FFF' : '#666'} />}
                                            <Text style={[
                                                styles.catChipText,
                                                selectedCategory === cat.id && styles.catChipTextSelected,
                                                isDarkMode && selectedCategory !== cat.id && styles.textDark
                                            ]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={[styles.filterSectionTitle, isDarkMode && styles.textDarkSecondary]}>Sıralama</Text>
                                <View style={styles.sortOptions}>
                                    {SORT_OPTIONS.map(opt => (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={[
                                                styles.sortOption,
                                                selectedSort === opt.id && styles.sortOptionSelected,
                                                isDarkMode && styles.sortOptionDark
                                            ]}
                                            onPress={() => setSelectedSort(opt.id)}
                                        >
                                            <Ionicons name={opt.icon as any} size={18} color={selectedSort === opt.id ? '#007AFF' : '#666'} />
                                            <Text style={[
                                                styles.sortOptionText,
                                                selectedSort === opt.id && styles.sortOptionTextSelected,
                                                isDarkMode && selectedSort !== opt.id && styles.textDark
                                            ]}>{opt.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={[styles.filterSectionTitle, isDarkMode && styles.textDarkSecondary]}>Minimum Reytinq</Text>
                                <View style={styles.ratingGrid}>
                                    {['all', '4.5', '4.0', '3.5'].map(rate => (
                                        <TouchableOpacity
                                            key={rate}
                                            style={[
                                                styles.rateChip,
                                                selectedRating === rate && styles.rateChipSelected,
                                                isDarkMode && styles.rateChipDark
                                            ]}
                                            onPress={() => setSelectedRating(rate)}
                                        >
                                            <Text style={[
                                                styles.rateChipText,
                                                selectedRating === rate && styles.rateChipTextSelected,
                                                isDarkMode && selectedRating !== rate && styles.textDark
                                            ]}>
                                                {rate === 'all' ? 'Hamısı' : `${rate}+`}
                                            </Text>
                                            {rate !== 'all' && <Ionicons name="star" size={12} color={selectedRating === rate ? '#FFF' : '#FFD700'} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <View style={styles.priceHeader}>
                                    <Text style={[styles.filterSectionTitle, isDarkMode && styles.textDarkSecondary]}>Qiymət aralığı</Text>
                                    <Text style={styles.priceValue}>0 ₼ - {Math.round(priceRange)} ₼</Text>
                                </View>
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={0}
                                    maximumValue={3000}
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                    minimumTrackTintColor="#007AFF"
                                    maximumTrackTintColor={isDarkMode ? "#333" : "#E8E8E8"}
                                    thumbTintColor="#007AFF"
                                />
                            </View>
                        </ScrollView>

                        <View style={[styles.modalFooter, isDarkMode && styles.modalContentDark]}>
                            <TouchableOpacity style={[styles.resetBtn, isDarkMode && styles.resetBtnDark]} onPress={resetFilters}>
                                <Text style={[styles.resetBtnTxt, isDarkMode && styles.textDark]}>Sıfırla</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterVisible(false)}>
                                <Text style={styles.applyBtnTxt}>Tətbiq et</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 40 : 0 },
    containerDark: { backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, height: 48, marginHorizontal: 12 },
    searchBarDark: { backgroundColor: '#1E1E1E' },
    input: { flex: 1, fontSize: 15, fontFamily: 'Inter-Medium', color: '#333' },
    cartBtn: { position: 'relative' },
    cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF3B30', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
    cartBadgeTxt: { color: '#FFF', fontSize: 10, fontFamily: 'Inter-Bold' },
    filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
    filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    filterButtonDark: { backgroundColor: '#1E1E1E' },
    filterButtonText: { marginLeft: 8, fontSize: 13, fontFamily: 'Inter-Bold', color: '#333' },
    resultCount: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#666' },
    listContent: { padding: 12 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
    productCard: { width: PRODUCT_WIDTH, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden', elevation: 2 },
    productCardDark: { backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', elevation: 0 },
    imageContainer: { height: 160, backgroundColor: '#F9F9F9', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: 15 },
    imageContainerDark: { backgroundColor: '#1E1E1E' },
    productImage: { width: '100%', height: '100%' },
    discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    discountText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter-ExtraBold' },
    favoriteButton: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFF', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    favoriteButtonDark: { backgroundColor: '#2A2A2A' },
    productInfo: { padding: 12 },
    productTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#333', marginBottom: 8, height: 40, lineHeight: 20 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    ratingText: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#666', marginLeft: 4 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    price: { fontSize: 17, fontFamily: 'Inter-ExtraBold', color: '#007AFF', marginRight: 8 },
    oldPrice: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#999', textDecorationLine: 'line-through' },
    addToCartButton: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
    addToCartText: { color: '#FFF', fontSize: 13, fontFamily: 'Inter-Bold', marginLeft: 6 },
    noResults: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
    noResultsTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333', marginTop: 20, marginBottom: 10 },
    noResultsSub: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#999', textAlign: 'center', lineHeight: 22 },
    resetSearchBtn: { marginTop: 25, backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
    resetSearchTxt: { color: '#FFF', fontSize: 15, fontFamily: 'Inter-Bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', paddingTop: 20 },
    modalContentDark: { backgroundColor: '#1A1A1A' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 25 },
    modalTitle: { fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111' },
    modalSub: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#666', marginTop: 4 },
    closeBtn: { padding: 4 },
    filterSection: { marginBottom: 30, paddingHorizontal: 24 },
    filterSectionTitle: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#333', marginBottom: 15 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F5', gap: 8 },
    catChipDark: { backgroundColor: '#2A2A2A' },
    catChipSelected: { backgroundColor: '#007AFF' },
    catChipText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#666' },
    catChipTextSelected: { color: '#FFF', fontFamily: 'Inter-Bold' },
    sortOptions: { gap: 10 },
    sortOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#F9F9F9', gap: 12 },
    sortOptionDark: { backgroundColor: '#2A2A2A' },
    sortOptionSelected: { backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: '#007AFF' },
    sortOptionText: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#333' },
    sortOptionTextSelected: { color: '#007AFF', fontFamily: 'Inter-Bold' },
    ratingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    rateChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F5', gap: 6 },
    rateChipDark: { backgroundColor: '#2A2A2A' },
    rateChipSelected: { backgroundColor: '#007AFF' },
    rateChipText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#666' },
    rateChipTextSelected: { color: '#FFF', fontFamily: 'Inter-Bold' },
    priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceValue: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#007AFF' },
    modalFooter: { flexDirection: 'row', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 15, backgroundColor: '#FFF' },
    resetBtn: { flex: 1, height: 56, borderRadius: 15, borderWidth: 1, borderColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center' },
    resetBtnDark: { borderColor: '#333' },
    resetBtnTxt: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#333' },
    applyBtn: { flex: 1, height: 56, borderRadius: 15, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
    applyBtnTxt: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#FFF' },
    textDark: { color: '#FFF' },
    textDarkSecondary: { color: '#AAA' },
    historyContainer: { padding: 20 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    historyTitle: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#111' },
    clearHistoryTxt: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#FF3B30' },
    historyList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 },
    historyItemDark: { backgroundColor: '#1E1E1E' },
    historyItemTxt: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#333' },
});

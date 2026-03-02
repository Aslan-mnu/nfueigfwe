import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
import DeliverySystem from '../../components/DeliveryEstimator';

const { width } = Dimensions.get('window');

const getImageSource = (image: string) => {
    const localImages: { [key: string]: any } = {
        'iphonr.jpg': require('../../assets/images/iphonr.jpg'),
        "watch'.jpg": require("../../assets/images/watch'.jpg"),
        'nsudknik.jpg': require('../../assets/images/nsudknik.jpg'),
    };

    return localImages[image] ? localImages[image] : { uri: image };
};


export default function HomeScreen() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('Hamısı');
    const [cart, setCart] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [productReviews, setProductReviews] = useState<any[]>([]);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    const BANNERS: { id: string, title: string, subtitle: string, colors: readonly [string, string, ...string[]], colorsDark: readonly [string, string, ...string[]] }[] = [
        {
            id: '1',
            title: 'Yeni İl Endirimləri!',
            subtitle: '50%-ə qədər',
            colors: ['#A855F7', '#EC4899'],
            colorsDark: ['#4C1D95', '#831843']
        },
        {
            id: '2',
            title: 'Bahar Kolleksiyası',
            subtitle: 'Yeni məhsullar',
            colors: ['#34C759', '#30D158'],
            colorsDark: ['#1E8236', '#229A41']
        },
        {
            id: '3',
            title: 'Günün Təklifi',
            subtitle: 'Pulsuz Çatdırılma',
            colors: ['#007AFF', '#5856D6'],
            colorsDark: ['#0A4B8F', '#353482']
        }
    ];

    const flatListRef = React.useRef<FlatList>(null);

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
            const storedProducts = await AsyncStorage.getItem('products');
            const seedProducts = [
                { id: '1', title: 'iPhone 15 Pro Max', price: 2599.99, rating: 4.8, reviews: 2840, image: 'iphonr.jpg', discount: 10, category: 'Elektronika' },
                { id: '2', title: 'Samsung Galaxy Watch 6', price: 459.99, rating: 3.0, reviews: 1523, image: "watch'.jpg", discount: 15, category: 'Elektronika' },
                { id: '3', title: 'Sony WH-1000XM5', price: 649.99, rating: 4.9, reviews: 3200, image: 'nsudknik.jpg', category: 'Elektronika' }
            ];

            if (storedProducts === null) {
                await AsyncStorage.setItem('products', JSON.stringify(seedProducts));
                setProducts(seedProducts);
            } else {
                const parsedProds = JSON.parse(storedProducts);
                setProducts(parsedProds);
            }

            const storedCats = await AsyncStorage.getItem('categories');
            let parsedCats = [];

            if (storedCats === null) {
                parsedCats = [
                    { id: 'all', name: 'Hamısı', icon: 'grid-outline' },
                    { id: '1', name: 'Elektronika', icon: 'phone-portrait-outline' },
                    { id: '2', name: 'Moda', icon: 'shirt-outline' },
                    { id: '3', name: 'Ev', icon: 'home-outline' },
                    { id: '4', name: 'İdman', icon: 'basketball-outline' },
                ];
                await AsyncStorage.setItem('categories', JSON.stringify(parsedCats));
            } else {
                const fullCats = JSON.parse(storedCats);
                parsedCats = fullCats;
                if (!parsedCats.some((c: any) => c.name === 'Hamısı')) {
                    parsedCats.unshift({ id: 'all', name: 'Hamısı', icon: 'grid-outline' });
                }
            }
            setCategories(parsedCats);

            const storedCart = await AsyncStorage.getItem('cart') || '[]';
            setCart(JSON.parse(storedCart));

            const storedFavs = await AsyncStorage.getItem('favorites') || '[]';
            setFavorites(JSON.parse(storedFavs));

            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');

            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const parsed = JSON.parse(userJson);
                setCurrentUserEmail(parsed.email);
            }
        } catch (error) {
            console.error(error);
        }
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

    const loadProductReviews = async (productId: string) => {
        try {
            const storedAllReviews = await AsyncStorage.getItem('all_reviews') || '{}';
            const allReviews = JSON.parse(storedAllReviews);
            setProductReviews(allReviews[productId] || []);
        } catch (error) { console.error(error); }
    };

    const submitReview = async () => {
        if (!selectedProduct || !newComment.trim()) {
            Alert.alert('Xəta', 'Zəhmət olmasa rəyinizi daxil edin');
            return;
        }

        try {
            const storedUser = await AsyncStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : { name: 'Anonim' };

            const review = {
                id: editingReviewId || Date.now().toString(),
                userEmail: user.email,
                userName: `${user.name} ${user.surname || ''}`.trim(),
                rating: newRating,
                comment: newComment,
                date: new Date().toLocaleDateString('az-AZ')
            };

            const storedAllReviews = await AsyncStorage.getItem('all_reviews') || '{}';
            const allReviews = JSON.parse(storedAllReviews);

            if (!allReviews[selectedProduct.id]) {
                allReviews[selectedProduct.id] = [];
            }

            if (editingReviewId) {
                const rIdx = allReviews[selectedProduct.id].findIndex((r: any) => r.id === editingReviewId);
                if (rIdx > -1) allReviews[selectedProduct.id][rIdx] = review;
            } else {
                allReviews[selectedProduct.id].unshift(review);
            }

            await AsyncStorage.setItem('all_reviews', JSON.stringify(allReviews));

            const prodReviews = allReviews[selectedProduct.id];
            const sumOfRatings = prodReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
            const avgRating = sumOfRatings / prodReviews.length;

            const storedProducts = await AsyncStorage.getItem('products');
            if (storedProducts) {
                const currentProducts = JSON.parse(storedProducts);
                const pIdx = currentProducts.findIndex((p: any) => String(p.id) === String(selectedProduct.id));
                if (pIdx > -1) {
                    currentProducts[pIdx].rating = parseFloat(avgRating.toFixed(1));
                    currentProducts[pIdx].reviews = prodReviews.length;
                    await AsyncStorage.setItem('products', JSON.stringify(currentProducts));
                    setProducts(currentProducts);
                    setSelectedProduct(currentProducts[pIdx]);
                }
            }

            setProductReviews(prodReviews);
            setNewComment('');
            setNewRating(5);
            setEditingReviewId(null);
            Alert.alert('Uğurlu', editingReviewId ? 'Rəyiniz yeniləndi!' : 'Rəyiniz əlavə edildi!');
        } catch (error) { console.error(error); }
    };

    const deleteReview = async (reviewId: string) => {
        if (!selectedProduct) return;

        Alert.alert(
            'Rəyi sil',
            'Bu rəyi silmək istədiyinizə əminsiniz?',
            [
                { text: 'Xeyr', style: 'cancel' },
                {
                    text: 'Bəli',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const storedAllReviews = await AsyncStorage.getItem('all_reviews') || '{}';
                            const allReviews = JSON.parse(storedAllReviews);

                            if (allReviews[selectedProduct.id]) {
                                allReviews[selectedProduct.id] = allReviews[selectedProduct.id].filter((r: any) => r.id !== reviewId);
                                await AsyncStorage.setItem('all_reviews', JSON.stringify(allReviews));

                                const prodReviews = allReviews[selectedProduct.id];
                                let avgRating = 0;
                                let reviewsCount = 0;

                                if (prodReviews.length > 0) {
                                    const sumOfRatings = prodReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
                                    avgRating = sumOfRatings / prodReviews.length;
                                    reviewsCount = prodReviews.length;
                                }

                                const storedProducts = await AsyncStorage.getItem('products');
                                if (storedProducts) {
                                    const currentProducts = JSON.parse(storedProducts);
                                    const pIdx = currentProducts.findIndex((p: any) => String(p.id) === String(selectedProduct.id));
                                    if (pIdx > -1) {
                                        currentProducts[pIdx].rating = parseFloat(avgRating.toFixed(1));
                                        currentProducts[pIdx].reviews = reviewsCount;
                                        await AsyncStorage.setItem('products', JSON.stringify(currentProducts));
                                        setProducts(currentProducts);
                                        setSelectedProduct(currentProducts[pIdx]);
                                    }
                                }

                                setProductReviews(prodReviews);
                                Alert.alert('Uğurlu', 'Rəy silindi!');
                            }
                        } catch (error) { console.error(error); }
                    }
                }
            ]
        );
    };

    const startEditReview = (review: any) => {
        setEditingReviewId(review.id);
        setNewComment(review.comment);
        setNewRating(review.rating);
    };

    const renderCategoryItem = ({ item }: { item: any }) => {
        const isActive = activeCategory === item.name;
        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.categoryItem, isActive && styles.activeCategoryItem, isDarkMode && styles.categoryItemDark]}
                onPress={() => setActiveCategory(item.name)}
            >
                {item.icon && <Ionicons name={item.icon as any} size={16} color={isActive ? '#FFF' : (isDarkMode ? '#AAA' : '#333')} style={{ marginRight: 6 }} />}
                <Text style={[styles.categoryText, isActive && styles.activeCategoryText, isDarkMode && !isActive && styles.textDark]}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    const renderProductItem = ({ item }: { item: any }) => {
        const isFav = favorites.some(f => f.id === item.id);
        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.productCard, isDarkMode && styles.productCardDark]}
                onPress={() => {
                    setSelectedProduct(item);
                    loadProductReviews(item.id);
                }}
            >
                <View style={[styles.imageContainer, isDarkMode && styles.imageContainerDark]}>
                    <Image source={getImageSource(item.image)} style={styles.productImage} resizeMode="contain" />
                    {item.discount > 0 && <View style={styles.discountBadge}><Text style={styles.discountText}>-{item.discount}%</Text></View>}
                    <TouchableOpacity style={[styles.favoriteButton, isDarkMode && styles.favoriteButtonDark]} onPress={() => toggleFavorite(item)}>
                        <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#FF3B30" : "#666"} />
                    </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                    <Text style={[styles.productTitle, isDarkMode && styles.textDark]} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={[styles.ratingText, isDarkMode && styles.textDarkSecondary]}>{item.rating} ({item.reviews || 0})</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{item.price} ₼</Text>
                        {item.oldPrice && <Text style={styles.oldPrice}>{item.oldPrice} ₼</Text>}
                    </View>
                    <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
                        <Ionicons name="cart-outline" size={18} color="#FFF" />
                        <Text style={styles.addToCartText}>Səbətə at</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={styles.header}>
                <Text style={[styles.logoText, isDarkMode && styles.textDark]}>MiniShop</Text>
                <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/(tabs)/cart')}>
                    <Ionicons name="cart-outline" size={24} color={isDarkMode ? '#FFF' : '#333'} />
                    {cart.length > 0 && <View style={styles.notificationBadge}><Text style={styles.badgeText}>{cart.length}</Text></View>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
                    <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Məhsul axtar..."
                        placeholderTextColor="#999"
                        style={[styles.searchInput, isDarkMode && styles.textDark]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#999" style={{ marginRight: 8 }} />
                        </TouchableOpacity>
                    )}
                    <Ionicons name="mic-outline" size={20} color="#999" />
                </View>

                <View style={{ marginBottom: 24 }}>
                    <FlatList
                        ref={flatListRef}
                        data={BANNERS}
                        keyExtractor={item => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const slideSize = e.nativeEvent.layoutMeasurement.width;
                            const index = Math.round(e.nativeEvent.contentOffset.x / slideSize);
                            if (index !== activeBannerIndex && index < BANNERS.length) {
                                setActiveBannerIndex(index);
                            }
                        }}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <View style={{ width: width }}>
                                <LinearGradient
                                    colors={isDarkMode ? item.colorsDark : item.colors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.bannerContainer}
                                >
                                    <View style={styles.bannerContent}>
                                        <Text style={styles.bannerTitle}>{item.title}</Text>
                                        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        )}
                    />
                    <View style={styles.paginationDots}>
                        {BANNERS.map((_, i) => (
                            <View key={i} style={[styles.dot, activeBannerIndex === i && styles.activeDot]} />
                        ))}
                    </View>
                </View>

                <View style={styles.categoriesContainer}>
                    <FlatList data={categories} renderItem={renderCategoryItem} keyExtractor={item => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Populyar Məhsullar</Text>
                    <Text style={styles.sectionSubtitle}>
                        {products.filter(p => (activeCategory === 'Hamısı' || p.category === activeCategory) &&
                            (p.title.toLowerCase().includes(searchQuery.toLowerCase()))).length} məhsul
                    </Text>
                </View>

                <View style={styles.productsGrid}>
                    {products
                        .filter(p => (activeCategory === 'Hamısı' || p.category === activeCategory) &&
                            (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                p.category.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((product) => (
                            <View key={product.id} style={styles.gridItemWrapper}>{renderProductItem({ item: product })}</View>
                        ))}
                </View>
            </ScrollView>

            <Modal
                visible={!!selectedProduct}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedProduct(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>Məhsul Təfərrüatı</Text>
                            <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                                <Ionicons name="close" size={24} color={isDarkMode ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedProduct && (
                                <View style={{ padding: 20 }}>
                                    <View style={[styles.modalImageContainer, isDarkMode && styles.imageContainerDark]}>
                                        <Image source={getImageSource(selectedProduct.image)} style={styles.modalProductImage} resizeMode="contain" />
                                    </View>

                                    <DeliverySystem
                                        productName={selectedProduct.title}
                                        productPrice={selectedProduct.price}
                                        isDarkMode={isDarkMode}
                                    />

                                    <View style={[styles.reviewsSection, isDarkMode && styles.reviewsSectionDark]}>
                                        <Text style={[styles.reviewsTitle, isDarkMode && styles.textDark]}>Rəylər ({productReviews.length})</Text>

                                        <View style={[styles.addReviewForm, isDarkMode && styles.addReviewFormDark]}>
                                            <Text style={[styles.formLabel, isDarkMode && styles.textDark]}>Rəy bildir</Text>
                                            <View style={styles.starSelector}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                                                        <Ionicons
                                                            name={star <= newRating ? "star" : "star-outline"}
                                                            size={24}
                                                            color="#FFD700"
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                            <TextInput
                                                style={[styles.reviewInput, isDarkMode && styles.reviewInputDark, isDarkMode && styles.textDark]}
                                                placeholder="Fikirlərinizi bölüşün..."
                                                placeholderTextColor="#999"
                                                multiline
                                                value={newComment}
                                                onChangeText={setNewComment}
                                            />
                                            <TouchableOpacity style={[styles.submitReviewBtn, editingReviewId && styles.updateReviewBtn]} onPress={submitReview}>
                                                <Text style={styles.submitReviewBtnText}>{editingReviewId ? 'Yenilə' : 'Göndər'}</Text>
                                            </TouchableOpacity>
                                            {editingReviewId && (
                                                <TouchableOpacity
                                                    style={styles.cancelEditBtn}
                                                    onPress={() => {
                                                        setEditingReviewId(null);
                                                        setNewComment('');
                                                        setNewRating(5);
                                                    }}
                                                >
                                                    <Text style={styles.cancelEditBtnText}>Ləğv et</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {productReviews.length > 0 ? (
                                            productReviews.map((review) => (
                                                <View key={review.id} style={[styles.reviewItem, isDarkMode && styles.reviewItemDark]}>
                                                    <View style={styles.reviewHeader}>
                                                        <Text style={[styles.reviewerName, isDarkMode && styles.textDark]}>{review.userName}</Text>
                                                        <View style={styles.reviewActions}>
                                                            <View style={styles.modalRating}>
                                                                <Ionicons name="star" size={12} color="#FFD700" />
                                                                <Text style={[styles.modalRatingText, isDarkMode && styles.textDarkSecondary]}>{review.rating}.0</Text>
                                                            </View>
                                                            {currentUserEmail === review.userEmail && (
                                                                <View style={styles.userReviewBtns}>
                                                                    <TouchableOpacity onPress={() => startEditReview(review)}>
                                                                        <Ionicons name="create-outline" size={18} color="#007AFF" />
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity onPress={() => deleteReview(review.id)}>
                                                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.reviewDate, isDarkMode && styles.textDarkSecondary]}>{review.date}</Text>
                                                    <Text style={[styles.reviewComment, isDarkMode && styles.textDarkSecondary]}>{review.comment}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={[styles.noReviewsText, isDarkMode && styles.textDarkSecondary]}>Hələ rəy yoxdur. İlk rəyi sən yaz!</Text>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.largeAddToCartBtn, { marginTop: 20 }]}
                                        onPress={() => {
                                            addToCart(selectedProduct);
                                            setSelectedProduct(null);
                                        }}
                                    >
                                        <Ionicons name="cart-outline" size={24} color="#FFF" />
                                        <Text style={styles.largeAddToCartText}>Səbətə əlavə et</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 40 : 0 },
    containerDark: { backgroundColor: '#121212' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    logoText: { fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#007AFF' },
    notificationButton: { position: 'relative', padding: 4 },
    notificationBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
    badgeText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter-Bold' },
    addToCartButton: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, marginTop: 10 },
    addToCartText: { color: '#FFF', fontSize: 12, fontFamily: 'Inter-Bold', marginLeft: 6 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 20, marginBottom: 24 },
    searchContainerDark: { backgroundColor: '#1E1E1E' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: '#333' },
    bannerContainer: { marginHorizontal: 20, borderRadius: 16, height: 160, justifyContent: 'center', paddingHorizontal: 24 },
    bannerContent: { zIndex: 1 },
    bannerTitle: { color: '#FFF', fontSize: 20, fontFamily: 'Inter-Bold', marginBottom: 8 },
    bannerSubtitle: { color: '#FFF', fontSize: 28, fontFamily: 'Inter-ExtraBold' },
    paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 4 },
    activeDot: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#007AFF' },
    categoriesContainer: { marginBottom: 24 },
    categoryItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E8E8E8', marginRight: 12, backgroundColor: '#FFF' },
    categoryItemDark: { backgroundColor: '#1A1A1A', borderColor: '#333' },
    activeCategoryItem: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    categoryText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#333' },
    activeCategoryText: { color: '#FFF' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#111' },
    sectionSubtitle: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#007AFF' },
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14 },
    gridItemWrapper: { width: '50%', padding: 6 },
    productCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden' },
    productCardDark: { backgroundColor: '#1A1A1A', borderColor: '#333' },
    imageContainer: { height: 150, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: 10 },
    imageContainerDark: { backgroundColor: '#1E1E1E' },
    productImage: { width: '100%', height: '100%' },
    discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
    discountText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter-Bold' },
    favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    favoriteButtonDark: { backgroundColor: '#121212' },
    productInfo: { padding: 12 },
    productTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#333', marginBottom: 6 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    ratingText: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#666', marginLeft: 4 },
    priceContainer: { flexDirection: 'row', alignItems: 'center' },
    price: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#007AFF', marginRight: 8 },
    oldPrice: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#999', textDecorationLine: 'line-through' },
    textDark: { color: '#FFF' },
    textDarkSecondary: { color: '#AAA' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', paddingVertical: 20 },
    modalContentDark: { backgroundColor: '#1A1A1A' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 15 },
    modalTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#111' },
    modalImageContainer: { height: 200, width: '100%', backgroundColor: '#F9F9F9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalProductImage: { width: '80%', height: '80%' },
    largeAddToCartBtn: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 10 },
    largeAddToCartText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter-Bold' },
    reviewsSection: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    reviewsSectionDark: { borderTopColor: '#333' },
    reviewsTitle: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#111', marginBottom: 16 },
    reviewItem: { marginBottom: 16, backgroundColor: '#FAFAFA', padding: 12, borderRadius: 12 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reviewerName: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#333' },
    modalRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    modalRatingText: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#666' },
    reviewComment: { fontSize: 13, fontFamily: 'Inter-Regular', color: '#666', lineHeight: 20 },
    reviewDate: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#999', marginBottom: 6 },
    reviewItemDark: { backgroundColor: '#2C2C2E' },
    noReviewsText: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 10, fontFamily: 'Inter-Regular' },
    addReviewForm: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, marginBottom: 24 },
    addReviewFormDark: { backgroundColor: '#2C2C2E' },
    formLabel: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#333', marginBottom: 12 },
    starSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    reviewInput: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E5EA', fontFamily: 'Inter-Regular' },
    reviewInputDark: { backgroundColor: '#1C1C1E', borderColor: '#3A3A3C' },
    submitReviewBtn: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
    updateReviewBtn: { backgroundColor: '#34C759' },
    submitReviewBtnText: { color: '#FFF', fontSize: 14, fontFamily: 'Inter-Bold' },
    cancelEditBtn: { paddingVertical: 10, alignItems: 'center' },
    cancelEditBtnText: { color: '#FF3B30', fontSize: 13, fontFamily: 'Inter-Medium' },
    reviewActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userReviewBtns: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#EEE' },
});

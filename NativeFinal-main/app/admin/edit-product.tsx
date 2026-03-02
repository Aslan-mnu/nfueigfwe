import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function EditProductScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState('');
    const [discount, setDiscount] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [pickedImage, setPickedImage] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [storedProds, storedCats] = await Promise.all([
                AsyncStorage.getItem('products'),
                AsyncStorage.getItem('categories')
            ]);

            if (storedCats) setCategories(JSON.parse(storedCats));

            if (storedProds) {
                const products = JSON.parse(storedProds);
                const product = products.find((p: any) => String(p.id) === String(id));
                if (product) {
                    setTitle(product.title);
                    setPrice(String(product.price));
                    setCategory(product.category);
                    setImage(product.image);
                    setDiscount(String(product.discount || 0));
                    setStock(String(product.stock || 10));
                    setDescription(product.description || '');
                    if (product.image) setPickedImage(product.image);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setPickedImage(result.assets[0].uri);
            setImage(result.assets[0].uri);
        }
    };

    const handleUpdateProduct = async () => {
        if (!title || !price || !category) {
            Alert.alert('Xəta', 'Vacib xanaları doldurun');
            return;
        }

        try {
            const storedProducts = await AsyncStorage.getItem('products');
            if (storedProducts) {
                let products = JSON.parse(storedProducts);
                const index = products.findIndex((p: any) => String(p.id) === String(id));

                if (index > -1) {
                    products[index] = {
                        ...products[index],
                        title,
                        price: parseFloat(price),
                        category,
                        image,
                        discount: parseFloat(discount),
                        stock: parseInt(stock),
                        description,
                    };

                    await AsyncStorage.setItem('products', JSON.stringify(products));
                    router.back();
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Xəta', 'Yadda saxlayan zaman xəta baş verdi');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Məhsulu Redaktə Et</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Məhsulun Şəkli</Text>
                        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                            {pickedImage ? (
                                <Image source={{ uri: pickedImage }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="camera" size={30} color="#999" />
                                    <Text style={styles.placeholderText}>Şəkil seçin</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ad *</Text>
                        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Qiymət (AZN) *</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Stok *</Text>
                            <TextInput style={styles.input} keyboardType="number-pad" value={stock} onChangeText={setStock} />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kateqoriya *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                            {categories.filter(c => c.name !== 'Hamısı').map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catChip, category === cat.name && styles.catChipActive]}
                                    onPress={() => setCategory(cat.name)}
                                >
                                    <Text style={[styles.catChipText, category === cat.name && styles.catChipTextActive]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Endirim (%)</Text>
                        <TextInput style={styles.input} keyboardType="number-pad" value={discount} onChangeText={setDiscount} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Təsvir</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Məhsul haqqında ətraflı məlumat..."
                        />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleUpdateProduct}>
                        <Text style={styles.submitButtonText}>Yadda Saxla</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, padding: 24 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#333' },
    row: { flexDirection: 'row' },
    imagePickerBtn: { height: 150, backgroundColor: '#F9F9F9', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed', overflow: 'hidden' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { marginTop: 8, color: '#999', fontSize: 14 },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    catScroll: { flexDirection: 'row', marginTop: 5 },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 10, borderWidth: 1, borderColor: '#E0E0E0' },
    catChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    catChipText: { fontSize: 14, color: '#666', fontWeight: '500' },
    catChipTextActive: { color: '#FFF' },
    submitButton: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 40 },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

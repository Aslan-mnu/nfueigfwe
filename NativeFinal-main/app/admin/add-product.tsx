import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    View,
} from 'react-native';

export default function AddProductScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState('');
    const [discount, setDiscount] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [pickedImage, setPickedImage] = useState<string | null>(null);

    React.useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const storedCats = await AsyncStorage.getItem('categories');
            if (storedCats) {
                setCategories(JSON.parse(storedCats));
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

    const handleAddProduct = async () => {
        if (!title || !price || !category) {
            Alert.alert('Xəta', 'Zəhmət olmasa vacib xanaları doldurun');
            return;
        }

        try {
            const newProduct = {
                id: Date.now().toString(),
                title,
                price: parseFloat(price),
                category,
                image: image || 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/products/iphone.jpg',
                discount: discount ? parseFloat(discount) : 0,
                rating: 5.0,
            };

            const storedProducts = await AsyncStorage.getItem('products');
            let products = [];
            if (storedProducts) {
                products = JSON.parse(storedProducts);
            }

            products.unshift(newProduct);
            await AsyncStorage.setItem('products', JSON.stringify(products));
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Xəta', 'Məhsul əlavə edilərkən xəta baş verdi');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Məhsul</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Məhsulun Adı *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Məs: iPhone 15"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Qiymət (AZN) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kateqoriya Seçin *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                            {categories
                                .filter(c => c.name !== 'Hamısı')
                                .map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.catChip,
                                            category === cat.name && styles.catChipActive
                                        ]}
                                        onPress={() => setCategory(cat.name)}
                                    >
                                        <Text style={[
                                            styles.catChipText,
                                            category === cat.name && styles.catChipTextActive
                                        ]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>
                        {categories.length === 0 && <Text style={styles.noCats}>Əvvəlcə kateqoriya əlavə edin</Text>}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Məhsulun Şəkli *</Text>
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
                        <Text style={[styles.label, { marginTop: 15 }]}>Və ya Şəkil URL-i</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://..."
                            value={image}
                            onChangeText={(val) => {
                                setImage(val);
                                if (val.startsWith('http')) setPickedImage(val);
                                else setPickedImage(null);
                            }}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Endirim (%)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="number-pad"
                            value={discount}
                            onChangeText={setDiscount}
                        />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct}>
                        <Text style={styles.submitButtonText}>Əlavə Et</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    catScroll: {
        flexDirection: 'row',
        marginTop: 5,
    },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    catChipActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    catChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    catChipTextActive: {
        color: '#FFF',
    },
    noCats: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 8,
    },
    imagePickerBtn: {
        height: 150,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#999',
        fontSize: 14,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});

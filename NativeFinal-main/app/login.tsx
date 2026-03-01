import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Zəhmət olmasa bütün xanaları doldurun');
            return;
        }

        if (email === 'deliadmin@minishop.com' && password === 'deliAdmin123') {
            router.replace('/admin' as any);
            return;
        }

        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.email === email && user.password === password) {
                    router.replace('/(tabs)');
                } else {
                    alert('Email və ya şifrə yanlışdır');
                }
            } else {
                alert('İstifadəçi tapılmadı');
            }
        } catch (error) {
            alert('Giriş zamanı xəta baş verdi');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Logo and Shop Name */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoContainer}>
                            <View style={styles.iconBackground}>
                                <Ionicons name="bag-handle" size={40} color="#007AFF" />
                                <View style={styles.orangeBadge}>
                                    <Ionicons name="bag-handle" size={15} color="#FF5C00" />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.shopName}>MiniShop</Text>
                        <Text style={styles.welcomeText}>Xoş gəlmisiniz!</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="email@example.com"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifrə</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="********"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#999"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Şifrəni unutmusunuz?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginButtonText}>Daxil ol</Text>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Hesabınız yoxdur? </Text>
                            <TouchableOpacity onPress={() => router.push('/register' as any)}>
                                <Text style={styles.signUpText}>Qeydiyyatdan keç</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 16,
    },
    iconBackground: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    orangeBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#FFF',
        borderRadius: 5,
        padding: 2,
    },
    shopName: {
        fontSize: 28,
        fontFamily: 'Montserrat-Bold',
        color: '#007AFF', // Azure-ish blue from image
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: '#666',
    },
    formSection: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 52,
        backgroundColor: '#FAFAFA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: '#000',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        height: 52,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#007AFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
            web: {
                // @ts-ignore
                boxShadow: '0px 4px 8px rgba(0, 122, 255, 0.2)',
            }
        }),
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Inter-Bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E8E8',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#999',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    googleButton: {
        flexDirection: 'row',
        height: 52,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: 40,
    },
    googleIcon: {
        marginRight: 12,
    },
    googleButtonText: {
        color: '#000',
        fontSize: 15,
        fontFamily: 'Inter-Medium',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    signUpText: {
        color: '#007AFF',
        fontSize: 14,
        fontFamily: 'Inter-Bold',
    },
});

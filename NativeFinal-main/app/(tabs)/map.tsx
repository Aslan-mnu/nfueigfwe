import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapScreen() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const lat = 40.4093;
    const lng = 49.8671;
    const zoom = 14;

    useEffect(() => {
        const loadTheme = async () => {
            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');
        };
        loadTheme();

        const sub = DeviceEventEmitter.addListener('themeChanged', (val) => setIsDarkMode(val));
        return () => sub.remove();
    }, []);

    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Mağazalarımız</Text>
                <TouchableOpacity style={styles.refreshBtn}>
                    <Ionicons name="refresh-outline" size={24} color={isDarkMode ? '#007AFF' : '#333'} />
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>Xəritə yüklənir...</Text>
                    </View>
                )}

                {Platform.OS === 'web' ? (
                    <iframe
                        title="google-maps"
                        src={mapUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        onLoad={() => setIsLoading(false)}
                    />
                ) : (
                    <WebView
                        source={{ uri: mapUrl }}
                        style={{ flex: 1 }}
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />
                )}
            </View>

            <View style={[styles.detailsCard, isDarkMode && styles.detailsCardDark]}>
                <View style={styles.storeRow}>
                    <Ionicons name="location" size={20} color="#007AFF" />
                    <View style={styles.storeInfo}>
                        <Text style={[styles.storeName, isDarkMode && styles.textDark]}>Mərkəzi Filial</Text>
                        <Text style={[styles.storeAddr, isDarkMode && styles.textDarkSecondary]}>Bakı ş., Nizami küç. 102</Text>
                    </View>
                </View>
                <View style={styles.storeRow}>
                    <Ionicons name="time-outline" size={20} color="#34C759" />
                    <View style={styles.storeInfo}>
                        <Text style={[styles.storeName, isDarkMode && styles.textDark]}>İş Saatları</Text>
                        <Text style={[styles.storeAddr, isDarkMode && styles.textDarkSecondary]}>Hər gün: 10:00 - 21:00</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    containerDark: { backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerDark: { backgroundColor: '#1A1A1A', borderBottomColor: '#333' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    refreshBtn: { padding: 5 },
    mapContainer: { flex: 1, overflow: 'hidden' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
    detailsCard: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10 },
    detailsCardDark: { backgroundColor: '#1A1A1A', borderTopWidth: 1, borderTopColor: '#333' },
    storeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    storeInfo: { marginLeft: 12 },
    storeName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    storeAddr: { fontSize: 13, color: '#666', marginTop: 2 },
    textDark: { color: '#FFF' },
    textDarkSecondary: { color: '#AAA' },
});

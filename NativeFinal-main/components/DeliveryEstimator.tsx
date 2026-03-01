import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    DeviceEventEmitter,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- Yardımçı Funksiyalar ---
const formatDate = (date: Date): string => {
    const months = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
        'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getDeliveryRange = (today: Date, type: 'Standard' | 'Express' | 'Manual', manualDate?: Date): string => {
    if (type === 'Manual' && manualDate) {
        return formatDate(manualDate);
    }

    let startOffset, endOffset;
    if (type === 'Standard') {
        startOffset = 5;
        endOffset = 7;
    } else if (type === 'Express') {
        startOffset = 1;
        endOffset = 2;
    } else {
        return 'Tarix seçilməyib';
    }

    const startDate = new Date(today);
    startDate.setDate(today.getDate() + startOffset);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + endOffset);

    return `${formatDate(startDate)} - ${formatDate(endDate)} arası`;
};

// --- Əsas Komponent ---
interface DeliverySystemProps {
    productName: string;
    productPrice: number;
    isDarkMode?: boolean;
    onTypeChange?: (type: 'Standard' | 'Express' | 'Manual') => void;
    currentType?: 'Standard' | 'Express' | 'Manual';
    manualDate?: Date;
    onDateChange?: (date: Date | undefined) => void;
    onEstimateChange?: (estimate: string) => void;
}

const DeliverySystem: React.FC<DeliverySystemProps> = ({
    productName,
    productPrice,
    isDarkMode: propDarkMode,
    onTypeChange,
    currentType = 'Standard',
    manualDate,
    onDateChange,
    onEstimateChange
}) => {
    const [deliveryEstimate, setDeliveryEstimate] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(propDarkMode || false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const getMinDate = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 5);
        return d;
    };

    useEffect(() => {
        const loadTheme = async () => {
            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');
        };
        if (propDarkMode === undefined) loadTheme();

        const sub = DeviceEventEmitter.addListener('themeChanged', (val) => setIsDarkMode(val));
        return () => sub.remove();
    }, [propDarkMode]);

    useEffect(() => {
        const range = getDeliveryRange(new Date(), currentType, manualDate);
        setDeliveryEstimate(range);
        onEstimateChange?.(range);
    }, [currentType, manualDate]);

    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            const minDate = getMinDate();
            if (date < minDate) {
                Alert.alert('Xəta', 'Keçmiş və ya yaxın tarixləri seçmək mümkün deyil. Minimum 5 gün sonranı seçin.');
                return;
            }
            if (date.getDay() === 0) {
                Alert.alert('Xəta', 'Bazar günü çatdırılma mümkün deyil.');
                return;
            }
            onDateChange?.(date);
        }
    };

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={[styles.productCard, isDarkMode && styles.productCardDark]}>
                <View style={styles.productHeader}>
                    <Text style={[styles.productName, isDarkMode && styles.textWhite]}>{productName}</Text>
                    <Text style={styles.productPrice}>{productPrice.toFixed(2)} ₼</Text>
                </View>

                <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

                <Text style={[styles.sectionTitle, isDarkMode && styles.textLightGray]}>Çatdırılma növü:</Text>
                <View style={[styles.shippingToggle, isDarkMode && styles.toggleDark]}>
                    <TouchableOpacity
                        style={[styles.typeBtn, currentType === 'Standard' && styles.activeBtn]}
                        onPress={() => onTypeChange?.('Standard')}
                    >
                        <Ionicons
                            name="bus-outline"
                            size={16}
                            color={currentType === 'Standard' ? '#FFF' : (isDarkMode ? '#999' : '#666')}
                        />
                        <Text style={[styles.typeText, currentType === 'Standard' && styles.activeHeaderText, isDarkMode && currentType !== 'Standard' && styles.textWhite]}>Std</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeBtn, currentType === 'Express' && styles.activeBtn]}
                        onPress={() => onTypeChange?.('Express')}
                    >
                        <Ionicons
                            name="flash-outline"
                            size={16}
                            color={currentType === 'Express' ? '#FFF' : (isDarkMode ? '#999' : '#666')}
                        />
                        <Text style={[styles.typeText, currentType === 'Express' && styles.activeHeaderText, isDarkMode && currentType !== 'Express' && styles.textWhite]}>Exp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeBtn, currentType === 'Manual' && styles.activeBtn]}
                        onPress={() => {
                            onTypeChange?.('Manual');
                            setShowDatePicker(true);
                        }}
                    >
                        <Ionicons
                            name="create-outline"
                            size={16}
                            color={currentType === 'Manual' ? '#FFF' : (isDarkMode ? '#999' : '#666')}
                        />
                        <Text style={[styles.typeText, currentType === 'Manual' && styles.activeHeaderText, isDarkMode && currentType !== 'Manual' && styles.textWhite]}>Əl ilə</Text>
                    </TouchableOpacity>
                </View>

                {currentType === 'Manual' && (
                    <View style={[styles.manualInputContainer, isDarkMode && styles.manualInputContainerDark]}>
                        {Platform.OS === 'web' ? (
                            <input
                                type="date"
                                min={getMinDate().toISOString().split('T')[0]}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E5EA',
                                    backgroundColor: isDarkMode ? '#1C1C1E' : '#FFF',
                                    color: isDarkMode ? '#FFF' : '#000',
                                    fontSize: '16px',
                                    width: '100%',
                                    outline: 'none',
                                    borderWidth: 1
                                }}
                                onChange={(e) => {
                                    const selected = new Date(e.target.value);
                                    selected.setHours(0, 0, 0, 0);
                                    const min = getMinDate();
                                    min.setHours(0, 0, 0, 0);

                                    if (selected < min) {
                                        alert('Keçmiş və ya yaxın tarixləri seçmək mümkün deyil. Minimum 5 gün sonranı seçin.');
                                        e.target.value = '';
                                        onDateChange?.(undefined);
                                        return;
                                    }
                                    if (selected.getDay() === 0) {
                                        alert('Bazar günü çatdırılma mümkün deyil.');
                                        e.target.value = '';
                                        onDateChange?.(undefined);
                                        return;
                                    }
                                    onDateChange?.(selected);
                                }}
                            />
                        ) : (
                            <TouchableOpacity
                                style={[styles.manualPickerTrigger, isDarkMode && styles.manualPickerTriggerDark]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={isDarkMode ? '#FFF' : '#000'} />
                                <Text style={[styles.manualPickerText, isDarkMode && styles.textWhite]}>
                                    {manualDate ? formatDate(manualDate) : 'Gün, ay və ili seçmək üçün toxun'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {showDatePicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={manualDate || getMinDate()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={getMinDate()}
                                onChange={handleDateChange}
                                accentColor="#007AFF"
                                themeVariant={isDarkMode ? 'dark' : 'light'}
                            />
                        )}
                    </View>
                )}

                <View style={[styles.estimateBox, isDarkMode && styles.estimateBoxDark]}>
                    <View style={styles.estimateHeader}>
                        <Ionicons name="calendar-outline" size={20} color={isDarkMode ? '#FFF' : '#000'} />
                        <Text style={[styles.estimateLabel, isDarkMode && styles.textLightGray]}>
                            {currentType === 'Manual' ? 'Seçdiyiniz tarix:' : 'Təxmini çatdırılma:'}
                        </Text>
                    </View>
                    <Text style={[styles.estimateDate, isDarkMode && styles.textWhite]}>
                        {currentType === 'Manual' && !manualDate ? 'Lütfən tarix təyin edin' : deliveryEstimate}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#F2F2F7', borderRadius: 20 },
    containerDark: { backgroundColor: '#1C1C1E' },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 4 },
        }),
    },
    productCardDark: { backgroundColor: '#2C2C2E' },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    productName: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', flex: 1, marginRight: 10 },
    productPrice: { fontSize: 18, fontWeight: '800', color: '#007AFF' },
    divider: { height: 1, backgroundColor: '#E5E5EA', marginBottom: 20 },
    dividerDark: { backgroundColor: '#3A3A3C' },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 12 },
    shippingToggle: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20 },
    toggleDark: { backgroundColor: '#3A3A3C' },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    activeBtn: { backgroundColor: '#007AFF' },
    typeText: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
    activeHeaderText: { color: '#FFFFFF' },
    manualInputContainer: { marginBottom: 20, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
    manualInputContainerDark: { backgroundColor: '#3A3A3C', borderColor: '#48484A' },
    manualPickerTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 10 },
    manualPickerTriggerDark: { backgroundColor: '#3A3A3C' },
    manualPickerText: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#333' },
    estimateBox: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, alignItems: 'center' },
    estimateBoxDark: { backgroundColor: '#3A3A3C' },
    estimateHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    estimateLabel: { fontSize: 13, fontWeight: '500', color: '#636366' },
    estimateDate: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
    textWhite: { color: '#FFFFFF' },
    textLightGray: { color: '#8E8E93' },
});

export default DeliverySystem;
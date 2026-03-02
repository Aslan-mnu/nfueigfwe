import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

export default function TabLayout() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            const theme = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(theme === 'true');
        };
        loadTheme();

        const subscription = DeviceEventEmitter.addListener('themeChanged', (value) => {
            setIsDarkMode(value);
        });

        return () => subscription.remove();
    }, []);

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: isDarkMode ? '#888' : '#999',
            tabBarStyle: {
                paddingBottom: 5,
                height: 60,
                backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                borderTopColor: isDarkMode ? '#333' : '#EEEEEE',
            },
            tabBarLabelStyle: {
                fontFamily: 'Inter-Medium',
                fontSize: 10,
                marginTop: -5,
                marginBottom: 5,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Əsas',
                    tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Axtar',
                    tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Xəritə',
                    tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Səbət',
                    tabBarIcon: ({ color }) => <Ionicons name="bag-handle-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}

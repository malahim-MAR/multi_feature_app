import { Stack } from 'expo-router';

export default function CVLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="editor" />
            <Stack.Screen name="preview" />
        </Stack>
    );
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAUDE_KEY_STORAGE = 'claude_api_key';

export const getClaudeApiKey = async (): Promise<string> => {
    try {
        const key = await AsyncStorage.getItem(CLAUDE_KEY_STORAGE);
        return key || '';
    } catch {
        return '';
    }
};

export const setClaudeApiKey = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(CLAUDE_KEY_STORAGE, key);
    } catch (e) {
        console.error("AsyncStorage error setting Claude key", e);
    }
};

export interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const callClaudeAPI = async (
    systemPrompt: string,
    userMessage: string
): Promise<string> => {
    const apiKey = await getClaudeApiKey();
    if (!apiKey) {
        throw new Error('Claude API key not set. Go to Settings to add your API key.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No response received.';
};

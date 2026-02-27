import AsyncStorage from '@react-native-async-storage/async-storage';

const CVS_KEY = 'cv_list';

export interface CVWorkExperience {
    company: string;
    role: string;
    duration: string;
    description: string;
}

export interface CVEducation {
    institution: string;
    degree: string;
    year: string;
}

export interface CVData {
    id: string;
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    summary: string;
    experience: CVWorkExperience[];
    education: CVEducation[];
    skills: string[];
    languages: string[];
    projects: { name: string; description: string }[];
    certifications: string[];
    template: 'classic' | 'modern' | 'minimal';
    createdAt: string;
    updatedAt: string;
}

export const getEmptyCV = (): CVData => ({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    name: '', email: '', phone: '', linkedin: '', summary: '',
    experience: [], education: [], skills: [], languages: [],
    projects: [], certifications: [],
    template: 'classic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

export const getAllCVs = async (): Promise<CVData[]> => {
    try {
        const json = await AsyncStorage.getItem(CVS_KEY);
        if (!json) return [];
        return JSON.parse(json) as CVData[];
    } catch { return []; }
};

export const getCVById = async (id: string): Promise<CVData | null> => {
    const all = await getAllCVs();
    return all.find(c => c.id === id) || null;
};

export const saveCV = async (cv: CVData): Promise<void> => {
    try {
        const all = await getAllCVs();
        const idx = all.findIndex(c => c.id === cv.id);
        cv.updatedAt = new Date().toISOString();
        if (idx >= 0) all[idx] = cv; else all.unshift(cv);
        await AsyncStorage.setItem(CVS_KEY, JSON.stringify(all));
    } catch (e) {
        console.error("AsyncStorage error setting CV", e);
    }
};

export const deleteCV = async (id: string): Promise<void> => {
    try {
        const all = await getAllCVs();
        await AsyncStorage.setItem(CVS_KEY, JSON.stringify(all.filter(c => c.id !== id)));
    } catch (e) {
        console.error("AsyncStorage error deleting CV", e);
    }
};

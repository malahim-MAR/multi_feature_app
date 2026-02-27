/**
 * ╔═══════════════════════════════════════════╗
 * ║   GLOBAL THEME — White Minimal Design    ║
 * ╚═══════════════════════════════════════════╝
 */

export const Colors = {
    background: '#FFFFFF',
    card: '#F5F5F7',
    primary: '#6C63FF',       // Purple accent
    secondary: '#00D4AA',     // Teal accent
    textPrimary: '#1A1A1A',
    textSecondary: '#7A7A8C',
    border: '#E8E8EE',
    danger: '#FF4757',
    warning: '#FFD700',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',

    // Category colors for Expense Tracker
    categoryFood: '#FF6B6B',
    categoryRent: '#6C63FF',
    categoryTransport: '#00D4AA',
    categoryShopping: '#FFD700',
    categoryBills: '#FF8C42',
    categoryOther: '#7A7A8C',

    // Quiz difficulty
    easy: '#2ED573',
    medium: '#FFA502',
    hard: '#FF4757',
};

export const Typography = {
    heading: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 24,
        color: Colors.textPrimary,
    },
    headingSmall: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    body: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    bodySmall: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    label: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    button: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: Colors.white,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    full: 999,
};

export const Shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    button: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
};

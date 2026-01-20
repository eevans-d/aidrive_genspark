import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock User type
interface User {
        id: string;
        email: string;
        role: string;
}

interface AuthContextType {
        user: User | null;
        session: any | null;
        loading: boolean;
        signIn: (email: string, password: string) => Promise<{ error: any }>;
        signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
        const context = useContext(AuthContext);
        if (context === undefined) {
                throw new Error('useAuth must be used within an AuthProvider');
        }
        return context;
};

interface MockAuthProviderProps {
        children: ReactNode;
        initialUser?: User | null;
        initialLoading?: boolean;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
        children,
        initialUser = { id: 'test-user', email: 'test@example.com', role: 'admin' },
        initialLoading = false
}) => {
        const [user, setUser] = useState<User | null>(initialUser);
        const [loading, setLoading] = useState(initialLoading);

        const signIn = async () => {
                setUser({ id: 'test-user', email: 'test@example.com', role: 'admin' });
                return { error: null };
        };

        const signOut = async () => {
                setUser(null);
                return { error: null };
        };

        const value = {
                user,
                session: user ? { user } : null,
                loading,
                signIn,
                signOut
        };

        return (
                <AuthContext.Provider value={value}>
                        {children}
                </AuthContext.Provider>
        );
};

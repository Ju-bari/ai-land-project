import { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
    id: string
    name: string
}

interface AuthContextType {
    user: User | null
    login: (name: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>({
        id: 'user-1',
        name: 'Guest User',
    })

    function login(name: string) {
        setUser({
            id: `user-${Math.random().toString(36).substr(2, 9)}`,
            name,
        })
    }

    function logout() {
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

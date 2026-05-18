'use client'

import { createContext, useContext, type ReactNode } from 'react'

const CapabilitiesContext = createContext<string[]>([])
const PersonaIdContext = createContext<string | undefined>(undefined)
const UserAttributesContext = createContext<string[]>([])

export function useCapabilities() {
  return useContext(CapabilitiesContext)
}

export function usePersonaId() {
  return useContext(PersonaIdContext)
}

export function useUserAttributes() {
  return useContext(UserAttributesContext)
}

export function can(caps: string[], required: string): boolean {
  return caps.includes(required)
}

export function canAny(caps: string[], required: string[]): boolean {
  return required.some(r => caps.includes(r))
}

export function CapabilitiesProvider({
  children,
  capabilities,
  personaId,
  userAttributes,
}: {
  children: ReactNode
  capabilities: string[]
  personaId?: string
  userAttributes: string[]
}) {
  return (
    <CapabilitiesContext.Provider value={capabilities}>
      <PersonaIdContext.Provider value={personaId}>
        <UserAttributesContext.Provider value={userAttributes}>
          {children}
        </UserAttributesContext.Provider>
      </PersonaIdContext.Provider>
    </CapabilitiesContext.Provider>
  )
}

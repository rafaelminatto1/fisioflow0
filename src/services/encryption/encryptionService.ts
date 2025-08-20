import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export class EncryptionService {
  static encrypt(text: string): string {
    if (!text) return text
    
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }
  
  static decrypt(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData
    
    try {
      const parts = encryptedData.split(':')
      if (parts.length !== 3) return encryptedData
      
      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv)
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      return encryptedData
    }
  }
  
  static hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}

// Helper functions para campos específicos
export const encryptCPF = (cpf: string): string => {
  return EncryptionService.encrypt(cpf.replace(/\D/g, ''))
}

export const decryptCPF = (encryptedCpf: string): string => {
  return EncryptionService.decrypt(encryptedCpf)
}

export const encryptPhone = (phone: string): string => {
  return EncryptionService.encrypt(phone.replace(/\D/g, ''))
}

export const decryptPhone = (encryptedPhone: string): string => {
  return EncryptionService.decrypt(encryptedPhone)
}

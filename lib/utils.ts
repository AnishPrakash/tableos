import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-orange-100 text-orange-800 border-orange-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    served: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    available: 'bg-emerald-100 text-emerald-800',
    occupied: 'bg-red-100 text-red-800',
    reserved: 'bg-blue-100 text-blue-800',
    cleaning: 'bg-yellow-100 text-yellow-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    seated: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getTimeElapsed(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 60000)
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`
}
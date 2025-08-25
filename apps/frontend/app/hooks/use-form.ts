import { useState, useCallback, ChangeEvent } from 'react'

export interface FormField<T = string> {
  value: T
  error?: string
  touched: boolean
}

export interface UseFormOptions<T> {
  initialValues: T
  validationRules?: Partial<Record<keyof T, (value: T[keyof T]) => string | null>>
  onSubmit?: (values: T) => void | Promise<void>
}

export interface UseFormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  setValue: (field: keyof T, value: T[keyof T]) => void
  setError: (field: keyof T, error: string) => void
  setTouched: (field: keyof T, touched: boolean) => void
  handleChange: (field: keyof T) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleBlur: (field: keyof T) => () => void
  handleSubmit: (event?: React.FormEvent) => Promise<void>
  reset: (newValues?: T) => void
  validateField: (field: keyof T) => string | null
  validateForm: () => boolean
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationRules = {},
  onSubmit
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((field: keyof T): string | null => {
    const validator = validationRules[field]
    if (!validator) return null
    
    return validator(values[field])
  }, [values, validationRules])

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field as keyof T)
      if (error) {
        newErrors[field as keyof T] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validateField, validationRules])

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when value changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const setTouched = useCallback((field: keyof T, touched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: touched }))
  }, [])

  const handleChange = useCallback((field: keyof T) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(field, event.target.value as T[keyof T])
    }
  }, [setValue])

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(field, true)
      
      // Validate field on blur if it has a validator
      if (validationRules[field]) {
        const error = validateField(field)
        if (error) {
          setError(field, error)
        }
      }
    }
  }, [setTouched, validationRules, validateField, setError])

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault()
    }

    setIsSubmitting(true)

    try {
      const isValid = validateForm()
      
      if (isValid && onSubmit) {
        await onSubmit(values)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, onSubmit, values])

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setTouchedState({})
    setIsSubmitting(false)
  }, [initialValues])

  const isValid = Object.keys(validationRules).every(field => !errors[field as keyof T])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validateField,
    validateForm
  }
}
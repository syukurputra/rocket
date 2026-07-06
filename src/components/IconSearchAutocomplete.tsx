'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'

import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

export type IconOption = { id: string; nama: string; code: string }

type Props = {
  value: IconOption | null
  onChange: (icon: IconOption | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
}

const IconSearchAutocomplete = ({ value, onChange, label = 'Icon', required, disabled }: Props) => {
  const [options, setOptions] = useState<IconOption[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Saat value berubah dari luar (misal mode edit), pastikan value ada di options
  useEffect(() => {
    if (value && !options.find(o => o.id === value.id)) {
      setOptions(prev => [value, ...prev.filter(o => o.id !== value.id)])
    }
  }, [value])

  const search = useCallback(async (keyword: string) => {
    if (keyword.trim().length < 2) {
      setOptions(prev => (value ? [value] : []))
      return
    }

    setLoading(true)
    try {
      const res = await apiFetchClient<IconOption[]>(
        `/api/master/icon/dropdown?search=${encodeURIComponent(keyword.trim())}`,
        undefined,
        { redirectOn401: '/login' }
      )

      setOptions(res || [])
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [value])

  const handleInputChange = (_: any, newInput: string) => {
    setInputValue(newInput)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(newInput), 300)
  }

  return (
    <Autocomplete
      options={options}
      value={value}
      inputValue={inputValue}
      onChange={(_, newValue) => onChange(newValue)}
      onInputChange={handleInputChange}
      getOptionLabel={option => option.nama}
      filterOptions={x => x}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      loading={loading}
      disabled={disabled}
      noOptionsText={inputValue.length < 2 ? 'Ketik minimal 2 karakter...' : 'Icon tidak ditemukan'}
      renderInput={params => (
        <CustomTextField
          {...params}
          label={label}
          placeholder='Cari icon...'
          variant='outlined'
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={16} />}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as any

        return (
          <li key={key} {...rest}>
            <div className='flex items-center gap-2'>
              <i className={option.code} />
              <span>{option.nama}</span>
              <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>{option.code}</span>
            </div>
          </li>
        )
      }}
    />
  )
}

export default IconSearchAutocomplete

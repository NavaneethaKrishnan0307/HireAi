import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

/**
 * CustomSearchableDropdown:
 * Guaranteed downward-opening dropdown with search filter and flag/icon support.
 */
export default function CustomSearchableDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  icon: Icon,
  style = {},
  dropdownWidth,
  searchPlaceholder = 'Search...',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Normalize options to { value, label, flag, sublabel }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return {
      value: opt.value ?? opt.code ?? opt.country ?? opt.city,
      label: opt.label ?? opt.name ?? opt.country ?? opt.city ?? opt.value,
      flag: opt.flag,
      sublabel: opt.sublabel ?? opt.dialCode ?? opt.code
    };
  });

  const selectedItem = normalizedOptions.find((o) => o.value === value);

  // Filter based on search
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.value && opt.value.toLowerCase().includes(term)) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  });

  const handleSelect = (itemValue) => {
    onChange(itemValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        ...style
      }}
    >
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          width: '100%',
          height: '44px',
          padding: '0 12px',
          border: isOpen ? '1.5px solid #1d68f6' : '1.5px solid #cbd5e1',
          borderRadius: '8px',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(29, 104, 246, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {Icon && <Icon size={15} color="#64748b" style={{ flexShrink: 0 }} />}
          {selectedItem?.flag && <span style={{ fontSize: '15px', flexShrink: 0 }}>{selectedItem.flag}</span>}
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: selectedItem ? '#0f172a' : '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {selectedItem
              ? `${selectedItem.flag ? '' : ''}${selectedItem.label}${selectedItem.sublabel && selectedItem.sublabel !== selectedItem.value ? ` (${selectedItem.sublabel})` : ''}`
              : placeholder}
          </span>
        </div>

        <ChevronDown
          size={16}
          color="#64748b"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </div>

      {/* Downward Dropdown Menu Panel (ALWAYS STRICTLY DOWNWARDS) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: dropdownWidth || '100%',
            minWidth: '220px',
            maxHeight: '260px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'dropdownFadeDown 0.15s cubic-bezier(0, 0, 0.2, 1)'
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={14} color="#94a3b8" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '12px',
                color: '#0f172a'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '4px 0'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={`${opt.value}-${opt.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: isSelected ? '#1d68f6' : '#1e293b',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      fontWeight: isSelected ? '600' : '400',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.1s ease',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {opt.flag && <span style={{ fontSize: '14px', flexShrink: 0 }}>{opt.flag}</span>}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opt.label}
                      </span>
                      {opt.sublabel && opt.sublabel !== opt.value && (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>({opt.sublabel})</span>
                      )}
                    </div>

                    {isSelected && <Check size={14} color="#1d68f6" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

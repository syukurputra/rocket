"""
Script to update all dialog files with smooth loading pattern
"""

import re
from pathlib import Path

# Pattern yang sama untuk semua dialog
SMOOTH_LOADING_PATTERN = {
    # Remove pendingSaved state
    'remove_pending_saved': (
        r'const \[pendingSaved, setPendingSaved\] = useState<\w+Client \| null>\(null\)',
        ''
    ),

    # Simplify handleSnackClose
    'simplify_snack_close': (
        r'const handleSnackClose = \(\) => \{\s+setSnack\(prev => \(\{ \.\.\.prev, open: false \}\)\)\s+if \(pendingSaved\) \{\s+onSaved\?\.\(pendingSaved\)\s+setPendingSaved\(null\)\s+router\.refresh\(\)\s+\}\s+setOpen\(false\).*?\}',
        'const handleSnackClose = () => {\n    setSnack(prev => ({ ...prev, open: false }))\n  }'
    ),

    # Update edit block
    'update_edit_block': (
        r'(setPendingSaved\(json\.data\)\s+setSnack\(\{ open: true, message: json\.message.*?\}\)\s+setTimeout\(\(\) => \{\s+window\.location\.reload\(\)\s+\}, 3000\))',
        '''// Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Data berhasil diupdate', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)'''
    ),

    # Update create block
    'update_create_block': (
        r'(setPendingSaved\(json\.data\)\s+setSnack\(\{ open: true, message: json\.message.*?\}\)\s+setTimeout\(\(\) => \{\s+window\.location\.reload\(\)\s+\}, 3000\))',
        '''// Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Data berhasil ditambahkan', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)'''
    ),

    # Remove finally block
    'remove_finally': (
        r'\} finally \{\s+setSaving\(false\)\s+\}',
        '      setSaving(false)\n    }'
    )
}

# Files to update
DIALOG_FILES = [
    'd:/Code/Koyeb/rocket/src/components/dialogs/aset/index.tsx',
    'd:/Code/Koyeb/rocket/src/components/dialogs/keuangan/index.tsx',
    'd:/Code/Koyeb/rocket/src/components/dialogs/master/paket/index.tsx',
]

def update_dialog_file(file_path):
    """Update a single dialog file with smooth loading pattern"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Apply all patterns
        for pattern_name, (pattern, replacement) in SMOOTH_LOADING_PATTERN.items():
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)

        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {file_path}")
            return True
        else:
            print(f"- No changes needed: {file_path}")
            return False

    except Exception as e:
        print(f"✗ Error updating {file_path}: {e}")
        return False

def main():
    print("Updating dialog files with smooth loading pattern...\n")

    updated_count = 0
    for file_path in DIALOG_FILES:
        if update_dialog_file(file_path):
            updated_count += 1

    print(f"\n✓ Updated {updated_count}/{len(DIALOG_FILES)} files")

if __name__ == '__main__':
    main()
